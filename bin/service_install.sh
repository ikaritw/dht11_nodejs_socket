#!/usr/bin/env bash
cp dht11_nodejs_socket.service /etc/systemd/system
# 重載安裝文件
systemctl daemon-reload