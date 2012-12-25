var io = require("socket.io").listen(80, "0.0.0.0");
io.set("log level", 1);

io.sockets.on("connection", function(socket) {
  var address = socket.handshake.address;
  socket.data = {};
  socket.data.ip = address.address;
  socket.data.port = address.port;
  console.log("new connection from " + address.address + ":" + address.port);

  socket.on("hello", function(msg) {
    console.log("reported link from '" + msg.source + "' version");
    socket.emit("sup", {id : socket.id});
  });

  socket.on("tryjoin", function(msg) {
    console.log("client requested join to room " + msg.room);
    socket.join(msg.room);
    console.log("granted");
  });

  socket.on("newblock", function(msg) {
    console.log("new block request received");
    console.log("granted");
    var room = io.sockets.manager.roomClients[socket.id][0];
    msg.creator = socket.id;
    io.sockets.in(room).emit("blockcreated", msg);
  });
});
