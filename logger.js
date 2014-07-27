// Usage:
// var logger = require('./logger');
// logger.debug('Debug message');
// logger.info('Info message');
// logger.warn('Warn message');
// logger.error('Error message');
// logger.addLevels({
//   silly: 'white'
// });
// logger.silly('Silly message');
//
// Further reading:
// * http://12factor.net/logs

var colors = require('colors'),
    _ = require('lodash');

var makeLogFunction = function (color, level) {
  return function (msg) {
    console.log(('[' + level + ']')[color] + ' ' + new Date().toString().grey + ' ' + msg + ' ');
  };
};

var logger = {
  addLevels: function (levels) {
    logger = _.defaults(logger, _.mapValues(levels, makeLogFunction));
  }
};

logger.addLevels({
  debug: 'grey',
  info: 'blue',
  warn: 'orange',
  error: 'red'
});

module.exports = logger;
