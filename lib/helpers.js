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

module.exports = exports = helpers;
