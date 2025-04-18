#!/bin/bash
set -e

# Set display number
export DISPLAY=:1
XVFB_W=1280 # Width
XVFB_H=720  # Height
XVFB_D=24   # Color depth
VNC_PORT=5901 # VNC port matching DISPLAY :1

# Start Xvfb
echo "Starting Xvfb on display ${DISPLAY} with geometry ${XVFB_W}x${XVFB_H}x${XVFB_D}"
Xvfb ${DISPLAY} -screen 0 ${XVFB_W}x${XVFB_H}x${XVFB_D} -nolisten tcp &
XVFB_PID=$!
echo "Xvfb PID: ${XVFB_PID}"
sleep 1 # Give Xvfb time to start

# Start Fluxbox Window Manager (optional, but helps manage windows)
echo "Starting Fluxbox Window Manager on display ${DISPLAY}"
fluxbox -display ${DISPLAY} &
FLUXBOX_PID=$!
echo "Fluxbox PID: ${FLUXBOX_PID}"
sleep 1

# Start VNC server connecting to the Xvfb display
echo "Starting x11vnc server on display ${DISPLAY}, listening on port ${VNC_PORT}"
x11vnc -display ${DISPLAY} -forever -nopw -rfbport ${VNC_PORT} &
X11VNC_PID=$!
echo "x11vnc PID: ${X11VNC_PID}"
sleep 1

# Start noVNC WebSocket proxy (websockify)
# Listens on 6080, serves noVNC web files, proxies to VNC server on port 5901
echo "Starting noVNC server (websockify) on port 6080, proxying to localhost:${VNC_PORT}"
websockify --web /opt/noVNC/ 6080 localhost:${VNC_PORT} &
WEBSOCKIFY_PID=$!
echo "websockify PID: ${WEBSOCKIFY_PID}"
sleep 1

echo "Starting Next.js application..."
# Start the Next.js application using the production server
# Use exec so Node.js becomes the main process (PID 1) and receives signals correctly
exec npm start

# If Node exits, attempt cleanup (might not always run if Node crashes hard)
# kill $WEBSOCKIFY_PID $X11VNC_PID $FLUXBOX_PID $XVFB_PID