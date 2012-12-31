/* keep socket external for reconnection */
var socket;

var mode;

/* Title screen menu state, sets up the network link */
function MenuState() {
  this.setup = function() {
    preventKeys("down", "right", "left", "right", "space");
    this.starting = false;
    this.bg = new Sprite("assets/img/menu.png", -8, 0);
  }

  this.update = function() {
    if (isDown("a") || isMouseDown("b")) {
      if (!this.starting) {
        this.starting = true;
        if (isDown("a")) {
          console.log("set mode to random");
          mode = "random";
        } else if (isDown("b")) {
          console.log("set mode to test");
          mode = "test";
        }
        setTimeout(function() {
          /* Network */
          if (!socket) {
            socket = io.connect("http://localhost");
            socket.data = {};

            socket.on("connect", function() {
              socket.emit("hello", {source: "development" });
              startGameType();

              socket.on("sup", function(msg) {
                console.log("received id from server: " + msg.id);
                socket.data.id = msg.id;
              });
            });
          } else {
            startGameType();
          }

          switchState(new PlayState());
        }, 500);
      }
    }
  }

  this.draw = function() {
    clearCanvas();
    currentFont = "20px Verdana";
    drawString("Press a to start a random match or b to join the test room", 15, 400, "#ffffff");
    this.bg.draw();
  }
}


function startGameType() {
  if (mode == "random") {
    console.log("setting up random match");
    socket.emit("randommatch");
  } else if (mode == "test") {
    console.log("connecting to test room");
    var room = "test_room";
    socket.emit("tryjoin", {room: room});
    socket.data.room = room;
  }
}

desiredFPS = 60;
switchState(new MenuState());
