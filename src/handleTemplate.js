var _ = require('lodash')

module.exports = function (opts) {
  opts = opts || {}
  var request = (opts.request === undefined) ? require('request') : opts.request
  return function (template, done) {
    if (_.isString(template)) {
      done(null, template)
    }
    if (_.isObject(template)) {
      var opts = template
      opts.json = false
      request(opts, function (err, response, body) {
        if (_.isObject(body)) {
          body = JSON.stringify(body)
        }
        done(err, body)
      })
    }
  }
}
