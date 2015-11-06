
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


  describe 'create', ->

    it 'should create new trigger and add it to a list', (done)->
      list = []
      t = Trigger(triggers: list)
      t.create @req, @res, (err)=>
        @req.should.have.property 'trigger'
        list.length.should.equal 1
        done err


  describe 'createOrProceed', ->

    beforeEach ->
      @t = Trigger()
      @item =
        cid: '123'
        steps: [
          { template: { uri: 'https://example.com/mytemplate' } }
        ]
        steps_done: []
        step_index: 0

    it 'should return an array of functions', ->
      @t.createOrProceed.should.be.an.array

    it 'should have the "find" function as the first entry', ->
      @t.createOrProceed[0].should.eql @t.find

    it 'should create a new trigger if no trigger with req.cid could be found', (done)->
      list = []
      t = Trigger(triggers: list)
      t.createOrProceed[1] @req, @res, (err)=>
        list.length.should.equal 1
        done err

    it 'should proceed if a trigger was found in a list by req.cid', (done)->
      list = [@item]
      @req.cid = '123'
      t = Trigger(triggers: list)
      # call find first
      t.createOrProceed[0] @req, @res, (err)=>
        @req.should.have.property 'trigger'
        t.createOrProceed[1] @req, @res, (err)=>
          # should stay the same
          list.length.should.equal 1
          done err

    it 'should increment the step_index of a found trigger if a trigger proceeds', (done)->
      list = [@item]
      @req.cid = '123'
      t = Trigger(triggers: list)
      # call find first
      t.createOrProceed[0] @req, @res, (err)=>
        @req.should.have.property 'trigger'
        t.createOrProceed[1] @req, @res, (err)=>
          @item.step_index.should.equal 1
          done err


  describe 'fail', ->

    it 'should set the "failed" property of a trigger to true', (done)->
      @req.trigger = {}
      t = Trigger()
      t.fail @req, @res, (err)=>
        @req.trigger.should.have.property 'failed', true
        done err
