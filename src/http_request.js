var request = require('request')

module.exports = function (opts) {
  return function (data, done) {
    var opts = {
      method: 'POST',
      uri: opts.http_request_service,
      body: data
    }
    request(opts, done)
  }
}
