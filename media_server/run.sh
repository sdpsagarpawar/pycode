#!/usr/bin/env bash

docker                                      \
    --volume ~/.ssi_camera_demo/:/conf/     \
    --device /dev/video0:/dev/video0        \
    media_server
