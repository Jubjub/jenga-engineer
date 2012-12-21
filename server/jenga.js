var io = require("socket.io").listen(80, '0.0.0.0');

io.sockets.on("connection", function(socket) {
  var address = socket.handshake.address;
  var astr = address.address + ":" + address.port;
  var ident = null;
  console.log("new connection from " + astr);
  socket.on("hello", function(msg) {
    console.log("reported link from '" + msg.source + "' version");
  });
  socket.on("identify", function(msg) {
    if (!msg.ident) {
      console.log("missing identifier");
      socket.disconnect();
    } else {
      ident = msg.ident;
    }
    console.log("identified " + astr);
  });
});
