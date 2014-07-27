var LRU = require('lru-cache');

var nodePool = LRU({
  max: 20000,
  maxAge: 1000*30
});

module.exports = exports = nodePool;
