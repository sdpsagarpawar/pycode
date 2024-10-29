import logging
import os
import json

from flask import Flask

from flask_cors import CORS

app = Flask("ssi-organizer")


CORS(app)

# set up logging
gunicorn_logger = logging.getLogger('gunicorn.error')
app.logger.handlers = gunicorn_logger.handlers
app.logger.setLevel(gunicorn_logger.level)


import ssi_organizer.main
