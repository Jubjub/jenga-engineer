/* keep socket external for reconnection */
var socket;

/* Main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = [];
    this.blockss = new SpriteList();
    this.clouds = new SpriteList();

    this.accumulator = 0;
    this.timestep = 0.01666666666;

    this.space = new cp.Space();
    this.space.iterations = 10;
    this.space.gravity = new cp.Vect(0, 150);
    this.space.game = this;

    this.space.setDefaultCollisionHandler(null, function(arb, space) {
      if (arb) {
        if (arb.a == space.game.ground|| arb.b == space.game.ground) {
          if (arb.b.name == "block" || arb.a.name == "block") {
            socket.disconnect();
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
    this.base = new Block(context.width / 2 - 300 / 2, context.height - 40, 300, 20, "black");
    this.addBlock(this.base);
    this.base.shape.name = "base";
    this.ground.setElasticity(0);
    this.ground.setFriction(1);

    this.background = new Sprite("assets/img/bg.png", 0, 0);

    this.hintBlock = new Sprite(null, 0, 0);
    this.hintBlock.alpha = 0.5;

    this.canInsertBlock = true;
    this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};

    var possibleColors = ["red", "blue", "green", "pink", "gray", "blue"];
    // this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
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

    socket.on("blockcreated", function(msg) {
      console.log("received block from server");

      if (msg.creator == socket.data.id) {
        return;
      }

      socket.data.game.addBlock(new Block(msg.x, msg.y, msg.width, msg.height, msg.color));
    });
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
    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {

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

        //this.space.addShape(shape);
        var blockPos = {x: mouseX - this.nextBlock.width / 2,
                        y: mouseY - this.nextBlock.height / 2};

        colliding = colliding || (mouseY + this.nextBlock.height / 2 > canvas.height - 20);

        if (!colliding) {
          this.addBlock(new Block(blockPos.x, blockPos.y,
                                  this.nextBlock.width, this.nextBlock.height,
                                  this.color));
          socket.emit("newblock", {x: blockPos.x,
                                   y: blockPos.y,
                                   width: this.nextBlock.width,
                                   height: this.nextBlock.height,
                                   color: this.color});

          this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};
          this.canInsertBlock = false;
        }
      }
    } else {
      this.canInsertBlock = true;
    }

    /* clouds! */
    for (var i = 0; i < this.clouds.sprites.length; i++) {
      var cloud = this.clouds.sprites[i];
      cloud.x += cloud.speed * this.dt;

      if (cloud.x < - 70 || cloud.x > (640 + 70)) {
        this.clouds.remove(cloud);
      }
    }

    if (!getRandomInt(0, 60 * 20)) {
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

    drawString(this.blocks.length.toString(), 10, 10, "#000000");

    if (this.hintBlock) {
      this.hintBlock.draw();
    }

    this.blockss.draw();
    this.clouds.draw();
    this.background.draw();
  }
}

var playState = new PlayState();
desiredFPS = 60;
switchState(playState);
