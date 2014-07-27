var  _ = require('lodash'),
    dgram = require('dgram'),
    util = require('util'),
    events = require('events'),
    hat = require('hat'),
    logger = require('./logger'),
    helpers = require('./helpers');

var Honeypot = function (options) {
  options = options || {};
  this.nodes = options.nodes || helpers.BOOTSTRAP_NODES;
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

// Mix in helper methods as private properties.
_(helpers).functions().each(function (methodName) {
  this['_' + methodName] = helpers[methodName];
}, Honeypot.prototype);

// Join the BitTorrent DHT network.
Honeypot.prototype.join = function () {
  logger.info('Joining BitTorrent Mainline DHT network...');
  _.each(this.nodes, function (node) {
    logger.debug('Querying ' + node + '...');

    this._sendMessage({
      t: this._transactionIDToBuffer(3456),
      y: 'q',
      q: 'find_node',
      a: {
        // The nodeID and nodeID of the target do not matter at all. We are only
        // interested in getting new nodes.
        id: new Buffer(hat(160), 'hex'),
        target: new Buffer(hat(160), 'hex')
      }
    }, node);

    logger.debug('Queried ' + node);
  }, this);
};

var honeypot = new Honeypot();

module.exports = exports = Honeypot;
