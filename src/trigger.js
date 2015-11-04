var debug = require('debug')('pipeline:Trigger')
var _ = require('lodash')
var uuid = require('uuid')

var newItem = function (opts) {
  return function (req, res, next) {
    var data = req.body.data || {}
    var callbacks = req.body.callbacks || {}
    req.trigger = {
      cid: req.cid || uuid.v1(),
      pipeline_id: req.pipeline.id,
      data: _.cloneDeep(data),
      callbacks: _.cloneDeep(callbacks),
      steps: _.cloneDeep(req.pipeline.steps) || [],
      step_index: 0,
      steps_done: [],
      steps_pending: _.cloneDeep(req.pipeline.steps) || []
    }
    next()
  }
}

var add = function (opts) {
  return function (req, res, next) {
    opts.triggers.push(req.trigger)
    next()
  }
}

var find = function (opts) {
  return function (req, res, next) {
    req.trigger = _.find(opts.triggers, 'cid', req.cid)
    next()
  }
}

var create = function (opts) {
  return function (req, res, next) {
    newItem(opts)(req, res, function (err) {
      if (err) return next(err)
      add(opts)(req, res, next)
    })
  }
}

var createOrProceed = function (opts) {
  return [find(opts), function (req, res, next) {
    if (!req.trigger) {
      // assume it is the first call
      debug('create for %s', req.pipeline.id)
      return create(opts)(req, res, next)
    } else {
      debug('proceed')
      req.last_step = req.trigger.steps[req.trigger.step_index]
      req.last_step.response = req.body
      req.trigger.steps_done.push(req.last_step)
      req.trigger.step_index += 1
    }
    next()
  }]
}

module.exports = function (opts) {
  var config = opts || {}
  config.triggers = config.triggers || []
  return {
    find: find(config),
    newItem: newItem(config),
    add: add(config),
    createOrProceed: createOrProceed(config)
  }
}
