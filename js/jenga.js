
/* basic construction piece */
Block = (function () {
  function constructor(x, y, width, height) {
    this.sprite = new Sprite("assets/img/debug.png", x, y);
    preventKeys("space");
  }

  constructor.prototype = {
  }

  return constructor;
})();

/* intro menu state, including setting up the network link */
function MenuState() {
  this.setup = function() {
    this.global = new SpriteList();
    this.label = new Sprite(null, 50, 0);
    this.label.makeLabel("Jenga Engineer", 70, "Verdana", "black");
    this.global.push(this.label);
    preventKeys("down", "right", "left", "right", "space");

    socket = io.connect("http://localhost");
    socket.emit("ping", { data: "well excuuuuse me princess" });
  }

  this.update = function() {
    if (isDown("space")) {
      var state = new PlayState();
      switchState(state);
    }
  }

  this.draw = function() {
    clearCanvas();
    this.global.draw();
  }
}

/* main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = new SpriteList();
    block = new Block(20, 20, 40, 20);
    this.addBlock(block);
    this.addBlock(new Block(40, 80, 80, 10));
    this.addBlock(new Block(140, 80, 80, 10));
    this.addBlock(new Block(240, 80, 80, 10));
    this.test = new Sprite("assets/img/debug.png", 100, context.height / 2 - 100);
    this.test.stampRect(14, 0, 4, 16, "#0000ff");
    this.proc = new Sprite(null, 300, 300);
    this.proc.makeGraphic(160, 20, "#ccff11");
    this.proc.stampText(0, 0, "hello!", 16, "Calibri", "#333333");
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
    if (isDown("right") || isDown("d"))
      this.test.x += 10;
    if (isDown("left") || isDown("a"))
      this.test.x -= 10;
  }

  this.draw = function() {
    clearCanvas();
    this.test.draw();
    this.blocks.draw();
    this.proc.draw();
  }
}

var state = new MenuState();
switchState(state);

