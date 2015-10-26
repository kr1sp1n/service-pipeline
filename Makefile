# get Makefile directory name: http://stackoverflow.com/a/5982798/376773
THIS_MAKEFILE_PATH:=$(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
THIS_DIR:=$(shell cd $(dir $(THIS_MAKEFILE_PATH));pwd)

PIPELINE_ENDPOINT:=http://localhost:4000

# BIN directory
BIN := $(THIS_DIR)/node_modules/.bin

# applications
NODE ?= $(shell which node)
NPM ?= $(NODE) $(shell which npm)

install: node_modules

node_modules: package.json
	@NODE_ENV= $(NPM) install
	@touch node_modules

clean:
	@rm -rf node_modules

clean_seeds:
	@curl -X DELETE $(PIPELINE_ENDPOINT)/123
	@curl -X DELETE $(PIPELINE_ENDPOINT)/234
	@curl -X DELETE $(PIPELINE_ENDPOINT)/345
	@curl -X DELETE $(PIPELINE_ENDPOINT)/create_github_org_team
	@curl -X DELETE $(PIPELINE_ENDPOINT)/create_hitfox_project
	@curl -X DELETE $(PIPELINE_ENDPOINT)/create_hitfox_test_project

seeds:
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_123.json
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_234.json
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_345.json
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_github_org_team.json
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_hitfox_project.json
	@curl -X POST $(PIPELINE_ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_hitfox_test_project.json

.PHONY: all install clean
