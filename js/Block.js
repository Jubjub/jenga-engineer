/* basic construction piece */
Block = (function () {
  function constructor(x, y, width, height) {
    this.sprite = new Sprite(null, x, y);
    var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    this.sprite.makeGraphic(width, height, color);
    this.acceleration = {x : 0, y : 2};
    this.atoms = [{x : x, y : y}, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    this.oldatoms = [{x : x, y : y }, {x : x + width, y : y},
                  {x : x + width, y : y + height}, {x : x, y : y + height}];
    var h = Math.sqrt(width * width + height * height);
    this.edges = [[0, 1, width], [1, 2, height], [2, 3, width], [3, 0, height], [0, 2, h]];
    preventKeys("space");
  }

  constructor.prototype = {
    update: function() {

    },

    projectToAxis: function(axis) {
      var dot = vec2Dot(axis, this.atoms[0]);
      var min = dot;
      var max = dot;
      for (var i = 1; i < this.atoms.length; i++) {
        dot = vec2Dot(axis, this.atoms[i]);
        min = Math.min(dot, min);
        max = Math.max(dot, max);
      }
      return [min, max];
    },

    collide: function(other) {
      var collisionInfo = {};
      var minDistance = 100000000;
      for (var i = 0; i < this.edges.length + other.edges.length; i++) {
        var edge;
        var obj;
        if (i < this.edges.length) {
          obj = this;
          edge = this.edges[i];
        } else {
          obj = other;
          edge = other.edges[i - this.edges.length];
        }
        var atom1 = obj.atoms[edge[0]];
        var atom2 = obj.atoms[edge[1]];
        var axis = {x : atom1.y - atom2.y, y : atom2.x - atom1.x};
        vec2Normalize(axis);
        var proj1 = this.projectToAxis(axis);
        var proj2 = other.projectToAxis(axis);
        var distance = intervalDistance(proj1, proj2);
        if (distance > 0) {
          return false;
        } else if (Math.abs(distance) < minDistance) {
          minDistance = Math.abs(distance);
          collisionInfo.normal = axis;
        }
      }
      collisionInfo.depth = minDistance;
      return collisionInfo;
    }
  }

  return constructor;
})();
