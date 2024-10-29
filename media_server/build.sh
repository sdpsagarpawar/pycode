#!/usr/bin/env bash
# Build the linux containers on a Mac and export the image

docker buildx build --platform linux/amd64 -t ssic-api -f Dockerfile.api .j
docker buildx build --platform linux/amd64 -t ssic-publisher -f Dockerfile.publisher .j
docker save -o ssic-api.tar ssic-api
docker save -o ssic-publisher.tar ssic-publisher
