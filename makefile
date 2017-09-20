run:
	docker run -it --rm --name dht11_nodejs -v "$(PWD):/usr/src/dht11_nodejs" -w /usr/src/dht11_nodejs resin/raspberry-pi-alpine-node:7.10.1 node app.js
test:
	docker run -it --rm --name dht11_nodejs --privileged -v "$(PWD):/usr/src/dht11_nodejs" -w /usr/src/dht11_nodejs resin/raspberry-pi-alpine-node:7.10.1 node test/dht11.js
