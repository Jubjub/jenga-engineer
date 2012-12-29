/* Title screen menu state, sets up the network link */

function MenuState() {
  this.setup = function() {
    preventKeys("down", "right", "left", "right", "space");
    this.bg = new Sprite("assets/img/menu.png", -8, 0);
  }

  this.update = function() {
    if (isDown("space") || isMouseDown("left")) {
      switchState(new PlayState());
    }
  }

  this.draw = function() {
    clearCanvas();
    this.bg.draw();

    /*
    currentFont = "70px Verdana";
    drawString("Jenga Engineer", 55, 80, "black");
    */
  }
}

switchState(new MenuState());
desiredFPS = 60;
