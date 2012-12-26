/* verlet physics */
/* TODO: introduce mass to the collision response.
 *       limit max overlapping response per iteration
 */
var accumulated = 0;
var timestep = 0.016666666;
var shash = {};
shash.width = 640;
shash.height = 2000;
shash.cellsize = 300;
shash.cwidth = Math.ceil(shash.width / shash.cellsize);
shash.cheight = Math.ceil(shash.height / shash.cellsize);
shash.buckets = [];

shash.insert = function(x, y, block) {
  /* width * row + col */
  var i = Math.floor(this.cwidth * Math.floor(y / this.cellsize) +
                     Math.floor(x / this.cellsize));

  if (!this.buckets[i]) {
    this.buckets[i] = [];
  }

  this.buckets[i].push(block);
}

shash.fetch = function(x, y) {
  var i = Math.floor(this.cwidth * Math.floor(y / this.cellsize) +
                     Math.floor(x / this.cellsize));

  return this.buckets[i];
}

shash.retrieve = function(bbox) {
  var result = this.fetch(bbox.min.x, bbox.min.y);
  result.push.apply(result, this.fetch(bbox.min.x, bbox.max.y));
  result.push.apply(result, this.fetch(bbox.max.x, bbox.max.y));
  result.push.apply(result, this.fetch(bbox.max.x, bbox.min.y));

  result = result.filter(function(elem, pos) {
    return result.indexOf(elem) == pos;
  })

  return result;
}

function computeSpatialHash(blocks) {
  shash.buckets = [];
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var bbox = {};

    bbox.min = {x: block.atoms[0].x, y: block.atoms[0].y};
    bbox.max = {x: block.atoms[0].x, y: block.atoms[0].y};

    for (var n = 1; n < block.atoms.length; n++) {
      bbox.min.x = Math.min(bbox.min.x, block.atoms[n].x);
      bbox.min.y = Math.min(bbox.min.y, block.atoms[n].y);
      bbox.max.x = Math.max(bbox.max.x, block.atoms[n].x);
      bbox.max.y = Math.max(bbox.max.y, block.atoms[n].y);
    }

    block.bbox = bbox;
    shash.insert(bbox.min.x, bbox.min.y, block);
    shash.insert(bbox.min.x, bbox.max.y, block);
    shash.insert(bbox.max.x, bbox.max.y, block);
    shash.insert(bbox.max.x, bbox.min.y, block);
  }
}

function simulateBlocks(blocks, rdt) {
  accumulated += rdt;
  while (accumulated > timestep) {
    var dt = timestep / verlet_steps;

    for (var i = 0; i < blocks.length; i++) {
      blocks[i].computeCenter();
    }

    for (var n = 0; n < verlet_steps; n++) {
      //blocks.reverse();
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];

        for (var j = 0; j < block.atoms.length && !block.sleeping; j++) {
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
            var six = dx > 0 ? 1 : dx == 0 ? 0 : -1;
            var siy = dy > 0 ? 1 : dy == 0 ? 0 : -1;
            dx += (dx * -5.1 * dt);
            dy += (dy * -5.1 * dt);

            if ((dx > 0 ? 1 : dx == 0 ? 0 : -1) != six) {
              dx = 0;
            }

            if ((dy > 0 ? 1 : dy == 0 ? 0 : -1) != siy) {
              dy = 0;
            }
          }

          if (block.touching || block.touchingGround) {
            // TODO: experiment with this magic number.
            if (dx < 0.001) {
              dx = 0;
            }
          }

          dx *= damping;
          dy *= damping;

          /* put slow objects to sleep */
          block.sleepHits++;
          if (Math.abs(dx) + Math.abs(dy) > 0.3) {
            block.sleepHits = 0;
          }

          if (block.sleepHits > 1000) {
            block.sleeping = true;
            sleepHits = 0;
          }

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
          /* Edge constraints */
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

        /* Collision constraints */
        computeSpatialHash(blocks);
        block.computeCenter();
        // TODO: space partitioning. pretty please.
        var hashBlocks = shash.retrieve(block.bbox);
        for (var r = 0; r < hashBlocks.length; r++) {
          if (block == hashBlocks[r]) {
            continue;
          }

          if (block.sleeping && hashBlocks[r].sleeping) {
            continue;
          }

          hashBlocks[r].computeCenter();
          var hit = block.collide(hashBlocks[r]);
          if (hit) {
            var b1slf = 1;
            var b2slf = 1;
            if (hit.b1.sleeping && !hit.b2.sleeping) {
              b2slf = 2;
              b1slf = 0;
            } else if (hit.b2.sleeping  && !hit.b1.sleeping) {
              b1slf = 2;
              b2slf = 0;
            }

            var cv = {x : hit.normal.x * hit.depth, y : hit.normal.y * hit.depth};
            hit.atom.x += cv.x * 0.5 * b1slf;
            hit.atom.y += cv.y * 0.5 * b1slf;

            /*
              hit.b1.sleeping = false;
              hit.b2.sleeping = false;
            */
            if (hit.b1.lastTouching != hit.b2) {
              hit.b1.sleeping = false;
            }
            if (hit.b2.lastTouching != hit.b1) {
              hit.b2.sleeping = false;
            }
            hit.b1.lastTouching = hit.b2;
            hit.b2.lastTouching = hit.b1;

            var e1 = hit.b2.atoms[hit.edge[0]];
            var e2 = hit.b2.atoms[hit.edge[1]];
            var t;


            if (Math.abs(e1.x - e2.x) > Math.abs(e1.y - e2.y)) {
              t = (hit.atom.x - cv.x - e1.x) / (e2.x - e1.x);
            } else {
              t = (hit.atom.y - cv.y - e1.y) / (e2.y - e1.y);
            }

            var lambda = 1 / (t * t + (1 - t) * (1 - t));
            e1.x -= cv.x * (1 - t) * 0.5 * lambda * b2slf;
            e1.y -= cv.y * (1 - t) * 0.5 * lambda * b2slf;
            e2.x -= cv.x * t * 0.5 * lambda * b2slf;
            e2.y -= cv.y * t * 0.5 * lambda * b2slf;

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

        /* Extract position and rotation from physical points */
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

    accumulated -= timestep;
  }
}
