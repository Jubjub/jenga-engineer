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
    this.computeCenter();
  }

  constructor.prototype = {
    update: function() {

    },

    projectToAxis: function(axis) {
      var dot = vec2Dot(axis, this.atoms[0]);
      var min = dot;
      var max = dot;
      var l = this.atoms.length;
      for (var i = 1; i < this.atoms.length; i++) {
        dot = vec2Dot(axis, this.atoms[i]);
        min = Math.min(dot, min);
        max = Math.max(dot, max);
      }
      return [min, max];
    },

    collide: function(other) {
      var radius1 = Math.max(this.width, this.height);
      var radius2 = Math.max(other.width, other.height);
      var mindcs = radius1 * radius1 * radius2 * radius2;
      var cd = {x : this.center.x - other.center.x, y : this.center.y - other.center.y};
      if ((cd.x * cd.x + cd.y * cd.y) > mindcs / 2) {
        return false;
      }
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
          collisionInfo.object = obj;
          collisionInfo.edge = edge;
        }
      }
      collisionInfo.depth = minDistance;
      var b1 = this;
      var b2 = other;
      if (collisionInfo.object != b2) {
        var tmp = b2;
        b2 = b1;
        b1 = tmp;
      }
      collisionInfo.b1 = b1;
      collisionInfo.b2 = b2;
      var ddc = {x : b1.center.x - b2.center.x, y : b1.center.y - b2.center.y};
      var nc = vec2Dot(collisionInfo.normal, ddc);
      var sign = nc && nc / Math.abs(nc);
      if (sign != 1) {
        collisionInfo.normal.x = -collisionInfo.normal.x;
        collisionInfo.normal.y = -collisionInfo.normal.y;
      }
      var smallestD = 100000;
      for (var i = 0; i < b1.atoms.length; i++) {
        var dr = {x : b1.atoms[i].x - b2.center.x, y : b1.atoms[i].y - b2.center.y};
        var ddd = vec2Dot(collisionInfo.normal, dr);
        if (ddd < smallestD) {
          smallestD = ddd;
          collisionInfo.atom = b1.atoms[i];
        }
      }
      return collisionInfo;
    },

    computeCenter: function() {
      this.center = {x : 0, y : 0};
      for (var i = 0; i < this.atoms.length; i++) {
        this.center.x += this.atoms[i].x;
        this.center.y += this.atoms[i].y;
      }
      this.center.x /= this.atoms.length;
      this.center.y /= this.atoms.length;
    }
  }

  return constructor;
})();
