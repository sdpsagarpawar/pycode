#!/usr/bin/env bash
# Run the two backend services natively

set -e

cleanup() {
    kill 0
    exit
}

trap cleanup SIGINT SIGTERM

echo "Flushing Redis DB..."
echo "FLUSHDB" | redis-cli

export PYTHONUNBUFFERED=1
stdbuf -oL -eL ssic-publish 2>&1 >publish.log &

gunicorn -b 100.71.82.11:30001 -w 32 -t 0 -k gevent --log-level DEBUG ssi_camera:app
