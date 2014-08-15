var bencode = require('bencode'),
    compact2string = require('compact2string'),
    _ = require('lodash'),
    hat = require('hat'),
    dgram = require('dgram');

var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

var DHT = {};

DHT.genNodeId = function (infoHash) {
  // infoHash = infoHash || '04A8C73349E0FE148557C3A9BA8482E0AA67AD49';
  // var nodeIdBuffer = new Buffer(infoHash, 'hex');
  // nodeIdBuffer[nodeIdBuffer.length-1] = nodeIdBuffer[nodeIdBuffer.length-1]++;
  // return nodeIdBuffer.toString('hex');
  //
  return new Buffer(hat(160), 'hex');
};

DHT.transact =  _.throttle(function (socket, message, address, port, callback) {
  callback = callback || _.noop;
  var transactionID = new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]);
  var preparedMessage = _.defaults(message, {
    t: transactionID
  });
  var packet = bencode.encode(preparedMessage);
  socket.send(packet, 0, packet.length, port, address, function(err) {
    callback(err, transactionID.toString('hex'));
  });
}, 100);



var socket = dgram.createSocket('udp4');
socket.bind(6881, function() {
  _.each(BOOTSTRAP_NODES, function (BOOTSTRAP_NODE) {
    BOOTSTRAP_NODE = BOOTSTRAP_NODE.split(':');
    DHT.transact(socket, {
      y: 'q',
      q: 'find_node',
      a: {
        id: new Buffer(DHT.genNodeId(), 'hex'),
        target: new Buffer(DHT.genNodeId(), 'hex')
      }
    }, BOOTSTRAP_NODE[0], BOOTSTRAP_NODE[1]);
  });
});

socket.on('message', function (transaction, rinfo) {
  transaction = bencode.decode(transaction);
  transaction.y = transaction.y.toString();
  transaction.q = transaction.q && transaction.q.toString();

  if (transaction.y !== 'r') {
    console.log(transaction);
  }

  if (transaction.r && transaction.r.nodes && Buffer.isBuffer(transaction.r.nodes)) {
    for (var i = 0; i < transaction.r.nodes.length; i += 26) {
      var node = compact2string(transaction.r.nodes.slice(i + 20, i + 26)).split(':');
      DHT.transact(socket, {
        y: 'q',
        q: 'find_node',
        a: {
          id: new Buffer(DHT.genNodeId(), 'hex'),
          target: new Buffer(DHT.genNodeId(), 'hex')
        }
      }, node[0], node[1]);
    }
  }
}.bind(this));
