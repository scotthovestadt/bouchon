require('babel-core/register');
require('babel-polyfill');

module.exports = {
  default: [
    require('./articles').default,
    require('./operations').default,
  ],
};