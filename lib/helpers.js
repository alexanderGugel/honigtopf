var bencode = require('bencode'),
    compact2string = require('compact2string');

var helpers = {};

helpers.BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

// Add 1 to infoHash. Therefore distance(nodeID, infoHash) will be 1. We do this
// in order to appear as a peer which is in possession of the queried data.
helpers.genNodeID = function (infoHash) {
  var nodeIDBuffer = new Buffer(infoHash, 'hex');
  nodeIDBuffer[nodeIDBuffer.length-1] = nodeIDBuffer[nodeIDBuffer.length-1]++;
  return nodeIDBuffer.toString('hex');
};

helpers.transactionIDToBuffer = function (transactionId) {
  var buf = new Buffer(2);
  buf.writeUInt16BE(transactionId, 0);
  return buf;
};

// Needs to be bound to object having _socket property.
helpers.sendMessage = function (message, node, callback) {
  node = node.split(':');
  var address = node[0];
  var port = node[1];

  // encode message
  message = helpers.encodeMessage(message);

  this._socket.send(message, 0, message.length, port, address, callback);
};

helpers.encodeMessage = function (message) {
  message = bencode.encode(message);
  return message;
};

helpers.decodeMessage = function (message) {
  message = bencode.decode(message);
  return message;
};

module.exports = exports = helpers;
