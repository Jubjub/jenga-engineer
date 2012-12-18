/* basic construction piece */
Block = (function () {
  function constructor(x, y, width, height) {
    this.sprite = new Sprite("assets/img/debug.png", x, y);
  }

  constructor.prototype = {
  }

  return constructor;
})();

/* main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = new SpriteList();
    block = new Block(20, 20, 40, 20);
    this.addBlock(block);
    this.addBlock(new Block(40, 80, 80, 10));
    this.test = new Sprite("assets/img/debug.png", 100, context.height / 2 - 100);
    this.test.stampRect(14, 0, 4, 16, "#0000ff");
    preventKeys("down", "right", "left", "right", "space");
  }

  this.addBlock = function(block) {
    this.blocks.push(block.sprite);
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
    this.blocks.draw();
  }

}

var playState = new PlayState();
switchState(playState);

