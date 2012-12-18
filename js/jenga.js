function PlayState() {
  this.setup = function() {
    this.ball = new Sprite("assets/img/debug.png", 100, 50);
    preventKeys("down", "right", "left", "right", "space");
  }

  this.update() = function() {
    if (isDown("up"))
      this.ball.y--;
    else if (isDown("down"))
      this.ball.y++;
    else if (isDown("left"))
      this.ball.x--;
    else if (isDown("right"))
      this.ball.x++;
  }

  this.draw() = function() {
    clearCanvas();

    this.ball.draw();
  }
}

var playState = new PlayState();
switchState(playState);
