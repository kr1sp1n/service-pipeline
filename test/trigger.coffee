
should = require 'should'

describe 'Trigger', ->

  Trigger = require "#{__dirname}/../src/trigger"

  beforeEach ->
    @res = null
    @req =
      params: {}
      pipeline:
        id: 123
        steps: [
          { template: { uri: "https://example.com/mytemplate" } }
        ]
      body:
        data:
          hello: 'world'
        callbacks:
          success: { uri: "https://example.com/success" }

  describe 'newItem', ->

    beforeEach ->
      @t = Trigger()

    it 'should extend req with a new trigger', (done)->
      @t.newItem @req, @res, (err)=>
        @req.should.have.property 'trigger'
        @req.trigger.data.should.eql @req.body.data
        @req.trigger.pipeline_id.should.eql @req.pipeline.id
        @req.trigger.callbacks.should.eql @req.body.callbacks
        @req.trigger.steps.should.eql @req.pipeline.steps
        @req.trigger.steps_pending.should.eql @req.pipeline.steps
        @req.trigger.step_index.should.equal 0
        @req.trigger.steps_done.should.eql []
        done err

    it 'should generate a unique id if no req.cid', (done)->
      @t.newItem @req, @res, (err)=>
        @req.trigger.should.have.property 'cid'
        done err

    it 'should overwrite cid if req.cid', (done)->
      @req.cid = '123'
      @t.newItem @req, @res, (err)=>
        @req.trigger.should.have.property 'cid', @req.cid
        done err


  describe 'add', ->

    it 'should save a new trigger into a list', (done)->
      list = []
      @req.trigger =
        cid: '123'
      t = Trigger(triggers: list)
      t.add @req, @res, (err)=>
        list.length.should.equal 1
        done err


  describe 'find', ->

    it 'should find a trigger by its cid', (done)->
      @req.cid = 123
      item = cid: 123
      t = Trigger(triggers: [item])
      t.find @req, @res, (err)=>
        @req.trigger.should.equal item
        done err
