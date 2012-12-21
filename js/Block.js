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
