/* Basic construction piece */
Block = (function () {
  function constructor(x, y, width, height, color) {
    this.sprite = new Sprite(null, x, y);
    this.width = width;
    this.height = height;
    this.sprite.makeGraphic(width, height, color);
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
