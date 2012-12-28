var blockTypes = ["assets/img/block_lattice.png",
                  "assets/img/block_brick.png",
                  "assets/img/block_wood.png"
                 ];

/* Basic construction piece */
Block = (function () {
  function constructor(x, y, width, height, color, type) {
    this.sprite = new Sprite(null, x, y);
    if (!type) {
      type = getRandomInt(0, blockTypes.length - 1);
    }
    this.type = type;
    this.width = width;
    this.height = height;
    //this.sprite.makeGraphic(width, height, "#333333");
    this.sprite.makeGraphic(width + 2, height + 2, color);
    this.sprite.internalctx.clearRect(1, 1, width - 2, height - 2);
    if (this.type >= 0) {
      for (var x = 1; x <= width; x += 30) {
        this.sprite.stampImage(x, 1, blockTypes[this.type]);
      }
    }
    this.sprite.offset.x += width / 2;
    this.sprite.offset.y += height / 2;
  }

  constructor.prototype = {
    update: function() {

    }
  }

  return constructor;
})();
