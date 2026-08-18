SHELL := /usr/bin/env bash

.PHONY: smoke setup qa fixture reset status

smoke:
	bash ./scripts/runtime-smoke.sh

setup:
	bash ./scripts/setup.sh

qa:
	bash ./scripts/setup.sh
	bash ./scripts/qa.sh

fixture:
	@test -n "$(FIXTURE)" || (echo "Usage: make fixture FIXTURE=repeater-8-items"; exit 2)
	bash ./scripts/apply-fixture.sh "$(FIXTURE)"

status:
	bash ./scripts/status.sh

reset:
	bash ./scripts/reset.sh
