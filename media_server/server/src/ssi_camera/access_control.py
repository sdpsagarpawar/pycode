import json

from datetime import datetime, timedelta

from flask import abort, request

from functools import wraps
from dataclasses import dataclass
import requests

from typing import Dict, Optional

from ssi_camera import app
from ssi_camera.session_store import Store

@dataclass
class SSIVerifyError(Exception):
    message: str


@dataclass
class MeetingTimingError(Exception):
    message: str


class VerifiablePresentation(dict):
    def __init__(self, *arg, **kw):
        super(VerifiablePresentation, self).__init__(*arg, **kw)

    def get_credential(self, idx: int = 0) -> Optional[Dict[str, str]]:
        """
        Extract the credential subject part of `VerifiablePresentation`.
        """
        try:
            creds: str = self['verifiableCredential'][idx]
            creds_subj = json.loads(creds)['credentialSubject']
            return creds_subj
        except Exception as e:
            app.logger.error(f"Error in `get_credentials`: {e}")

    def get_cameras(self):
        vc = self.get_credential()
        cam_str = vc["cameras"]
        return [int(x) for x in cam_str.split(';')]

    def check_meeting_timing(self) -> Optional[str]:
        """
        Check if the timing contained in the `vp` is valid.

        If `minutes_before_meeting` in the config file is negative, the timing check is entirely ignored.
        """
        minutes_before = int(app.config['config_file']['minutes_before_meeting'])

        if minutes_before < 0:
            return

        creds = self.get_credential()
        if not creds:
            return "Cannot parse credentials."

        meeting_start_time = creds['meetingStartTime']
        meeting_duration = creds['meetingDuration']

        format_str = '%Y-%m-%dT%H:%M:%S.%fZ'
        start = datetime.strptime(meeting_start_time, format_str)
        end = start + timedelta(minutes=int(meeting_duration))
        current = datetime.utcnow()

        # Calculate the allowed time range
        allowed_start = start - timedelta(minutes=minutes_before)
        allowed_end = end

        # Check if the current time is within the allowed range
        if allowed_start <= current <= allowed_end:
            return
        elif current < allowed_start:
            return "Meeting happens in the future."
        else:
            return "Meeting happened in the past."


    def verify(self) -> None:
        verifier_url = app.config['config_file']['verifier_url']

        try:
            response = requests.post(verifier_url,
                                     data=json.dumps(self),
                                     headers={"Content-Type": "application/json"})
        except Exception as e:
            verr = SSIVerifyError(f"Exception calling verifier at {verifier_url} with\n{self}\nException:\n{e}")
            app.logger.info(verr.message)
            raise verr

        if not response.ok:
            verr = SSIVerifyError("Verification fails, verifier status code not OK."
                                  f"Response: {response}. For:\n{self}")
            app.logger.info(verr.message)
            raise verr

        # verifier must return the field 'result' and it must be True
        response_result = response.json()

        if "success" not in response_result or not response_result["success"]:
            verr = SSIVerifyError(f"Verifier responds with: {response_result}.")
            app.logger.info(verr.message)
            raise verr

        timing_errors = self.check_meeting_timing()
        if timing_errors:
            raise MeetingTimingError(f"{timing_errors}")

def has_access(cam_id: int) -> bool:
    """
    Checks whether the credentials in the current session grant access to the given camera.
    """
    if "sid" not in request.args:
        app.logger.info("No sid in request.")
        return False

    sid = request.args.get("sid")
    vp_json = Store().get(sid)

    if not vp_json:
        app.logger.info(f"No associated VP for sid: {sid}")
        return False

    try:
        vp = VerifiablePresentation(vp_json)
    except Exception as e:
        app.logger.error(f"Error parsing VP in `has_access`: {e}")
        return False

    cameras = vp.get_cameras()
    timing_error = vp.check_meeting_timing()

    if cam_id in cameras:
        if not timing_error:
            return True
        else:
            app.logger.info(f"{cam_id} is in {cameras}, but timing error: {timing_error}.")
            return False
    else:
        app.logger.info(f"{cam_id} is not in {cameras}.")
        return False

def require_access_control(f):
    """
    Decorator for routes that require access control.
    """
    @wraps(f)
    def with_auth(*args, **kwargs):
        cam_id = int(kwargs['cam_id'])
        if not has_access(cam_id):
            abort(403)

        return f(*args, **kwargs)

    return with_auth
