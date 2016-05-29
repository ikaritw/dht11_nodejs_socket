#!/usr/bin/env python
# -*- coding: utf-8 -*-

import subprocess
from subprocess import PIPE
import urllib2  
import urllib

if __name__ == '__main__':
	cmd = 'uname -n'
	process = subprocess.Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)
	uname = process.communicate()
	#process.terminate()
	print uname[0].rstrip()

	cmd= 'whoami'
	process = subprocess.Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)
	whoami = process.communicate()
	#process.terminate()
	print whoami[0].rstrip()

	cmd= 'hostname -I'
	process = subprocess.Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)
	hostname = process.communicate()
	#process.terminate()
	print hostname[0].rstrip()
	
	cmd= '/opt/AdafruitDHT.py 11 2'
	process = subprocess.Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)
	dht11_data = process.communicate()
	print dht11_data[0].rstrip()

	payload = {}
	payload['uname'] = urllib.quote(uname[0].rstrip())
	payload['whoami'] = urllib.quote(whoami[0].rstrip())
	payload['hostname'] = urllib.quote(hostname[0].rstrip())
	payload['dht11_data'] = urllib.quote(dht11_data[0].rstrip())

	url_values = urllib.urlencode(payload)  
	print url_values

	url = 'http://ikaritw-dev.appspot.com/'  
	full_url = url + '?' + url_values
	print full_url

	response = urllib2.urlopen(full_url)
	html = response.read()

	print html
