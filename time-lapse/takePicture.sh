#!/bin/bash
NOW=$(date +"%FT%H:%M:%SZ")
mv fswebcam.jpeg fswebcam_$NOW.jpeg
mv streamer.jpeg streamer_$NOW.jpeg
fswebcam -r 320x240 -S 10 -d /dev/video0 fswebcam.jpeg
streamer -f jpeg -o streamer.jpeg

