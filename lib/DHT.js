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

DHT.nodeID = hat(160);

DHT.sendMessage = function (socket, message, address, port, callback) {
  callback = callback || _.noop();
  var transactionID = new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]);
  var preparedMessage = _.defaults(message, {
    t: transactionID
    // y: 'q'
    // q: type,
    // a: args
  });
  var packet = bencode.encode(preparedMessage);
  socket.send(packet, 0, packet.length, port, address, function() {
    console.log(transactionID.toString('hex'));
  });
};

var socket = dgram.createSocket('udp4');
socket.bind(6881, function() {
  _.each(BOOTSTRAP_NODES, function (BOOTSTRAP_NODE) {
    BOOTSTRAP_NODE = BOOTSTRAP_NODE.split(':');
    DHT.sendMessage(socket, {
      y: 'q',
      q: 'ping',
      a: {
        id: new Buffer(DHT.nodeID, 'hex')
      }
    }, BOOTSTRAP_NODE[0], BOOTSTRAP_NODE[1]);
  });
});

socket.on('message', function (message, rinfo) {
  message = bencode.decode(message);
  console.log(message);
}.bind(this));
