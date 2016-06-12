# DHT-11 on Raspberry Pi with NodeJS

## Getting started

- Raspberry PI B
- raspbian Debian Linux 8.0
- [NodeJS 6.1.0](https://nodejs.org/dist/v6.1.0/node-v6.1.0-linux-armv6l.tar.xz)
- [BCM2835 1.5](http://www.airspayce.com/mikem/bcm2835/)
- [node-dht-sensor](https://github.com/momenso/node-dht-sensor)
- sensor DHT-11

## TO-DO

- Log to Google Doc
- Log to mongoDB
- Log to AWS
- Add Blynk App

## Systemd系統

# 安裝設定文件到 Systemd 

> $ sudo cp dht11_nodejs_socket.service /etc/systemd/system

# 重載安裝文件

> $ sudo systemctl daemon-reload

# 啟動服務

> $ sudo systemctl start dht11_nodejs_socket

# 查看状态

> $ sudo systemctl status dht11_nodejs_socket

# 查看日志

> $ sudo journalctl -u dht11_nodejs_socket

# 输出最新日誌

> $ sudo journalctl --follow -u dht11_nodejs_socket

# 重啟服務

> $ sudo systemctl restart dht11_nodejs_socket

# 停止服務

> $ sudo systemctl stop dht11_nodejs_socket

# 設為開機啟動

> $ sudo systemctl enable dht11_nodejs_socket
