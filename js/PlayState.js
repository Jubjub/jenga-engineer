/* keep socket external for reconnection */
var socket;

/* Main game state */
function PlayState() {
  this.setup = function() {
    this.blocks = [];
    this.blockss = new SpriteList();

    this.hintBlock = new Sprite(null, 0, 0);
    this.hintBlock.alpha = 0.5;

    this.canInsertBlock = true;
    this.nextBlock = {width: getRandomInt(10, 100), height: getRandomInt(10, 50)};

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
    this.blocks.push(block);
    this.blockss.push(block.sprite);
  }

  this.update = function() {
    simulateBlocks(this.blocks, this.dt);

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
        var blockPos = {x :mouseX - this.nextBlock.width / 2,
                        y : mouseY - this.nextBlock.height / 2};
        var tmpBlock = new Block(blockPos.x, blockPos.y,
                                 this.nextBlock.width, this.nextBlock.height);

        for (var i = 0; i < this.blocks.length; i++) {
          colliding = colliding || (tmpBlock.collide(this.blocks[i]));

          if (colliding) {
            break;
          }
        }

        colliding = colliding || (mouseY + this.nextBlock.height / 2 > canvas.height - 20);

        if (!colliding) {
          var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
          this.addBlock(new Block(blockPos.x, blockPos.y,
                                  this.nextBlock.width, this.nextBlock.height,
                                  color));
          socket.emit("newblock", {x: blockPos.x,
                                   y: blockPos.y,
                                   width: this.nextBlock.width,
                                   height: this.nextBlock.height,
                                   color: color});

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

    /* draw atoms */
    /*
    for (var i = 0; i < this.blocks.length; i++) {
      var block = this.blocks[i];
      for (var j = 0; j < block.atoms.length; j++) {
        var atom = block.atoms[j];
        context.fillStyle = "#00ff00";
        context.fillRect(atom.x - 2.5, atom.y - 2.5, 5, 5);
      }
    }
    */

    /* draw bounding boxes */
    /*
    for (var i = 0; i < this.blocks.length; i++) {
      var block = this.blocks[i];
      var bbox = block.bbox;
      if (!bbox) {
        continue;
      }
      context.strokeStyle = "#ff0000";
      context.beginPath();
      context.moveTo(bbox.min.x, bbox.min.y);
      context.lineTo(bbox.min.x, bbox.max.y);
      context.lineTo(bbox.max.x, bbox.max.y);
      context.lineTo(bbox.max.x, bbox.min.y);
      context.lineTo(bbox.min.x, bbox.min.y);
      context.stroke();
    }
    */

    drawString(this.blocks.length.toString(), 10, 10, "#000000");
    //this.addBlock(new Block(context.width / 2 - 300 / 2, 80, 300, 20));
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
