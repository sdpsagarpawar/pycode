import logging
import os
import json

from flask import Flask

import ssi_camera.env_vars as env_vars

app = Flask("ssi-camera")
app.secret_key = env_vars.flask_secret

# set up logging
gunicorn_logger = logging.getLogger('gunicorn.error')
app.logger.handlers = gunicorn_logger.handlers
app.logger.setLevel(gunicorn_logger.level)

# set up other configuration
if os.path.exists(env_vars.config_file_path):
    with open(env_vars.config_file_path, 'r') as f:
        config_file = json.load(f)
else:
    raise Exception(f"Set up your configuration file in {env_vars.config_file_path}.")

if os.path.exists(env_vars.camera_mapping_path):
    with open(env_vars.camera_mapping_path, 'r') as f:
        camera_mapping = json.load(f)
else:
    raise Exception(f"Set up your camera mapping in {env_vars.camera_mapping_path}.")

config = {'camera_mapping': camera_mapping,
          'config_file': config_file}

app.config.update(config)

import ssi_camera.main
ssi_camera.main.health_check()
