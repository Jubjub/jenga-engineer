/* constants */
var rad_to_deg = 57.295779513082323;
var deg_to_rad = 0.0174532925199432957;

/* verlet physics */
function simulateBlocks(blocks) {
  // TODO: get some actual time values
  var dt = 0.1666666;
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    /* simple verlet integration */
    for (var j = 0; j < 4; j++) {
      var dx = block.atoms[j].x - block.oldatoms[j].x;
      var dy = block.atoms[j].y - block.oldatoms[j].y;
      dx += block.acceleration.x * dt * dt;
      dy += block.acceleration.y * dt * dt;
      block.oldatoms[j].x = block.atoms[j].x;
      block.oldatoms[j].y = block.atoms[j].y;
      block.atoms[j].x += dx;
      block.atoms[j].y += dy;
    }
    /* extract position and rotation from physical points */
    block.sprite.x = block.atoms[0].x;
    block.sprite.y = block.atoms[0].y;
    //block.sprite.setAngle(Math.atan2(block.atoms[1].y - block.atoms[0].y,
    //                                 block.atoms[1].x - block.atoms[0].x));
    block.sprite.angle += 45 * dt;
  }
}

/* basic construction piece */
Block = (function () {
  function constructor(x, y, width, height) {
    this.sprite = new Sprite(null, x, y);
    var color = '#' + Math.floor(Math.random()*16777215).toString(16); 
    this.sprite.makeGraphic(width, height, color);
    this.acceleration = {x : 0, y : 12};
    this.atoms = [{x : x, y : y}, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    this.oldatoms = [{x : x, y : y}, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    preventKeys("space");
  }

  constructor.prototype = {
    update: function() {

    },
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
    /* establish a link to the server */
    socket = io.connect("http://localhost");
    socket.emit("hello", { source: "development" });
  }

  this.update = function() {
    if (isDown("space")) {
      var state = new PlayState();
      switchState(state);
    }
    if (isDown("space")) {

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
    this.blocks = [];
    this.blockss = new SpriteList();
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
    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {
    simulateBlocks(this.blocks);
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
    this.blockss.draw();
    this.proc.draw();
  }
}

var state = new MenuState();
switchState(state);

