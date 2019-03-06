import openSocket from 'socket.io-client'
var socket;
if(process.env.NODE_ENV === 'production')
  socket = openSocket();
else
  socket = openSocket('http://localhost:3001');

export const subscribeToTimer = (interval, cb) => {
  socket.on('timer', timestamp => cb(null, timestamp));
  socket.emit('subscribeToTimer', interval);
};

// Listen for all mouse positions
export const subscribeToMousePositions = cb => {
  socket.on('newMousePositions', mousePositions => cb(mousePositions));
}

export const subscribeToShotsFired = cb => {
  socket.on('shotsFired', positions => cb(positions));
}

export const subscribeToScoreboard = cb => {
  socket.on('scoreboard', scoreboard => cb(scoreboard));
}

export const subscribeToNewTarget = cb => {
  socket.on('newTarget', target => cb(target));
}

export const subscribeToMyID = cb => {
  socket.on('myID', myID => cb(myID));
}

// Emit mouse position 60 times per second here!
export const sendMousePosition = mousePosition => {
  socket.emit('mousePosition', mousePosition);
}

export const sendMouseClickPosition = mouseClickPosition => {
  socket.emit('mouseClickPosition', mouseClickPosition);
}