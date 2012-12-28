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
    this.sprite.makeGraphic(width, height, "transparent");
    //this.sprite.stampRect(1, 1, width - 2, height - 2, color);
    if (this.type >= 0) {
      for (var x = 0; x <= width; x += 30) {
        this.sprite.stampImage(x, 0, blockTypes[this.type]);
      }
    }
    this.sprite.offset.x += width / 2;
    this.sprite.offset.y += height / 2;
    this.acceleration = {x: 0, y: 400};
  }

  constructor.prototype = {
    update: function() {

    }
  }

  return constructor;
})();
