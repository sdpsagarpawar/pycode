import sys
import json

import requests
import zmq
import redis

from uuid import uuid4

from flask import Response, request, abort, jsonify

from ssi_camera import app
from ssi_camera.camera import resolve
from ssi_camera.access_control import VerifiablePresentation, require_access_control, MeetingTimingError
from ssi_camera.session_store import Store
from ssi_camera.env_vars import zmq_port, redis_port

@app.errorhandler(401)
def forbidden_error_handler(_):
    return Response(status=401,
                    headers={'Access-Control-Allow-Origin': '*'})

@app.route('/auth', methods=['POST'])
def auth():
    """
    Authenticate the client.

    Assign a session id (SID) to the response if the submitted VP verifies.

    TODO: There are security concern here. Instead of sending SIDs as request parameters, consider using Set-Cookie.
    Consider the expiration and cleanup strategies for stored SIDs.
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
    """
    try:
        vp_json = json.loads(request.data)
    except:
        return Response("Malformed request parameters.", status=400)

    try:
        vp = VerifiablePresentation(vp_json)
        vp.verify()
    except MeetingTimingError as mte:
        app.logger.info(f"MeetingTimingError: {mte}")
        abort(401)
    except Exception as e:
        app.logger.error(e)
        abort(401)

    # assign a SID to VP and return the SID to the client
    session_id = str(uuid4())
    Store().set(session_id, vp)

    app.logger.info(f"Authenticated sid: {session_id}")

    return {"sid": session_id}, 200

@app.route('/camera-feed/<cam_id>')
@require_access_control
def camera_feed(cam_id: str):
    """
    Resolve the requested camera. Subscribe to the corresponding 0MQ topic.
    Forward the frames as a multipart HTTP response.
    """
    camera = resolve(cam_id)
    publisher_port = int(zmq_port) + int(cam_id)

    if not camera:
        abort(403)

    try:
        context = zmq.Context()
        subscriber = context.socket(zmq.SUB)
        subscriber.setsockopt_string(zmq.SUBSCRIBE, "")
        subscriber.connect(f"tcp://localhost:{publisher_port}")
    except Exception as e:
        app.logger.error(f"Cannot open a subscribe socket for camera id {cam_id}: {e}")
        abort(403)

    def emit_frames(subscriber):
        while True:
            message = subscriber.recv()
            yield message

    return Response(emit_frames(subscriber),
                    mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route('/')
def index():
    return Response(status=200)

def health_check() -> None:
    """
    Basic health check of the verifier backend and Redis session store.
    """
    verifier_url = app.config['config_file']['verifier_url']
    response = 'No response'

    try:
        response = requests.options(verifier_url)

        if not (response.ok or response.status_code == 405):
            raise Exception
    except Exception as e:
        app.logger.error(f"Health check failed: {verifier_url} response is {response}.\n"
                         f"{e}")

    redis_client = redis.Redis(host='localhost', port=int(redis_port), db=0)
    response = redis_client.ping()

    if not response:
        app.logger.error(f"Redis on port {redis_port} does not respond.")

def main():
    host, port = None, None

    if len(sys.argv) > 1:
        host, port = sys.argv[1].split(":")
        port = int(port)

    app.run(debug=True, use_reloader=False, host=host, port=port)
