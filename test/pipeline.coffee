
sinon = require 'sinon'
should = require 'should'

describe 'Pipeline', ->

  Pipeline = require "#{__dirname}/../src/pipeline"

  describe 'validate', ->

      it 'should throw an error if name is already used', (done)->
        item = name: 'test1'
        p = Pipeline(pipelines: [item])
        req = { body: { name: 'test1' } }
        res = null

        p.validate req, res, (err)->
          should.exist(err)
          err.message.should.equal "Pipeline with name #{item.name} already exists"
          done null
