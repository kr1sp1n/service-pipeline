
should = require 'should'

describe 'Pipeline', ->

  Pipeline = require "#{__dirname}/../src/pipeline"

  beforeEach ->
    @res = null
    @req =
      params: {}
      body:
        name: 'test1'
        description: 'My awesome pipeline'
        steps: [ { template: { uri: "https://example.com/mytemplate" } } ]
        globals:
          hello: 'World'
        callbacks:
          success: { uri: "https://example.com/success" }


  describe 'validate', ->

    it 'should pass if req.body is valid', (done)->
      p = Pipeline()
      p.validate @req, @res, (err)=>
        done err

    it 'should throw an error if name is already used', (done)->
      item = name: 'test1'
      p = Pipeline(pipelines: [item])
      @req.body = { name: 'test1' }
      p.validate @req, @res, (err)->
        should.exist(err)
        err.message.should.equal "Pipeline with name #{item.name} already exists"
        done null

    it 'should throw an error if name is empty', (done)->
      p = Pipeline()
      @req.body = {}
      p.validate @req, @res, (err)->
        should.exist(err)
        err.message.should.equal "Pipeline with no name is not allowed"
        done null


  describe 'newItem', ->

    beforeEach ->
      @p = Pipeline()

    it 'should extend req with a new pipeline', (done)->
      @p.newItem @req, @res, (err)=>
        @req.should.have.property 'pipeline'
        @req.pipeline.name.should.equal @req.body.name
        @req.pipeline.description.should.equal @req.body.description
        @req.pipeline.steps.should.equal @req.body.steps
        @req.pipeline.globals.should.equal @req.body.globals
        @req.pipeline.callbacks.should.equal @req.body.callbacks
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

    it 'should set steps to empty array if no req.body.steps', (done)->
      @req.body = {}
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'steps', []
        done err

    it 'should set globals to empty object if no req.body.globals', (done)->
      @req.body = {}
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'globals', {}
        done err

    it 'should set callbacks to empty object if no req.body.callbacks', (done)->
      @req.body = {}
      @p.newItem @req, @res, (err)=>
        @req.pipeline.should.have.property 'callbacks', {}
        done err


  describe 'add', ->

    it 'should save a new pipeline into a list', (done)->
      list = []
      @req.pipeline =
        name: 'test1'
      p = Pipeline(pipelines: list)
      p.add @req, @res, (err)=>
        list.length.should.equal 1
        done err


  describe 'create', ->
    beforeEach ->
      @p = Pipeline()

    it 'should be an array of functions', ->
      @p.create.should.be.an.array

    it 'should have the right order of functions', ->
      @p.create[0].should.eql @p.validate
      @p.create[1].should.eql @p.newItem
      @p.create[2].should.eql @p.add


  describe 'find', ->

    it 'should find a pipeline by its id', (done)->
      @req.params.id = 123
      item = id: 123, name: 'test1'
      p = Pipeline(pipelines: [item])
      p.find @req, @res, (err)=>
        @req.pipeline.should.equal item
        done err

    it 'should throw an error if pipeline was not found', (done)->
      @req.params.id = 123
      p = Pipeline()
      p.find @req, @res, (err)=>
        should.exist(err)
        err.message.should.equal "Pipeline with id #{@req.params.id} not found"
        done null


  describe 'remove', ->

    beforeEach ->
      @req.params.id = 123
      @item = id: 123, name: 'test1'
      @list = [@item]
      @p = Pipeline(pipelines: @list)

    it 'should delete a pipeline from a list', (done)->
      @p.remove @req, @res, (err)=>
        @list.length.should.equal 0
        done err

    it 'should extend req with the removed pipeline', (done)->
      @p.remove @req, @res, (err)=>
        @req.pipeline.should.eql @item
        done err

    it 'should throw an error if pipeline could not be found by its id', (done)->
      @req.params.id = 'wtf'
      @p.remove @req, @res, (err)=>
        should.exist(err)
        err.message.should.equal "Pipeline with id #{@req.params.id} does not exist"
        done null


  describe 'all', ->

    it 'should extend req with a list of all pipelines', (done)->
      list = [{ name: 'test1'}, { name: 'test2' }]
      p = Pipeline(pipelines: list)
      p.all @req, @res, (err)=>
        @req.should.have.property 'pipelines'
        @req.pipelines.should.eql list
        done err
