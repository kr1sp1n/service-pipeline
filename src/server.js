var debug = require('debug')('pipeline:server')
var express = require('express')
var http = require('http')
var router = require(__dirname + '/router.js')
var app = express()
var port = process.env['PORT'] || 4000
var endpoint = process.env['ENDPOINT'] || 'http://localhost:' + port

app.set('port', port)
app.set('endpoint', endpoint)
// mount router
app.use('/', router)

var server = http.createServer(app)
server.app = app
if (!module.parent) {
  server.listen(app.get('port'), function () {
    debug('Node app is running on port %s', app.get('port'))
  })
}

module.exports = server
