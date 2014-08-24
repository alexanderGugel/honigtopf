var bencode = require('bencode'),
    compact2string = require('compact2string'),
    _ = require('lodash'),
    hat = require('hat'),
    dgram = require('dgram'),
    portfinder = require('portfinder'),
    logger = require('./logger');

var _init = function() {
  logger.debug('Initializing ' + this.infoHash + '...');

  this.nodeIdBuffer = new Buffer(this.infoHash, 'hex');
  this.nodeIdBuffer[this.nodeIdBuffer.length-1] = this.nodeIdBuffer[this.nodeIdBuffer.length-1] - 1;
  this.nodeIdBuffer = new Buffer(this.nodeIdBuffer.toString('hex'), 'hex');
  // this.nodeIdBuffer = new Buffer(hat(160), 'hex');

  this.socket = dgram.createSocket('udp4');
  this.socket.on('message', this.processMessage.bind(this));
  this.socket.bind(this.port, function() { // 6881
    logger.debug('Successfully initialized honeypot for ' + this.infoHash);
    logger.debug('Successfully created honeypot for ' + this.infoHash);
    _.each(this.BOOTSTRAP_NODES, function (BOOTSTRAP_NODE) {
      BOOTSTRAP_NODE = BOOTSTRAP_NODE.split(':');
      this.inject(BOOTSTRAP_NODE[0], BOOTSTRAP_NODE[1]);
    }, this);
  }.bind(this));
};

var Honeypot = function (infoHash, port) {
  if (!infoHash) {
    logger.warn('Tried creating new honeypot, but didn\'t specify infoHash');
    return;
  }
  logger.info('Creating new honeypot for infoHash ' + this.infoHash + '...');
  this.infoHash = infoHash;
  this.port = port;
  if (!port) {
    logger.debug('Searching unused port for honeypot ' + this.infoHash + ' using portfinder...');
    portfinder.getPort(function (err, port) {
      if (err) {
        logger.error('Failed finding port using portfinder: ' + err.message);
        logger.error(JSON.stringify(err));
        return;
      }
      this.port = port;
      logger.debug('Port ' + this.port + ' for honeypot ' + this.infoHash + ' has been found and provisioned');
      _init.call(this);
    }.bind(this));
  } else {
    logger.debug('Port for honeypot ' + this.infoHash + ' specified');
    _init.call(this);
  }
};

Honeypot.prototype.BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

Honeypot.prototype.inject = _.throttle(function (address, port, callback) {
  this.transact({
    y: 'q',
    q: 'find_node',
    a: {
      id: this.nodeIdBuffer,
      target: new Buffer(hat(160), 'hex')
    }
  }, address, port, callback);
}, 100);

Honeypot.prototype.transact = function (transaction, address, port, callback) {
  port = parseInt(port);
  if (port <= 0 || port > 65536) {
    return;
  }
  callback = callback || _.noop;
  var transactionId = new Buffer([~~(Math.random() * 256), ~~(Math.random() * 256)]);
  var preparedMessage = _.defaults(transaction, {
    t: transactionId
  });
  var packet = bencode.encode(preparedMessage);
  this.socket.send(packet, 0, packet.length, port, address, function(err) {
    callback(err, {
      transactionId: preparedMessage.t.toString('hex')
    });
  });
};

Honeypot.prototype.processMessage = function (message, rinfo) {
  var transaction = bencode.decode(message);

  if (transaction.q) {
    transaction.q = transaction.q.toString();
  }

  if (transaction.y) {
    transaction.y = transaction.y.toString();
  }

  if (transaction.y !== 'r') {
    console.log(transaction);
  }

  if (transaction.q === 'ping') {
    this.transact({
      t: transaction.t,
      y: 'r',
      r: {
        id: this.nodeIdBuffer
      }
    }, rinfo.address, rinfo.port);
  } else if (transaction.q === 'find_node') {
    this.transact({
      t: transaction.t,
      y: 'r',
      r: {
        id: this.nodeIdBuffer
      }
    }, rinfo.address, rinfo.port);
  }

  if (transaction.r && transaction.r.nodes && Buffer.isBuffer(transaction.r.nodes)) {
    for (var i = 0; i < transaction.r.nodes.length; i += 26) {
      var node = compact2string(transaction.r.nodes.slice(i + 20, i + 26)).split(':');
      this.inject(node[0], node[1]);
    }
  }
};

new Honeypot('247A424720EF8AC435C31D62A33CA16BA63C56E4');
// new Honeypot(hat(160));
