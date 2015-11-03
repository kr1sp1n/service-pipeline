var debug = require('debug')('pipeline:Pipeline')
var uuid = require('uuid')
var _ = require('lodash')

// storage
var pipelines = []

var validate = function (req, res, next) {
  var body = req.body
  var name = body.name
  var result = _.result(_.find(pipelines, 'name', name), 'name')
  if (result) {
    return next(new Error('Pipeline with name: ' + name + ' already exists').toString())
  }
  next()
}

var item = function (req, res, next) {
  var data = req.body
  req.pipeline = {
    id: data.id || uuid.v1(),
    name: data.name || '',
    description: data.description || '',
    steps: data.steps || [],
    globals: data.globals || {},
    callbacks: data.callbacks || {}
  }
  next()
}

var add = function (req, res, next) {
  debug('add %s', req.pipeline.name)
  pipelines.push(req.pipeline)
  next()
}

var create = [validate, item, add]

var find = function (req, res, next) {
  var id = req.params.id
  var found = _.find(pipelines, 'id', id)
  if (!found) {
    return next(new Error('Pipeline with id: ' + id + ' not found').toString())
  }
  req.pipeline = found
  next()
}

var remove = function (req, res, next) {
  var id = req.params.id
  req.pipeline = _.remove(pipelines, function (n) {
    return n.id === id
  })[0]
}

var all = function (req, res, next) {
  req.pipelines = _.cloneDeep(pipelines)
  next()
}

module.exports = {
  create: create,
  find: find,
  all: all,
  remove: remove
}
