var debug = require('debug')('pipeline:Trigger')
var _ = require('lodash')

// save every pipeline triggering
// in-memory storage
var triggers = []

var item = function (req, res, next) {
  var data = req.body.data || {}
  var callbacks = req.body.callbacks || {}
  req.trigger = {
    cid: req.cid,
    pipeline_id: req.pipeline.id,
    data: _.cloneDeep(data),
    callbacks: _.cloneDeep(callbacks),
    steps: _.cloneDeep(req.pipeline.steps),
    step_index: 0,
    steps_done: [],
    steps_pending: _.cloneDeep(req.pipeline.steps)
  }
  next()
}

var add = function (req, res, next) {
  triggers.push(req.trigger)
  next()
}

var find = function (req, res, next) {
  req.trigger = _.find(triggers, 'cid', req.cid)
  next()
}

var create = function (req, res, next) {
  item(req, res, function (err) {
    if (err) return next(err)
    add(req, res, next)
  })
}

var createOrProceed = [find, function (req, res, next) {
  if (!req.trigger) {
    // assume it is the first call
    debug('create for %s', req.pipeline.id)
    return create(req, res, next)
  } else {
    debug('proceed')
    req.last_step = req.trigger.steps[req.trigger.step_index]
    req.last_step.response = req.body
    req.trigger.steps_done.push(req.last_step)
    req.trigger.step_index += 1
  }
  next()
}]

module.exports = {
  find: find,
  createOrProceed: createOrProceed
}
