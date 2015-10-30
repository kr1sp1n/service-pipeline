# get Makefile directory name: http://stackoverflow.com/a/5982798/376773
THIS_MAKEFILE_PATH:=$(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
THIS_DIR:=$(shell cd $(dir $(THIS_MAKEFILE_PATH));pwd)

ENDPOINT ?= http://localhost:4000

# BIN directory
BIN := $(THIS_DIR)/node_modules/.bin

# applications
NODE ?= $(shell which node)
NPM ?= $(NODE) $(shell which npm)

PROJECT  ?= kr1sp1n/service-pipeline
TAG      ?= latest
PORT 		 ?= 4000

ifdef REGISTRY
	IMAGE=$(REGISTRY)/$(PROJECT):$(TAG)
else
	IMAGE=$(PROJECT):$(TAG)
endif

all:
	@echo "Available targets:"
	@echo "  * build - build a Docker image for $(IMAGE)"
	@echo "  * pull  - pull $(IMAGE)"
	@echo "  * push  - push $(IMAGE)"
	@echo "  * test  - build and test $(IMAGE)"

install: package.json node_modules
	npm install

build: Dockerfile install
	docker build -t $(IMAGE) .

run:
	docker run -d -p $(PORT):$(PORT) $(IMAGE)

pull:
	docker pull $(IMAGE) || true

push:
	docker push $(IMAGE)

node_modules: package.json
	@NODE_ENV= $(NPM) install
	@touch node_modules

clean:
	@rm -rf node_modules

clean_seed:
	@curl -X DELETE $(ENDPOINT)/create_github_repo
	@curl -X DELETE $(ENDPOINT)/create_github_org_repo
	@curl -X DELETE $(ENDPOINT)/delete_github_repo
	@curl -X DELETE $(ENDPOINT)/create_github_org_team
	@curl -X DELETE $(ENDPOINT)/create_hitfox_project
	@curl -X DELETE $(ENDPOINT)/create_hitfox_test_project
	@curl -X DELETE $(ENDPOINT)/create_github_develop_branch
	@curl -X DELETE $(ENDPOINT)/ping
	@curl -X DELETE $(ENDPOINT)/pong

seed:
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_github_repo.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_github_org_repo.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_delete_github_repo.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_github_org_team.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_hitfox_project.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_hitfox_test_project.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_create_github_develop_branch.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_ping.json
	@curl -X POST $(ENDPOINT)/ -H "Content-Type: application/json" -d @test/fixtures/pipe_pong.json

.PHONY: all install clean
