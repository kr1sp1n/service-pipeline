var debug = require('debug')('pipeline:Pipeline')
var uuid = require('uuid')
var _ = require('lodash')

var validate = function (opts) {
  return function (req, res, next) {
    var body = req.body
    var name = body.name
    var result = _.result(_.find(opts.pipelines, 'name', name), 'name')
    if (result) {
      return next(new Error('Pipeline with name ' + name + ' already exists'))
    }
    next()
  }
}

var item = function (opts) {
  return function (req, res, next) {
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
}

var add = function (opts) {
  return function (req, res, next) {
    debug('add %s', req.pipeline.name)
    opts.pipelines.push(req.pipeline)
    next()
  }
}

var create = function (opts) {
  return [validate(opts), item(opts), add(opts)]
}

var find = function (opts) {
  return function (req, res, next) {
    var id = req.params.id
    var found = _.find(opts.pipelines, 'id', id)
    if (!found) {
      return next(new Error('Pipeline with id: ' + id + ' not found').toString())
    }
    req.pipeline = found
    next()
  }
}

var remove = function (opts) {
  return function (req, res, next) {
    var id = req.params.id
    req.pipeline = _.remove(opts.pipelines, function (n) {
      return n.id === id
    })[0]
  }
}

var all = function (opts) {
  return function (req, res, next) {
    req.pipelines = _.cloneDeep(opts.pipelines)
    next()
  }
}

module.exports = function (opts) {
  var config = opts || {}
  config.pipelines = config.pipelines || []
  return {
    validate: validate(config),
    create: create(config),
    find: find(config),
    all: all(config),
    remove: remove(config)
  }
}
