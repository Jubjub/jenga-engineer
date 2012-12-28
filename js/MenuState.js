/* Title screen menu state, sets up the network link */

function MenuState() {
  this.setup = function() {
    preventKeys("down", "right", "left", "right", "space");

  }

  this.update = function() {
    if (isDown("space") || isMouseDown("left")) {
      switchState(new PlayState());
    }
  }

  this.draw = function() {
    clearCanvas();

    currentFont = "70px Verdana";
    drawString("Jenga Engineer", 55, 80, "black");
  }
}

switchState(new MenuState());
desiredFPS = 60;
