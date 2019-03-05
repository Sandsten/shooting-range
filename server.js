var express = require('express');
var socketIO = require('socket.io');
var path = require('path');

var app = express();

const port = process.env.PORT || 3001;

var server = app.listen(port, () => {
  console.log("Server listening on: ", port);
})
var io = socketIO(server);

console.log(process.env.NODE_ENV)
// If we are in production, serve the generated static content!
if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, 'build')));
}
console.log(path.join(__dirname, 'build', 'index.html'))
app.get('*', (request, response) => {
	response.sendFile(path.join(__dirname, 'build/', 'index.html'));
});

// Client connects
// Store object with unique client ID and mouse x,y positions
// Listen for new mouse positions from clients
// Update object array with new positions for clients
// Broadcast new positions to clients

// Whenever a client connects to the server this listener will fire!
var players = [];
var shotsFired = [];
var target = {};
var scoreboard = [];
var positionPusher = null;
const updateFreq = 1000/120;
const screenSize = {
  x: 1920 * .6,
  y: 1080 * .6
}

var clockStart = Date.now();
var prevTime = Date.now();
var roundTime = 6000;
var countdown = 0;

io.on('connection', socket => {
  addNewPlayer(socket);

  // Give connected player all the current data
  socket.emit('newMousePositions', players);
  socket.emit('myID', socket.client.id);

  // Listen for new mouse position from client!
  socket.on('mousePosition', (position) => {
    updateMousePosition(socket.client.id, position);
  })

  socket.on('mouseClickPosition', position => {
    var shot = {
      id: socket.client.id,
      position: position
    }

    shotsFired.push(shot)
    checkIfTargetHit(shot);

    io.emit('shotsFired', shotsFired);
  })

  // When this socket disconnects, this listener will trigger!
  socket.on('disconnect', () => {
    removePlayer(socket);
  })
})

addToScoreboard = shot => {
  if(!isScoreInScoreboard(shot)) {
    console.log("Added to scoreboard")
    scoreboard.push(shot.id)
    io.emit('scoreboard', scoreboard);
  }
}

isScoreInScoreboard = shot => {
  return scoreboard.indexOf(shot.id) > -1;
}

clearScoreboard = () => {
  scoreboard = [];
  io.emit('scoreboard', scoreboard);
}

checkIfTargetHit = shot => {
  var xDist = target.position.x - shot.position.x;
  var yDist = target.position.y - shot.position.y;

  var distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

  if(distance <= target.radius) {
    console.log("Target Hit!");
    addToScoreboard(shot)
  } else {
    console.log("Target miss")
  }

  console.log(distance)
}

updateMousePosition = (clientID, newPos) => {
  var playersUpdate = players.slice();
  // Update players position
  for(var i = 0; i < playersUpdate.length; i++) {
    if(playersUpdate[i].id === clientID){
      playersUpdate[i].position = newPos;
    }
  }
  players = playersUpdate;
}

addNewPlayer = socket => {
  var newPlayer = {
    id: socket.client.id
  }
  players.push(newPlayer);
  console.log(`New player joined with id: ${newPlayer.id}`);

  if(players.length === 1) {
    positionPusher = setInterval(gameLoop, updateFreq);
    console.log("Players on server. Starting to push updates to clients");
  }
}

removePlayer = socket => {
  var playersUpdate = players.slice();

  // Remove player from array of players
  players = playersUpdate.filter(player => player.id !== socket.client.id)
  console.log('User disconnected :(');

  if(players.length <= 0){
    clearInterval(positionPusher);
    console.log("No players on server. Updates halted");
  }
}


gameLoop = () => {
  io.emit("newMousePositions", players);

  // 1: When game loop starts. Start countdown for target spawn
  if(countdown <= 0) {
    console.log("Show target");
    // Clear all shots fired
    shotsFired = []
    io.emit('shotsFired', shotsFired);
    // Create target to shoot
    target = {
      position: {
        x: Math.random() * screenSize.x,
        y: Math.random() * screenSize.y
      },
      radius: 20
    }
    // Send new target to players
    io.emit('newTarget', target);

    clearScoreboard();
    startTimer();
  } else {
    reduceTimer(getDeltaTime());
  }
  
  // Always update previous time variable
  prevTime = Date.now();
}

startTimer = () => {
  clockStart = Date.now(); // Store time when countdown start
  prevTime = clockStart;   // Set previous time as start time
  countdown = roundTime;        // Set timer to 5 seconds
}

getDeltaTime = () => {
  return Date.now() - prevTime;
}

reduceTimer = deltaTime => {
  countdown -= deltaTime;
}