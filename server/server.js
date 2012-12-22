var io = require("socket.io").listen(80, "0.0.0.0");

io.sockets.on("connection", function(socket) {
  var address = socket.handshake.address;
  console.log("New connection from " + address.address + ":" + address.port + ".");

  socket.on("hello", function(msg) {
    console.log("Reported link from '" + msg.source + "' version.");
  });
});
