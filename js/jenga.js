/* Constants */
var verlet_steps = 3;
var damping = 0.9994;
var radToDeg = 180 / Math.PI;
var degToRad = Math.PI / 180;

/* Utils */
function vec2Angle(v1, v2) {
  return Math.atan2(v2.y - v1.y, v2.x - v1.x) * radToDeg;
}

function vec2Dot(v1, v2) {
  return (v1.x * v2.x + v1.y * v2.y);
}

function vec2Length(v1) {
  return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
}

function vec2Normalize(v1) {
  var l = vec2Length(v1);
  v1.x /= l;
  v1.y /= l;
}

function intervalDistance(proj1, proj2) {
  if (proj1[0] < proj2[0]) {
    return proj2[0] - proj1[1];
  } else {
    return proj1[0] - proj2[1];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* verlet physics */
/* TODO: introduce mass to the collision response.
 *       limit max overlapping response per iteration
 */
function simulateBlocks(blocks, rdt) {
  var steps = (rdt / 0.016666) * verlet_steps;
  if (steps < 1) {
    steps = 1;
  }
  steps = Math.floor(steps);
  var dt = rdt / steps;

  for (var i = 0; i < blocks.length; i++) {
    blocks[i].computeCenter();
  }

  for (var n = 0; n < steps; n++) {
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];

      for (var j = 0; j < block.atoms.length; j++) {
        var atom = block.atoms[j];
        var oldatom = block.oldatoms[j];
        var dx = atom.x - oldatom.x;
        var dy = atom.y - oldatom.y;

        dx += block.acceleration.x * dt * dt;
        dy += block.acceleration.y * dt * dt;

        /* kinetic friction */
        /* TODO: use movement diff instead of current frame displacement, and
         * apply only to interacting atoms */
        if (block.touching || block.touchingGround) {
          dx += (dx * -5.1 * dt);
          dy += (dy * -5.1 * dt);
        }

        dx *= damping;
        dy *= damping;

        oldatom.x = atom.x;
        oldatom.y = atom.y;
        atom.x += dx;
        atom.y += dy;

        /* World lower bound, much cheaper than colliding */
        block.touchingGround = false;
        if (atom.y > canvas.height - 20) {
          atom.y = canvas.height - 20;
          block.touchingGround = true;
        }
      }

      /* Satisfy the constraints */
      for (var j = 0; j < block.edges.length; j++) {
        /* edge constraints */
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

        /* Collision constraints */
        block.computeCenter();
        // TODO: space partitioning. pretty please.
        for (var r = 0; r < blocks.length; r++) {
          if (block == blocks[r]) {
            continue;
          }

          blocks[r].computeCenter();
          var hit = block.collide(blocks[r]);
          if (hit) {
            var cv = {x : hit.normal.x * hit.depth, y : hit.normal.y * hit.depth};
            hit.atom.x += cv.x * 0.5;
            hit.atom.y += cv.y * 0.5;
            var e1 = hit.b2.atoms[hit.edge[0]];
            var e2 = hit.b2.atoms[hit.edge[1]];
            var t;

            if (Math.abs(e1.x - e2.x) > Math.abs(e1.y - e2.y)) {
              t = (hit.atom.x - cv.x - e1.x) / (e2.x - e1.x);
            } else {
              t = (hit.atom.y - cv.y - e1.y) / (e2.y - e1.y);
            }

            var lambda = 1 / (t * t + (1 - t) * (1 - t));
            e1.x -= cv.x * (1 - t) * 0.5 * lambda;
            e1.y -= cv.y * (1 - t) * 0.5 * lambda;
            e2.x -= cv.x * t * 0.5 * lambda;
            e2.y -= cv.y * t * 0.5 * lambda;

            /* hilarious.
            hit.b2.oldatoms[hit.edge[0]].x = hit.b2.atoms[hit.edge[0]].x;
            hit.b2.oldatoms[hit.edge[0]].y = hit.b2.atoms[hit.edge[0]].y;
            hit.b2.oldatoms[hit.edge[1]].x = hit.b2.atoms[hit.edge[1]].x;
            hit.b2.oldatoms[hit.edge[1]].y = hit.b2.atoms[hit.edge[1]].y;
            hit.oldatom.x = hit.atom.x;
            hit.oldatom.y = hit.atom.y;
            */
          }
        }
      }

      /* extract position and rotation from physical points */
      // TODO: what. how. huh. why does this work. it shouldn't do that. why
      // does it do that. stop doing that. fuck you javascript, fuck you
      // canvas, stop messing with my coordinate systems. why must you ruin
      // everything?
      block.sprite.x = block.atoms[2].x;
      block.sprite.y = block.atoms[2].y;
      var dir = {x: block.atoms[0].x - block.atoms[1].x,
                 y: block.atoms[0].y - block.atoms[1].y};

      block.sprite.angle = vec2Angle({x : 1, y : 0}, dir);
    }
  }
}

/* Main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = [];
    this.blockss = new SpriteList();

    /* Add some test blocks */
    //block = new Block(20, 20, 40, 20);
    //this.addBlock(block);
    //this.addBlock(new Block(40, 80, 80, 10));
    //this.addBlock(new Block(140, 80, 80, 10));
    this.addBlock(new Block(context.width / 2 - 300 / 2, 80, 300, 20));
    /*
    this.test = new Sprite("assets/img/debug.png", 100, context.height / 2 - 100);
    this.test.stampRect(14, 0, 4, 16, "#0000ff");
    */
    /*
    this.proc = new Sprite(null, 300, 300);
    this.proc.makeGraphic(160, 20, "#ccff11");
    this.proc.stampText(0, 0, "hello!", 16, "Calibri", "#333333");
    */
    this.hintBlock = new Sprite(null, 0, 0);
    this.hintBlock.alpha = 0.5;

    this.canInsertBlock = true;
    this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};

    preventKeys("down", "right", "left", "right", "space", "r");
  }

  this.addBlock = function(block) {
    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {
    simulateBlocks(this.blocks, this.dt);

    if (isDown("up") || isDown("w"))
      this.test.y -= 15;
    if (isDown("down") || isDown("s"))
      this.test.y += 10;
    if (isDown("right") || isDown("d"))
      this.test.x += 10;
    if (isDown("left") || isDown("a"))
      this.test.x -= 10;

    if (isDown("r"))
      switchState(new PlayState());

    if (this.hintBlock.nextBlock != this.nextBlock) {
      this.hintBlock.makeGraphic(this.nextBlock.width, this.nextBlock.height, 'black');
      this.hintBlock.nextBlock = this.nextBlock;
    }
    this.hintBlock.x = mouseX - this.nextBlock.width / 2;
    this.hintBlock.y = mouseY - this.nextBlock.height / 2;

    if (isMouseDown("left")) {
      if (this.canInsertBlock ) {
        var colliding = false;
        var tmpBlock = new Block(mouseX - this.nextBlock.width / 2,
                                 mouseY - this.nextBlock.height / 2,
                                 this.nextBlock.width, this.nextBlock.height);
        for (var i = 0; i < this.blocks.length; i++) {
          colliding = colliding || (tmpBlock.collide(this.blocks[i]));
          if (colliding) {
            break;
          }
        }
        colliding = colliding || (mouseY + this.nextBlock.height / 2 > canvas.height - 20);
        if (!colliding) {
          this.addBlock(new Block(mouseX - this.nextBlock.width / 2,
                                  mouseY - this.nextBlock.height / 2,
                                  this.nextBlock.width, this.nextBlock.height));

          this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};
          this.canInsertBlock = false;
        }
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

    drawString(this.blocks.length.toString(), 10, 10, "#000000");

    if (this.hintBlock) {
      this.hintBlock.draw();
    }

    this.blockss.draw();
  }
}

var playState = new PlayState();
/* not needed just now, since variable verlet steps are working */
desiredFPS = 60;
switchState(playState);
