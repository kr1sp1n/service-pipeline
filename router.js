var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var _ = require('lodash')
var request = require('request')
request = request.defaults({ json: true })
var Mustache = require('mustache')

var http_request_service = 'http://localhost:3000'
var router = express.Router()
router.use(bodyParser.json())

var pipelines = []
// save every pipeline triggering
var triggers = []

var p1 = {
  id: '123',
  name: 'Create Github Repo',
  steps: [
    {
      template: { uri: 'https://raw.githubusercontent.com/kr1sp1n/http-request-templates/master/create_github_repo.txt' }
    }
  ]
}

pipelines.push(p1)

// parse or generate correlation id
var parseCID = function (req, res, next) {
  var cid = req.headers['x-cid']
  if (!cid) { cid = uuid.v1() }
  req.cid = cid
  next()
}

var validatePipeline = function (req, res, next) {
  var id = uuid.v1()
  var body = req.body
  var name = body.name
  var result = _.result(_.find(pipelines, 'name', name), 'name')

  if (result) {
    return next(new Error('Pipeline with name: ' + name + ' already exists').toString())
  }

  req.pipeline = {
    id: id,
    name: name,
    description: body.description,
    steps: body.steps
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

// POST new pipeline
router.post('/', validatePipeline, function (req, res) {
  pipelines.push(req.pipeline)
  res.send(req.pipeline)
})

// GET pipeline by its id
router.get('/:id', findPipeline, function (req, res) {
  res.send(req.pipeline)
})

router.post('/done', parseCID, function (req, res) {
  console.log('DONE', req.cid)
  res.send()
})

router.post('/fail', parseCID, function (req, res) {
  console.log('FAIL', req.cid)
  res.send()
})

// PUT something in a pipeline
router.put('/:id', findPipeline, parseCID, findTrigger, function (req, res) {
  console.log('PUT', req.params.id)
  if (!req.trigger) {
    req.trigger = {
      cid: req.cid,
      data: req.body.data,
      callbacks: req.body.callbacks,
      steps: _.cloneDeep(req.pipeline.steps)
    }
    // assume it is the first call
    triggers.push(req.trigger)
    console.log('start pipeline triggered with cid: ', req.cid)
  } else {
    console.log('trigger found!!')
    console.log('proceed pipeline triggered with cid:', req.cid)
  }
  res.send()
  var step = req.trigger.steps.pop()

  // check if more steps
  if (!step) {
    console.log('no more steps!')
    console.log('do final callback')
    var opts = req.trigger.callbacks['success']
    http_request(opts)
  } else {
    request(step.template, function (err, response, body) {
      if (err) { console.log(err) }
      var result = Mustache.render(body, req.trigger.data)
      result = JSON.parse(result)
      var headers = {
        'X-CID': req.cid
      }
      // mid-step callbacks
      result.callbacks = {
        '201': {
          uri: [req.app.get('endpoint'), req.pipeline.id].join('/'),
          method: 'PUT',
          headers: headers
        },
        'fail': _.assign(req.trigger.callbacks['fail'], { headers: headers })
      }
      http_request(result, function (err, response, body) {
        if (err) console.log(err)
      })
    })
  }
})

module.exports = router
