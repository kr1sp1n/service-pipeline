
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

    it 'should throw an error if name is empty', (done)->
      p = Pipeline()
      req = { body: {} }
      res = null
      p.validate req, res, (err)->
        should.exist(err)
        err.message.should.equal "Pipeline with no name is not allowed"
        done null

  describe 'newItem', ->
    beforeEach ->
      @req = { body: { name: 'test1' } }
      @res = null
      @p = Pipeline()

    it 'should extend req with a new pipeline', (done)->
      @p.newItem @req, @res, (err)=>
        @req.should.have.property 'pipeline'
        @req.pipeline.name.should.equal 'test1'
        done err

    it 'should generate a unique id if no req.body.id', (done)->
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'id'
        done err

    it 'should overwrite unique id if req.body.id', (done)->
      @req.body.id = '123'
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'id', @req.body.id
        done err

    it 'should set description to empty string if no req.body.description', (done)->
      @req.body = {}
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'description', ''
        done err
