var  _ = require('lodash'),
    bencode = require('bencode'),
    dgram = require('dgram'),
    util = require('util'),
    events = require('events'),
    hat = require('hat'),
    compact2string = require('compact2string'),
    logger = require('./logger');

var BOOTSTRAP_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881'
];

// Add 1 to infoHash. Therefore distance(nodeID, infoHash) will be 1. We do this
// in order to appear as a peer which is in possession of the queried data.
var genNodeID = function (infoHash) {
  var nodeIDBuffer = new Buffer(infoHash, 'hex');
  nodeIDBuffer[nodeIDBuffer.length-1] = nodeIDBuffer[nodeIDBuffer.length-1]++;
  return nodeIDBuffer.toString('hex');
};

var transactionIDToBuffer = function (transactionId) {
  var buf = new Buffer(2);
  buf.writeUInt16BE(transactionId, 0);
  return buf;
};

var Honeypot = function (options) {
  options = options || {};
  this.nodes = options.nodes || BOOTSTRAP_NODES;
  options.port = options.port || 6881;

  events.EventEmitter.call(this);
  this._socket = dgram.createSocket('udp4');

  this._socket.on('listening', function () {
    logger.info('Socket successfully bound to port ' + options.port);
    this.join();
    this.emit('ready');
  }.bind(this));

  this._socket.on('error', function (error) {
    logger.error('An exception associated with the socket occurred:' + error.message + '.');
    logger.error(error);
    this.emit('error', error);
  }.bind(this));

  this._socket.on('message', function (message, rinfo) {
    logger.debug('Received message ' + message + ' from ' + rinfo.address + ':' + rinfo.port);
    this.emit('message', message, rinfo);
  }.bind(this));

  this._socket.bind(options.port);
};

util.inherits(Honeypot, events.EventEmitter);

// Join the BitTorrent DHT network.
Honeypot.prototype.join = function () {
  logger.info('Joining BitTorrent Mainline DHT network...');
  _.each(this.nodes, function (node) {
    node = node.split(':');
    var address = node[0];
    var port = node[1];

    var message = bencode.encode({
      t: transactionIDToBuffer(3456),
      y: 'q',
      q: 'find_node',
      a: {
        // The nodeID and nodeID of the target do not matter at all. We are only
        // interested in getting new nodes.
        id: new Buffer(hat(160), 'hex'),
        target: new Buffer(hat(160), 'hex')
      }
    });

    this._socket.send(message, 0, message.length, port, address);
    logger.debug('Queried ' + address + ':' + port);
  }, this);
};

// var honeypot = new Honeypot();

module.exports = exports = Honeypot;
