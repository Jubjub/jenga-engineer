var io = require("socket.io").listen(80, "0.0.0.0");
io.set("log level", 1);

var randomMatches = [];

io.sockets.on("connection", function(socket) {
  var address = socket.handshake.address;
  socket.data = {};
  socket.data.ip = address.address;
  socket.data.port = address.port;
  console.log("new connection from " + address.address + ":" + address.port);

  socket.on("hello", function(msg) {
    console.log("reported link from '" + msg.source + "' version");
    socket.emit("sup", {id: socket.id});
  });

  socket.on("tryjoin", function(msg) {
    console.log("client requested join to room " + msg.room);
    socket.join(msg.room);
    socket.data.room = msg.room;
    console.log("granted");
    if (io.sockets.clients(msg.room).length == 1) {
      console.log("assigning fixer role to " + socket.data.ip);
      socket.emit("fixer");
    }
  });

  socket.on("newblock", function(msg) {
    console.log("new block request received");
    console.log("granted");

    var room = socket.data.room;
    msg.creator = socket.id;
    io.sockets.in(room).emit("blockcreated", msg);
  });

  socket.on("fixcanonical", function(msg) {
    var room = socket.data.room;
    io.sockets.in(room).emit("fix", msg);
  });

  socket.on("randommatch", function(msg) {
    randomMatches.push(socket);
    console.log("added " + socket.data.ip + " to random match pool");
    if (randomMatches.length == 2) {
      var room = uniqueID();
      for (var i = 0; i < randomMatches.length; i++) {
        randomMatches[i].join(room);
        randomMatches[i].data.room = room;
      }
      randomMatches[0].emit("fixer");
      randomMatches = [];
      console.log("put random matches on single room");
    }
  });

  socket.on("gameended", function(msg) {
    var room = socket.data.room;
    console.log("game finished on room " + room);
    io.sockets.in(room).emit("finished", msg);
    var clients = io.sockets.clients(room);
    for (var i = 0; i < clients.length; i++) {
      clients[i].leave(room);
    }
  });
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueID() {
  return ((new Date()).getTime()).toString(16) + getRandomInt(0, 8000000).toString(16);
}

