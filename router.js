var debug = require('debug')('pipeline:router')
var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var _ = require('lodash')
var request = require('request')
request = request.defaults({ json: true })
var Handlebars = require('handlebars')

var http_request_service = 'http://localhost:3000'
var router = express.Router()
router.use(bodyParser.json())

var pipelines = []
// save every pipeline triggering
var triggers = []

// parse or generate correlation id
var parseCID = function (req, res, next) {
  var cid = req.headers['x-cid']
  if (!cid) { cid = uuid.v1() }
  req.cid = cid
  next()
}

var validatePipeline = function (req, res, next) {
  var body = req.body
  var id = body.id || uuid.v1()
  var name = body.name
  var result = _.result(_.find(pipelines, 'name', name), 'name')
  var description = body.description || ''
  var steps = body.steps || []
  var globals = body.globals || {}
  var callbacks = body.callbacks || {}
  if (result) {
    return next(new Error('Pipeline with name: ' + name + ' already exists').toString())
  }
  req.pipeline = {
    id: id,
    name: name,
    description: description,
    steps: steps,
    globals: globals,
    callbacks: callbacks
  }
  next()
}

var findPipeline = function (req, res, next) {
  var id = req.params.id
  var found = _.find(pipelines, 'id', id)
  if (!found) {
    return next(new Error('Pipeline with id: ' + id + ' not found').toString())
  }
  req.pipeline = found
  next()
}

var findTrigger = function (req, res, next) {
  req.trigger = _.find(triggers, 'cid', req.cid)
  next()
}

var http_request = function (data, done) {
  var opts = {
    method: 'POST',
    uri: http_request_service,
    body: data
  }
  request(opts, done)
}

var handleTemplate = function (template, done) {
  debug('handle template')
  if (_.isString(template)) {
    debug('template is string')
    done(null, template)
  }
  if (_.isObject(template)) {
    debug('template is object')
    var opts = template
    opts.json = false
    debug('do http request with')
    debug(opts)
    request(opts, function (err, response, body) {
      debug('...response')
      debug(body)
      if (_.isObject(body)) {
        debug('body is object')
        body = JSON.stringify(body)
      }
      done(err, body)
    })
  }
}

// POST new pipeline
router.post('/', validatePipeline, function (req, res) {
  pipelines.push(req.pipeline)
  res.send(req.pipeline)
})

// GET all pipelines
router.get('/', function (req, res) {
  res.send(pipelines)
})

// GET pipeline by its id
router.get('/:id', findPipeline, function (req, res) {
  res.send(req.pipeline)
})

// DELETE pipeline by its id
router.delete('/:id', function (req, res) {
  var id = req.params.id
  var pipeline = _.remove(pipelines, function (n) {
    return n.id === id
  })
  res.send(pipeline[0])
})

router.post('/done', parseCID, function (req, res) {
  debug('DONE', req.cid)
  debug(req.body)
  res.send()
})

router.post('/fail', parseCID, function (req, res) {
  debug('FAIL', req.cid)
  debug(req.body)
  res.send()
})

// PUT something in a pipeline
router.put('/:id', findPipeline, parseCID, findTrigger, function (req, res) {
  debug('pipeline %s triggered', req.pipeline.name)
  var globals = req.pipeline.globals || {}
  if (!req.trigger) {
    var data = req.body.data || {}
    var callbacks = req.body.callbacks || {}
    req.trigger = {
      cid: req.cid,
      data: _.cloneDeep(data),
      callbacks: _.cloneDeep(callbacks),
      steps: _.cloneDeep(req.pipeline.steps),
      step_index: 0,
      steps_done: [],
      steps_pending: _.cloneDeep(req.pipeline.steps)
    }
    // assume it is the first call
    triggers.push(req.trigger)
    debug('Start pipeline triggered with cid: ', req.cid)
  } else {
    debug('Proceed pipeline triggered with cid:', req.cid)
    var last_step = req.trigger.steps[req.trigger.step_index]
    last_step.response = req.body
    req.trigger.steps_done.push(last_step)
    req.trigger.step_index += 1
  }
  res.send(req.trigger)
  var step = req.trigger.steps_pending.shift()
  // check if more steps
  if (!step) {
    debug('No more steps!')
    var cb = _.defaultsDeep(req.trigger.callbacks, req.pipeline.callbacks)
    var opts = cb['success']
    if (!opts) {
      debug('No callback for success.')
    } else {
      debug('Do final callback...')
      var response = req.trigger.steps_done[req.trigger.steps_done.length - 1].response
      var body = opts.body || {}
      opts.body = _.defaultsDeep(body, response)
      debug(opts)
      http_request(opts, function (err, response, body) {
        if (err) debug(err)
        debug('...final callback done')
      })
    }
  } else {
    handleTemplate(step.template, function (err, body) {
      if (err) debug(err)
      var defaults = step.defaults || {}
      var is_pipeline = step.is_pipeline || false
      // _.cloneDeep(req.body)
      var data = _.defaultsDeep(_.cloneDeep(req.trigger.data), defaults, globals)
      var template = Handlebars.compile(body)
      var result = template(data)
      debug('rendered:')
      debug(result)
      try {
        result = JSON.parse(result)
      } catch (e) {
        debug(e)
      }
      var headers = {
        'X-CID': req.cid
      }
      // mid-step callbacks
      var callbacks = {
        'success': {
          uri: [req.app.get('endpoint'), req.pipeline.id].join('/'),
          method: 'PUT',
          headers: headers,
          response: step.response
        },
        'fail': _.defaultsDeep(req.trigger.callbacks['fail'], { headers: headers })
      }
      if (is_pipeline) {
        result.body = result.body || {}
        result.body.callbacks = callbacks
      } else {
        result.callbacks = callbacks
      }
      debug('Execute step %s', req.trigger.step_index)
      debug(result)
      http_request(result, function (err, response, body) {
        debug('step response')
        debug(body)
        if (err) debug(err)
      })
    })
  }
})

module.exports = router
