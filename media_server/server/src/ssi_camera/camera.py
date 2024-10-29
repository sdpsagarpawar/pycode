import threading
import json
import os

from dataclasses import dataclass

from typing import Optional

import cv2
import zmq

import ssi_camera.env_vars as env_vars

from ssi_camera import app

@dataclass
class CameraUnreachable(Exception):
    """
    The string passed to camera constructor looks good, but camera unreachable.
    """
    message: str


@dataclass
class Camera:
    """
    Generic camera representation.
    """
    cv_desc: str
    cid: int
    dwnsize: float = 1

    def __post_init__(self):
        if not env_vars.resize_delim in self.cv_desc:
            return

        tail = self.cv_desc.split(env_vars.resize_delim)[-1].strip()
        if not tail.replace(".", "", 1).isdigit():
            Exception(f"Resize factor (after \"{env_vars.resize_delim}\") must be a float: {self.cv_desc}.")

        self.dwnsize = float(tail)

        head = ''.join(self.cv_desc.split(env_vars.resize_delim)[:-1]).strip()
        self.cv_desc = head

    def generate_frames(self):
        """
        Create the OpenCV capture for the camera. Create the local publisher socket with ZeroMQ.
        Publish JPG encoded frames on the socket as fast as possible.

        Publish socket are bound at `env_vars.zmq_port + self.cid`.

        Call this method in a separate thread.
        """
        try:
            capture = cv2.VideoCapture(self.cv_desc)
        except Exception as e:
            print(f"Exception constructing capture for: {self.cid} --> {self.cv_desc}. "
                  f"Ending the publisher thread. Exception: {e}")
            return

        if not capture.isOpened():
            print(f"Capture for: {self.cid} --> {self.cv_desc} has not open properly. "
                  "Ending the publisher thread.")
            return

        context = zmq.Context()
        publisher = context.socket(zmq.PUB)
        publisher.setsockopt(zmq.SNDHWM, 1)
        port = int(env_vars.zmq_port) + self.cid
        publisher.bind(f"tcp://*:{port}")

        print(f"Bound publisher for cid: {self.cid} to port {port}")

        w, h = capture.get(cv2.CAP_PROP_FRAME_WIDTH), capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        new_w, new_h = int(w / self.dwnsize), int(h / self.dwnsize)

        print(f"Streaming {new_w}x{new_h} video from {self.cid} --> {self.cv_desc}.")

        while True:
            success, frame = capture.read()

            if not success:
                print(f"Frame read failed for cid: {self.cid} --> {self.cv_desc}. Continuing.")
                continue

            frame = cv2.resize(frame, (new_w, new_h))

            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            body = (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

            publisher.send(body)


@dataclass
class WiredCamera(Camera):
    """
    USB-connected camera.
    """
    def __post_init__(self):
        super().__post_init__()

        if not self.cv_desc.isdigit():
            raise Exception("Descriptor for USB camera must be an integer.")

        self.cv_desc = int(self.cv_desc)


@dataclass
class RTSPCamera(Camera):
    """
    RTSP-connected camera
    """
    def __post_init__(self):
        super().__post_init__()

        if not self.cv_desc.startswith('rtsp://'):
            raise Exception("Descriptor for RTSP camera must start with \"rtsp://\".")


def construct_camera(cid: int, cv_desc: str) -> Optional[Camera]:
    """
    Construct the `Camera` from the CV description string.
    """
    constructor_attempts = [WiredCamera, RTSPCamera]
    for camera_constructor in constructor_attempts:
        try:
            return camera_constructor(cid=cid, cv_desc=cv_desc)
        except CameraUnreachable:
            return
        except:
            continue

def resolve(cam_id: str) -> Optional[str]:
    """
    Resolve camera IDs to corresponding CV description scripts.
    """
    mapping = app.config['camera_mapping']

    if cam_id in mapping:
        camera_cv_descriptor = mapping[cam_id]
        app.logger.info(f"Resolving camera {cam_id} ---> {camera_cv_descriptor}.")
        return camera_cv_descriptor

def boot_cameras() -> None:
    """
    Boot up all cameras and make them publish frames over ZeroMQ.
    Subscribers should connect to the publisher socket from their own process.

    Each camera has its own thread in which it reads frames from the device.
    The camera threads write back to the main publisher thread through a PAIR zeroMQ socket.
    """
    if os.path.exists(env_vars.camera_mapping_path):
        with open(env_vars.camera_mapping_path, 'r') as f:
            camera_mapping = json.load(f)
    else:
        raise Exception(f"Set up camera mapping file in {env_vars.config_file_path}.")

    for cid, cv_desc in camera_mapping.items():
        c = construct_camera(cid=int(cid), cv_desc=cv_desc)

        if not c:
            raise Exception(f"{cv_desc} cannot be resolved to a camera")

        t = threading.Thread(target=c.generate_frames)
        t.start()
        print(f"Thread for camera {cid} started.")
