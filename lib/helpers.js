var bencode = require('bencode'),
    compact2string = require('compact2string'),
    _ = require('lodash'),
    hat = require('hat');

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

helpers.query = function (socket, message, address, port, callback) {
  callback = callback || _.noop();
  var preparedMessage = _.defaults(message, {
    t: new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]),
    y: 'q'
    // q: type,
    // a: args
  });
  var packet = bencode.encode(preparedMessage);
  socket.send(packet, 0, packet.length, port, address, function() {

  });
};

// Needs to be bound to object having _socket property.
helpers.sendMessage = function (socket, message, node, callback) {
  node = node.split(':');
  var address = node[0];
  var port = node[1];

  message = helpers.encodeMessage(message);

  socket.send(message, 0, message.length, port, address, callback);
};

helpers.encodeMessage = function (message) {
  message.t = message.t || 4567; // TransactionID doesn't need to be a hex.
  message.t = helpers.transactionIDToBuffer(message.t);

  if (message.y === 'q') {
    message.a = message.a || {};
    message.a.id = message.a.id || hat(160);
    message.a.id = new Buffer(message.a.id, 'hex');
    if (message.q === 'find_node') {
      message.a.target = message.a.target || hat(160);
      message.a.target = new Buffer(message.a.target, 'hex');
    } else if (message.q === 'ping') {
    } else if (message.q === 'get_peers') {
      message.a.info_hash = message.a.info_hash || hat(160);
      message.a.info_hash = new Buffer(message.a.info_hash, 'hex');
    } else if (message.q === 'announce_peers') {
      // TODO
    }
  } else if (message.y === 'r') {
    // TODO
  } else if (message.y === 'e') {
    // TODO
  }

  return bencode.encode(message);
};

helpers.decodeMessage = function (message) {
  message = bencode.decode(message);

  message.t = Buffer.isBuffer(message.t) && message.t.length === 2 && message.t.readUInt16BE(0);
  if (message.r && message.r.values) {
    message.r.values = _.map(message.r.values, function (peer) {
      return compact2string(peer);
    });
  }
  if (message.r && message.r.nodes && Buffer.isBuffer(message.r.nodes)) {
    var nodes = [];
    for (var i = 0; i < message.r.nodes.length; i += 26) {
      var node = compact2string(message.r.nodes.slice(i + 20, i + 26));
      nodes.push(node);
    }
    message.r.nodes = nodes;
  }
  if (message.t) {
    message.t = message.t.toString();
  }
  if (message.y) {
    message.y = message.y.toString();
  }
  if (message.r && message.r.id) {
    message.r.id = message.r.id.toString('hex');
  }

  return message;
};

module.exports = exports = helpers;
