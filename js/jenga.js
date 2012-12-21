/* constants */
var rad_to_deg = 180 / Math.PI;
var deg_to_rad = Math.PI / 180;
var verlet_steps = 5;
var damping = 0.9994;

/* utils */
function vec2_angle(v1, v2) {
  return Math.atan2(v2.y - v1.y, v2.x - v1.x) * rad_to_deg;
}

/* verlet physics */
function simulateBlocks(blocks) {
  // TODO: get some actual time values
  var dt = 0.16666666666;
  dt /= verlet_steps;
  for (var n = 0; n < verlet_steps; n++) {
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      /* simple verlet integration */
      for (var j = 0; j < block.atoms.length; j++) {
        var atom = block.atoms[j];
        var oldatom = block.oldatoms[j];
        var dx = atom.x - oldatom.x;
        var dy = atom.y - oldatom.y;
        dx += block.acceleration.x * dt * dt;
        dy += block.acceleration.y * dt * dt;
        dx *= damping;
        dy *= damping;
        oldatom.x = atom.x;
        oldatom.y = atom.y;
        atom.x += dx;
        atom.y += dy;
        if (atom.y > canvas.height - 20) {
          atom.y = canvas.height - 20;
        }
      }
      /* satisfy them constraints */
      for (var j = 0; j < block.edges.length; j++) {
        var edge = block.edges[j];
        var a = block.atoms[edge[0]];
        var b = block.atoms[edge[1]];
        var rl = edge[2];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var l = Math.sqrt(dx * dx + dy * dy);
        var diff = l - rl;
        dx /= l;
        dy /= l;
        dx *= 0.5;
        dy *= 0.5;
        a.x -= diff * dx;
        a.y -= diff * dy;
        b.x += diff * dx;
        b.y += diff * dy;
      }
      /* extract position and rotation from physical points */
      // TODO: what. how. huh. why does this work. it shouldn't do that. why
      // does it do that. stop doing that. fuck you javascript, fuck you
      // canvas, stop messing with my coordinate systems. why must you ruin
      // everything?
      block.sprite.x = block.atoms[2].x;
      block.sprite.y = block.atoms[2].y;
      var dir = {x : block.atoms[0].x - block.atoms[1].x,
                 y : block.atoms[0].y - block.atoms[1].y};

      block.sprite.angle = vec2_angle({x : 1, y : 0}, dir);
      //block.sprite.angle += 45 * dt;
    }
  }
}

/* basic construction piece */
Block = (function () {
  function constructor(x, y, width, height) {
    this.sprite = new Sprite(null, x, y);
    var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    this.sprite.makeGraphic(width, height, color);
    this.acceleration = {x : 0, y : 2};
    this.atoms = [{x : x, y : y}, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    this.oldatoms = [{x : x, y : y + 1 }, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    var h = Math.sqrt(width * width + height * height);
    this.edges = [[0, 1, width], [1, 2, height], [2, 3, width], [3, 0, height], [0, 2, h]];
    preventKeys("space");
  }

  constructor.prototype = {
    update: function() {

    },
  }

  return constructor;
})();

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

    this.canInsertBlock = true;

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

    if (isMouseDown("left")) {
      if (this.canInsertBlock) {
        this.addBlock(new Block(mouseX, mouseY, 100, 100));
        this.canInsertBlock = false;
      }
    } else {
      this.canInsertBlock = true;
    }
  }

  this.draw = function() {
    clearCanvas();
    /*
    for (var i = 0; i < this.blocks.length; i++) {
      var block = this.blocks[i];
      for (var j = 0; j < block.atoms.length; j++) {
        var atom = block.atoms[j];
        context.fillStyle = "black";
        context.fillRect(atom.x, atom.y, 3, 3);
      }
    }
    */
    this.test.draw();
    this.blockss.draw();
    this.proc.draw();
  }
}

var state = new MenuState();
switchState(state);
