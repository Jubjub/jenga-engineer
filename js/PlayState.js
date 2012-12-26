/* keep socket external for reconnection */
var socket;

/* Main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = [];
    this.blockss = new SpriteList();

    this.space = new cp.Space();
    this.space.iterations = 10;
    this.space.gravity = new cp.Vect(0, 150);
    this.ground = this.space.addShape(new cp.SegmentShape(this.space.staticBody,
                                      new cp.Vect(0, 460), new cp.Vect(640, 460), 1));
    this.ground.setElasticity(0);
    this.ground.setFriction(1);

    this.hintBlock = new Sprite(null, 0, 0);
    this.hintBlock.alpha = 0.5;

    this.canInsertBlock = true;
    this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};

    this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    
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
    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {
    this.space.step(this.dt);

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
        var colliding = false;
        var blockPos = {x: mouseX - this.nextBlock.width / 2,
                        y: mouseY - this.nextBlock.height / 2};
        var tmpBlock = new Block(blockPos.x, blockPos.y,
                                 this.nextBlock.width, this.nextBlock.height);

        /*
        for (var i = 0; i < this.blocks.length; i++) {
          colliding = colliding || (tmpBlock.collide(this.blocks[i]));

          if (colliding) {
            break;
          }
        }
        */

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
  }

  this.draw = function() {
    clearCanvas();

    drawString(this.blocks.length.toString(), 10, 10, "#000000");
    drawRectangle(context.width / 2 - 300 / 2, context.height - 20, 300, 20, "#000000");

    if (this.hintBlock) {
      this.hintBlock.draw();
    }

    this.blockss.draw();
  }
}

var playState = new PlayState();
desiredFPS = 60;
switchState(playState);
