/* Title screen menu state, sets up the network link */

function MenuState() {
  this.setup = function() {
    this.global = new SpriteList();
    this.label = new Sprite(null, 50, 0);
    this.label.makeLabel("Jenga Engineer", 70, "Verdana", "black");
    this.global.push(this.label);
    preventKeys("down", "right", "left", "right", "space");

    /* Establish a link to the server */
    socket = io.connect("http://localhost");
    socket.emit("hello", { source: "development" });
  }

  this.update = function() {
    if (isDown("space") || isMouseDown("left")) {
      var state = new PlayState();
      switchState(state);
    }
  }

  this.draw = function() {
    clearCanvas();
    this.global.draw();
  }
}
