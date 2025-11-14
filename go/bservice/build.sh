#!/usr/bin/env bash
set -e
docker build --no-cache --platform=linux/amd64 -t saichler/business-web:latest ..
docker push saichler/business-web:latest
