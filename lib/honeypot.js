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
    this.emit('ready');
    this.inject();
  }.bind(this));

  this._socket.on('error', function (error) {
    logger.error('An exception associated with the socket occurred:' + error.message + '.');
    logger.error(error.stack);
    this.emit('error', error);
  }.bind(this));

  this._socket.on('message', function (message, rinfo) {
    logger.debug('Received message ' + message + ' from ' + rinfo.address + ':' + rinfo.port);

    message = helpers.decodeMessage(message);

    if (message.y !== 'r') {
      console.log(message);

    }

    if (message.r && message.r.nodes) {
      this.nodes = this.nodes.concat(message.r.nodes);
      _.each(this.nodes, function (node) {
        helpers.sendMessage(this._socket, {
          y: 'q',
          q: 'find_node'
        }, node);
      }, this);
    }

    // this.emit('message', , rinfo);
  }.bind(this));


  this._socket.bind(options.port);
};

util.inherits(Honeypot, events.EventEmitter);

// Inject honeypot into the BitTorrent DHT network.
Honeypot.prototype.inject = function () {
  logger.info('Joining BitTorrent Mainline DHT network...');
  _.each(this.nodes, function (node) {
    // logger.debug('Querying ' + node + '...');

    helpers.sendMessage(this._socket, {
      y: 'q',
      q: 'find_node'
    }, node);

    logger.debug('Queried ' + node);
  }, this);
};

var honeypot = new Honeypot();

module.exports = exports = Honeypot;
