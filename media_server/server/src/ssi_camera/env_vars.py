import os

flask_secret_env = "FLASK_SECRET"
camera_mapping_env = "SCS_CAMERA_MAPPING"
resize_delim_env = "SCS_RESIZE_DELIM"
config_file_env = "CONFIG"
zmq_port_env = "SSI_ZMQ_PORT"
redis_port_env = "SSI_REDIS_PORT"

flask_secret_default = "a terrible key"
camera_mapping_path_default = "~/.ssi_camera_demo/camera_mapping.json"
config_file_path_default = "~/.ssi_camera_demo/conf.json"
resize_delim_default = ";"
session_store_default = "~/.ssi_camera_demo/.session_store"
zmq_port_default = 5555
redis_port_default = 6379

flask_secret = os.environ.get(flask_secret_env) or flask_secret_default

camera_mapping_path = os.environ.get(camera_mapping_env) or camera_mapping_path_default
camera_mapping_path = os.path.expanduser(camera_mapping_path)

config_file_path = os.environ.get(config_file_env) or config_file_path_default
config_file_path = os.path.expanduser(config_file_path)

resize_delim = os.environ.get(resize_delim_env) or resize_delim_default

zmq_port = os.environ.get(zmq_port_env) or zmq_port_default
redis_port = os.environ.get(redis_port_env) or redis_port_default
