// var debug = require('debug')('pipeline:server')
var express = require('express')
var http = require('http')

var config = require(__dirname + '/../config.js')
var router = require(__dirname + '/router.js')(config)
var app = express()
var port = config.port || 4000
var endpoint = config.endpoint || 'http://localhost:' + port

app.set('port', port)
app.set('endpoint', endpoint)
// mount router
app.use('/', router)

var server = http.createServer(app)
server.app = app

module.exports = server
