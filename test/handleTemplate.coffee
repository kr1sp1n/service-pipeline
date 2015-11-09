should = require 'should'
sinon = require 'sinon'
request = require 'request'

describe 'handleTemplate', ->

  ht = require "#{__dirname}/../src/handleTemplate"

  it 'should request a template if it is an object and result should be a string', (done)->
    handleTemplate = ht()
    template =
      uri: 'https://raw.githubusercontent.com/kr1sp1n/http-request-templates/master/github/get_github_repo_branch.txt'
    handleTemplate template, (err, result)=>
      result.should.be.an.instanceOf(String)
      done err

  it 'should pass a template if it is a string and result should be a string', (done)->
    handleTemplate = ht()
    template = "hello {{person}}"
    handleTemplate template, (err, result)=>
      result.should.be.an.instanceOf(String)
      done err

  # it 'should stringify any json body of a response', (done)->
  #   spy = sinon.spy request
  #   handleTemplate = ht(
  #     request: spy
  #   )
  #   template =
  #     uri: 'https://raw.githubusercontent.com/kr1sp1n/http-request-templates/master/github/get_github_repo_branch.txt'
  #   handleTemplate template, (err, result)=>
  #     result.should.be.an.instanceOf(String)
  #     done err
