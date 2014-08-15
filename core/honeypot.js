var bencode = require('bencode'),
    compact2string = require('compact2string'),
    _ = require('lodash'),
    hat = require('hat'),
    dgram = require('dgram');

var Honeypot = function (infoHash) {
  this.nodeIdBuffer = new Buffer(infoHash, 'hex');
  // this.nodeIdBuffer[this.nodeIdBuffer.length-1] = this.nodeIdBuffer[this.nodeIdBuffer.length-1]++;
  // this.nodeIdBuffer = new Buffer(this.nodeIdBuffer.toString('hex'), 'hex');
  this.socket = dgram.createSocket('udp4');
  var self = this;
  this.socket.on('message', this.processMessage.bind(this));
  this.socket.bind(6881, function() {
    _.each(this.BOOTSTRAP_NODES, function (BOOTSTRAP_NODE) {
      BOOTSTRAP_NODE = BOOTSTRAP_NODE.split(':');
      this.inject(BOOTSTRAP_NODE[0], BOOTSTRAP_NODE[1]);
    }, this);
  }.bind(this));
};

Honeypot.prototype.BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

Honeypot.prototype.inject = function (address, port, callback) {
  this.transact({
    y: 'q',
    q: 'find_node',
    a: {
      id: this.nodeIdBuffer,
      target: this.nodeIdBuffer
    }
  }, address, port, callback);
};

Honeypot.prototype.transact =  _.throttle(function (transaction, address, port, callback) {
  callback = callback || _.noop;
  var transactionId = new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]);
  var preparedMessage = _.defaults(transaction, {
    t: transactionId
  });
  var packet = bencode.encode(preparedMessage);
  this.socket.send(packet, 0, packet.length, port, address, function(err) {
    callback(err, {
      transactionId: transactionId.toString('hex')
    });
  });
}, 10);

Honeypot.prototype.processMessage = function (message, rinfo) {
  var transaction = bencode.decode(message);
  transaction.y = transaction.y.toString();
  transaction.q = transaction.q && transaction.q.toString();

  if (transaction.y !== 'r') {
    console.log(transaction);
  }

  if (transaction.r && transaction.r.nodes && Buffer.isBuffer(transaction.r.nodes)) {
    for (var i = 0; i < transaction.r.nodes.length; i += 26) {
      var node = compact2string(transaction.r.nodes.slice(i + 20, i + 26)).split(':');
      this.inject(node[0], node[1]);
    }
  }
};

// new Honeypot('247A424720EF8AC435C31D62A33CA16BA63C56E4');
new Honeypot(hat(160));
