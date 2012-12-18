/* main game state */
function PlayState() {
  this.setup = function() {
    this.test = new Sprite("assets/img/debug.png", 100, context.height / 2 - 100);
    preventKeys("down", "right", "left", "right", "space");
  }

  this.update = function() {
    if (isDown("up") || isDown("w"))
      this.test.y -= 15;

    if (isDown("down") || isDown("s"))
      this.test.y += 10;
  }

  this.draw = function() {
    clearCanvas();
    this.test.draw();
  }
}

var playState = new PlayState();
switchState(playState);

