var io = require("socket.io").listen(80);

io.sockets.on("connection", function(socket) {
  var address = socket.handshake.address;
  console.log("new connection from " + address.address + ":" + address.port);
  socket.on("hello", function(msg) {
    console.log("reported link from '" + msg.source + "' version");
  });
});
