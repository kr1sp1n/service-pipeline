var debug = require('debug')('pipeline:Pipeline')
// var uuid = require('uuid')
var _ = require('lodash')
var Firebase = require('firebase')

var validate = function (opts) {
  return function (req, res, next) {
    var body = req.body
    var name = body.name
    if (!name || name === '') {
      return next(new Error('Pipeline with no name is not allowed'))
    }
    var pipeline_name = new Firebase([opts.firebase_endpoint, 'pipeline_names', name].join('/'))
    pipeline_name
    .once('value', function (snap) {
      if(snap.val()) {
        return next(new Error('Pipeline with name ' + name + ' already exists'))
      } else {
        next()
      }
    })
  }
}

var newItem = function (opts) {
  return function (req, res, next) {
    var data = req.body
    req.pipeline = {
      // id: data.id || uuid.v1(),
      name: data.name,
      description: data.description || '',
      steps: data.steps || [],
      globals: data.globals || {},
      callbacks: data.callbacks || {}
    }
    next()
  }
}

var add = function (opts) {
  var pipelines = new Firebase([opts.firebase_endpoint, 'pipelines'].join('/'))
  return function (req, res, next) {
    var name = req.pipeline.name
    debug('add %s', name)
    var pipeline_name = new Firebase([opts.firebase_endpoint, 'pipeline_names', name].join('/'))
    pipeline_name.set(true)
    var item = pipelines.push(req.pipeline)
    item.update({'id': item.key()})
    req.pipeline.id = item.key()
    next()
  }
}

var create = function (opts) {
  return [validate(opts), newItem(opts), add(opts)]
}

var find = function (opts) {
  return function (req, res, next) {
    var id = req.params.id
    new Firebase([opts.firebase_endpoint, 'pipelines', id].join('/')).once('value', function (snap) {
      var found = snap.val()
      if (!found) {
        return next(new Error('Pipeline with id ' + id + ' not found'))
      }
      req.pipeline = found
      next()
    })
  }
}

var remove = function (opts) {
  return function (req, res, next) {
    var id = req.params.id
    var pipeline = new Firebase([opts.firebase_endpoint, 'pipelines', id].join('/'))
    pipeline.once('value', function (snapshot) {
      if (!snapshot.exists()) {
        return next(new Error('Pipeline with id ' + id + ' does not exist'))
      } else {
        pipeline.remove(function (err) {
          if (err) return next(err)
          var name = snapshot.val().name
          var pipeline_name = new Firebase([opts.firebase_endpoint, 'pipeline_names', name].join('/'))
          pipeline_name.remove(function (err) {
            if (err) return next(err)
            req.pipeline = snapshot.val()
            next()
          })
        })
      }
    })
  }
}

var all = function (opts) {
  var pipelines = new Firebase([opts.firebase_endpoint, 'pipelines'].join('/'))
  return function (req, res, next) {
    pipelines.once('value', function (snapshot) {
      if (snapshot.val() === null) {
        req.pipelines = []
      } else {
        req.pipelines = _.map(snapshot.val(), function (n) {
          return n
        })
      }
      next()
    }, function (err) {
      next(err)
    })
  }
}

module.exports = function (opts) {
  var config = opts || {}
  config.pipelines = config.pipelines || []
  return {
    validate: validate(config),
    create: create(config),
    newItem: newItem(config),
    find: find(config),
    all: all(config),
    add: add(config),
    remove: remove(config)
  }
}
