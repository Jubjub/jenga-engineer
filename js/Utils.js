/* Utils */
function vec2Angle(v1, v2) {
  return Math.atan2(v2.y - v1.y, v2.x - v1.x) * radToDeg;
}

function vec2Dot(v1, v2) {
  return (v1.x * v2.x + v1.y * v2.y);
}

function vec2Length(v1) {
  return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
}

function vec2Normalize(v1) {
  var l = vec2Length(v1);
  v1.x /= l;
  v1.y /= l;
}

function intervalDistance(proj1, proj2) {
  if (proj1[0] < proj2[0]) {
    return proj2[0] - proj1[1];
  } else {
    return proj1[0] - proj2[1];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playSound(path) {
    var cha = new Audio();
    var canPlayOgg = !!cha.canPlayType && cha.canPlayType('audio/ogg; codecs="vorbis"') != "";
    if (canPlayOgg) {
      path = path + ".ogg";
    } else {
      path = path + ".mp3";
    }
    cha = new Audio(path);
    cha.play();
    return cha;
}

