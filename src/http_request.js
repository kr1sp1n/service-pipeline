var request = require('request')

module.exports = function (config) {
  return function (data, done) {
    var opts = {
      method: 'POST',
      uri: config.http_request_service,
      json: data
    }
    request(opts, done)
  }
}
