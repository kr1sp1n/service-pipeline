var debug = require('debug')('pipeline:server')
var server = require(__dirname + '/src/server.js')

server.listen(server.app.get('port'), function () {
  debug('Running on port %s', server.app.get('port'))
})
