
should = require 'should'

describe 'server', ->

  server = require "#{__dirname}/../src/server"

  it 'should have set the default port', ->
    server.app.get('port').should.equal 4000

  it 'should have set the default endpoint', ->
    port = server.app.get('port')
    server.app.get('endpoint').should.equal "http://localhost:#{port}"
