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

var Honeypot = function (options) {
  options = options || {};
  options.port = options.port || 6881;

  events.EventEmitter.call(this);
  var socket = dgram.createSocket('udp4');

  socket.on('listening', function () {
    logger.info('Socket successfully bound to port ' + options.port);
    this.emit('ready');
  }.bind(this));

  socket.on('error', function (error) {
    logger.error('An exception associated with the socket occurred:' + error.message + '.');
    logger.error(error);
    this.emit('error', error);
  }.bind(this));

  socket.on('message', function (message, rinfo) {
    logger.debug('Received message ' + message + ' from ' + rinfo.address + ':' + rinfo.port);
    this.emit('message', message, rinfo);
  });

  socket.bind(options.port);
};

util.inherits(Honeypot, events.EventEmitter);

module.exports = exports = Honeypot;
