var io = require('socket.io')();

io.on('connection', socket => {
  console.log("CONNECTED!");
  socket.on('subscribeToTimer', interval => {
    console.log('Client is subscribing to timer with interval ', interval);
    setInterval(() => {
      socket.emit('time', new Date());
    }, interval);
  })

})

io.listen(3000);
console.log("Listening")