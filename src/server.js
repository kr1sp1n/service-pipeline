// var debug = require('debug')('pipeline:server')
var express = require('express')
var http = require('http')

var router_config = {
  http_request_service: process.env['HTTP_REQUEST_SERVICE']
}

var router = require(__dirname + '/router.js')(router_config)
var app = express()
var port = process.env['PORT'] || 4000
var endpoint = process.env['ENDPOINT'] || 'http://localhost:' + port

app.set('port', port)
app.set('endpoint', endpoint)
// mount router
app.use('/', router)

var server = http.createServer(app)
server.app = app

module.exports = server
