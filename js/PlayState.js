/* keep socket external for reconnection */
var socket;

/* Main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = [];
    this.blockss = new SpriteList();
    this.clouds = new SpriteList();
    this.towerHeight = 0;

    this.accumulator = 0;
    this.timestep = 0.01666666666;

    this.space = new cp.Space();
    this.space.iterations = 10;
    this.space.gravity = new cp.Vect(0, 150);
    this.space.game = this;

    /* sound */
    var cha = new Audio();
    var canPlayOgg = !!cha.canPlayType && cha.canPlayType('audio/ogg; codecs="vorbis"') != "";
    var lpath = "assets/sound/test_loop.ogg";
    if (!canPlayOgg) {
      lpat = "assets/sound/test_loop.mp3";
    }
    this.bgloop = new Audio(lpath);

    this.bgloop.loop = true;
    //this.bgloop.play();

    this.space.setDefaultCollisionHandler(null, function(arb, space) {
      if (arb) {
        if (arb.a.name == "block" && arb.b.name == "block") {
          var my = Math.min(arb.a.body.p.y, arb.b.body.p.y);
          space.game.towerHeight = Math.max(space.game.towerHeight, (context.height - 30) - my);

          var soundBlock = arb.a.block;
          if (soundBlock.playedSfx) {
            soundBlock = arb.b.block;
          }
          if (!soundBlock.playedSfx) {

            if (soundBlock.type == 0) {
              playSound("assets/sound/metal_on_metal");
            } else if (soundBlock.type == 1) {
              playSound("assets/sound/brick_on_brick");
            } else if (soundBlock.type == 2) {
              playSound("assets/sound/wood_on_wood");
            }
            soundBlock.playedSfx = true;

          }
        }
        
        if (arb.a == space.game.ground|| arb.b == space.game.ground) {
          if (arb.b.name == "block" || arb.a.name == "block") {
            socket.disconnect();
            space.game.bgloop.loop = false;
            space.game.bgloop.pause();
            switchState(new PlayState());
          }
        }

        return true;
      }
    }, null, null);

    this.ground = new cp.SegmentShape(this.space.staticBody,
                                      new cp.Vect(0, 480), new cp.Vect(640, 480), 0);
    this.ground.name = "ground";
    this.space.addShape(this.ground);
    this.base = new Block(context.width / 2 - 300 / 2, context.height - 40, 300, 30, "#0", -1);
    this.base.sprite.makeGraphic(this.base.width, this.base.height, "black");
    this.addBlock(this.base);
    this.base.shape.name = "base";
    this.ground.setElasticity(0);
    this.ground.setFriction(1);

    this.background = new Sprite("assets/img/bg.png", -2, 0);
    this.background.y = -1590 + 480 + 10;

    this.hintBlock = new Sprite(null, 0, 0);
    this.hintBlock.alpha = 0.5;

    this.canInsertBlock = true;
    this.nextBlock = {width: getRandomInt(30, 30 * 4), height: getRandomInt(30, 31)};
    this.nextBlock.width = Math.round(this.nextBlock.width / 30) * 30;
    this.nextBlock.height = Math.round(this.nextBlock.height / 30) * 30;

    this.blockMap = {};

    var possibleColors = ["red", "blue", "green", "pink", "gray", "blue"];
    this.color = possibleColors[Math.floor(Math.random() * possibleColors.length)];

    preventKeys("down", "right", "left", "right", "space", "r");

    /* Network */
    socket = io.connect("http://localhost");
    socket.data = {};
    socket.data.game = this;

    socket.on("connect", function() {
      socket.emit("hello", {source: "development" });
      var room = "test_room";
      socket.emit("tryjoin", {room: room});
      socket.data.room = room;
    });

    socket.on("sup", function(msg) {
      console.log("received id from server: " + msg.id);
      socket.data.id = msg.id;
    });

    socket.on("fixer", function(msg) {
      /* start sending physics fixes */
      console.log("this client has been selected as fixer");
      socket.data.game.isFixer = true;
      setInterval(this.data.game.sendPhysicsFix, 100);
    });

    socket.on("blockcreated", function(msg) {
      console.log("received block from server, id " + msg.id);

      if (msg.creator == socket.data.id) {
        return;
      }

      var newBlock = new Block(msg.x, msg.y, msg.width, msg.height, msg.color);
      socket.data.game.addBlock(newBlock);
      newBlock.id = msg.id;
      socket.data.game.blockMap[msg.id] = newBlock;
    });

    socket.on("fix", function(msg) {
      //console.log("received physics fix");
      if (this.data.game.isFixer) {
        //console.log("ignoring");
        return;
      }

      for (var id in msg) {
        this.data.game.blockMap[id].body.setPos(msg[id][0]);
        this.data.game.blockMap[id].body.setAngle(msg[id][1]);
        this.data.game.blockMap[id].body.setVel(msg[id][2]);
        this.data.game.blockMap[id].body.setAngVel(msg[id][3]);
      }
    });
  }

  this.sendPhysicsFix = function() {
    var game = currentState;
    //console.log("sending physics fix");
    var msg = {};
    for (var id in game.blockMap) {
      var block = game.blockMap[id];
      msg[id] = [block.body.p, block.body.a, {x: block.body.vx, y: block.body.vy},
                 block.body.w];
    }
    socket.emit("fixcanonical", msg);
  }

  this.addBlock = function(block) {
    block.body = this.space.addBody(new cp.Body(1, cp.momentForBox(1, block.width,
                                                                   block.height)));
    block.body.setPos(new cp.Vect(block.sprite.x + block.width / 2,
                                  block.sprite.y + block.height / 2));

    block.shape = this.space.addShape(new cp.BoxShape(block.body, block.width, block.height));
    block.shape.setElasticity(0);
    block.shape.setFriction(1);
    block.shape.name = "block";
    block.shape.block = block;

    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {

    /* move camera with tower */
    if (this.towerHeight > 300) {
      /* TODO: do this with some tweening library or add it to pentagine so it
       * doesn't look so boring/sudden */
      var target = -(this.towerHeight - 300);
      if (this.camera.y > target) {
        this.camera.y -= 10 * this.dt;
      }
    }

    /* timestep slicing */
    this.accumulator += this.dt;
    while (this.accumulator >= this.timestep) {
      this.space.step(this.timestep);
      this.accumulator -= this.timestep;
    }

    /* update each block position and angle */
    for (var i = 0; i < this.blocks.length; i++) {
      var block = this.blocks[i];
      block.sprite.x = block.body.p.x - block.width / 2;
      block.sprite.y = block.body.p.y - block.height / 2;
      block.sprite.angle = block.body.a * radToDeg;
    }

    /* Handle hint block */
    if (this.hintBlock.nextBlock != this.nextBlock) {
      this.hintBlock.makeGraphic(this.nextBlock.width, this.nextBlock.height, 'black');
      this.hintBlock.nextBlock = this.nextBlock;
    }
    this.hintBlock.x = mouseX - this.nextBlock.width / 2;
    this.hintBlock.y = mouseY - this.nextBlock.height / 2;

    /* Add new blocks */
    if (isMouseDown("left")) {
      if (this.canInsertBlock ) {
        if (this.hintBlock.lastShape) {
          this.space.staticBody.removeShape(this.hintBlock.lastShape);
        }

        var hw = this.nextBlock.width / 2;
        var hh = this.nextBlock.height / 2;
        var shape = cp.BoxShape2(this.space.staticBody,
                                 new cp.BB(-hw + mouseX, -hh + mouseY,
                                           hw + mouseX, hh + mouseY));
        shape.sensor = true;
        var colliding = false;
        this.space.shapeQuery(shape, function(a, set) {
          colliding = true;
        });

        this.hintBlock.lastShape = shape;

        var blockPos = {x: mouseX - this.nextBlock.width / 2,
                        y: mouseY - this.nextBlock.height / 2};

        colliding = colliding || (mouseY + this.nextBlock.height / 2 > canvas.height - 30);

        if (!colliding) {
          var newBlock = new Block(blockPos.x, blockPos.y,
                                  this.nextBlock.width, this.nextBlock.height,
                                  this.color)
          newBlock.id = uniqueID();
          this.addBlock(newBlock);
          this.blockMap[newBlock.id] = newBlock;
          socket.emit("newblock", {x: blockPos.x,
                                   y: blockPos.y,
                                   width: this.nextBlock.width,
                                   height: this.nextBlock.height,
                                   id: newBlock.id,
                                   color: this.color});

          this.nextBlock = {width: getRandomInt(30, 30 * 4), height: getRandomInt(30, 31)};
          if (!getRandomInt(0, 3)) {
            var tmp = this.nextBlock.width;
            this.nextBlock.width = this.nextBlock.height;
            this.nextBlock.height = tmp;
          }
          this.nextBlock.width = Math.round(this.nextBlock.width / 30) * 30;
          this.nextBlock.height = Math.round(this.nextBlock.height / 30) * 30;
          this.canInsertBlock = false;
        }
      }
    } else {
      this.canInsertBlock = true;
    }

    /* Clouds! */
    for (var i = 0; i < this.clouds.sprites.length; i++) {
      var cloud = this.clouds.sprites[i];
      cloud.x += cloud.speed * this.dt;

      if (cloud.x < - 70 || cloud.x > (640 + 70)) {
        this.clouds.remove(cloud);
      }
    }

    if (!getRandomInt(0, 60 * 10)) {
      var x = (getRandomInt(0, 1) * (640 + 70)) - 70;
      var cloud = new Sprite("assets/img/cloud1.png", x, getRandomInt(0, context.height - 400));
      cloud.speed = getRandomInt(20, 60);

      if (x > 0) {
        cloud.speed *= -1;
      }

      console.log("Cloud added.");
      this.clouds.push(cloud);
    }
  }

  this.draw = function() {
    clearCanvas();

    currentFont = "12px Verdana";
    drawString(this.blocks.length.toString(), 5, 13, "#000000");

    if (this.hintBlock) {
      this.hintBlock.draw();
    }

    this.blockss.draw();
    this.clouds.draw();
    this.background.draw();
  }
}

// var playState = new PlayState();
// desiredFPS = 60;
// switchState(playState);
