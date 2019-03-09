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
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, 'build')));
}
// app.use(express.static(path.join(__dirname, 'build')));

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
const updateFreq = 1000 / 60;
const screenSize = {
  x: 1920 * .6,
  y: 1080 * .6
}

var clockStart = Date.now();
var prevTime = Date.now();
var roundTime = 6000;
var countdown = 0;

io.on('connection', socket => {
  // Give connected player all the current data
  socket.emit('newMousePositions', players);
  socket.emit('newTarget', target);
  socket.emit('shotsFired', shotsFired);
  socket.emit('scoreboard', scoreboard);
  socket.emit('myID', socket.client.id);
  // Listen for new mouse position from client!
  socket.on('mousePosition', (position) => {
    updateMousePosition(socket.client.id, position);
  })
  socket.on('mouseClickPosition', position => {
    var shot = {
      player: getPlayer(socket.client.id),
      position: position
    }
    shotsFired.push(shot);
    if(didShotHitTarget(shot)){
      // Give points
      updateScore(shot, 2);
    } else {
      // Subtract points
      updateScore(shot, -2)
    }

    io.emit('shotsFired', shotsFired);
  })

  socket.on('nickname', nickname => {
    addNewPlayer(socket.client.id, nickname);
  })

  // When this socket disconnects, this listener will trigger!
  socket.on('disconnect', () => {
    removePlayer(socket);
    socket.removeAllListeners("mousePosition");
    socket.removeAllListeners("mouseClickPosition");
    socket.removeAllListeners("disconnect");
  })
})

updateScore = (shot, score) => {
  var updatedPlayers = players.slice();

  for(var i = 0; i < updatedPlayers.length; i++) {
    if(updatedPlayers[i].id === shot.player.id) {
      updatedPlayers[i].score += score;
    }
  }

  players = players;
  io.emit('scoreboard', players);
}

isScoreInScoreboard = shot => {
  for (var i = 0; i < scoreboard.length; i++) {
    if (scoreboard[i].id === shot.player.id) {
      return true;
    }
  }
  return false;
}

clearScoreboard = () => {
  scoreboard = [];
  io.emit('scoreboard', scoreboard);
}

didShotHitTarget = shot => {
  var xDist = target.position.x - shot.position.x;
  var yDist = target.position.y - shot.position.y;

  var distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

  if (distance <= target.radius) {
    console.log("Target Hit!");
    return true;
  } else {
    console.log("Target miss")
    return false;
  }
}

updateMousePosition = (clientID, newPos) => {
  var playersUpdate = players.slice();
  // Update players position
  for (var i = 0; i < playersUpdate.length; i++) {
    if (playersUpdate[i].id === clientID) {
      playersUpdate[i].position = newPos;
    }
  }
  players = playersUpdate;
}

getPlayer = id => {
  for(var i = 0; i < players.length; i++) {
    if(players[i].id === id) {
      console.log("player returned")
      return players[i];
    }
  }
  return null;
}

addNewPlayer = (id, nickname) => {
  var newPlayer = {
    id: id,
    nickname: nickname,
    score: 0
  }
  players.push(newPlayer);
  io.emit('scoreboard', players);
  console.log("--------------------")
  console.log(`New player joined with id: ${id} and name: ${nickname}`);
  console.log(`Player count: ${players.length}`);
  console.log("--------------------")

  if (players.length === 1) {
    positionPusher = setInterval(gameLoop, updateFreq);
    console.log("Players on server. Starting to push updates to clients");
  }
  return newPlayer;
}

removePlayer = socket => {
  var playersUpdate = players.slice();

  // Remove player from array of players
  players = playersUpdate.filter(player => player.id !== socket.client.id);
  console.log('User disconnected :(');

  if (players.length <= 0) {
    clearInterval(positionPusher);
    console.log("--------------------")
    console.log("No players on server. Updates halted");
    console.log("--------------------")
  }
}


gameLoop = () => {
  io.emit("newMousePositions", players);

  // 1: When game loop starts. Start countdown for target spawn
  if (countdown <= 0) {
    console.log("New target!");
    // Clear all shots fired
    shotsFired = []
    io.emit('shotsFired', shotsFired);
    // Create target to shoot
    target = createTarget();
    // Send new target to players
    io.emit('newTarget', target);
    startTimer();
  } else {
    reduceTimer(getDeltaTime());
  }

  // Always update previous time variable
  prevTime = Date.now();
}

createTarget = () => {
  return {
    position: {
      x: Math.random() * screenSize.x,
      y: Math.random() * screenSize.y
    },
    radius: 20
  }
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