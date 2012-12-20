var io = require("socket.io").listen(80);

io.sockets.on("connection", function(socket) {
  console.log("received new connection");
  socket.on("ping", function(msg) {
    console.log("received ping");
    console.log("data received: '" + msg.data + "'");
  });
});
