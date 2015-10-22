var express = require('express')
var http = require('http')
var router = require(__dirname + '/router.js')
var app = express()
var port = process.env['PORT'] || 4000

app.set('port', port)
app.set('endpoint', 'http://localhost:' + app.get('port'))
app.use('/', router)

var server = http.createServer(app)
server.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'))
})
