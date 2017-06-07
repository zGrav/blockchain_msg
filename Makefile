install:
	yarn install

test:
	yarn run test

run: install
	NODE_ENV=development DEBUG=* node --max_old_space_size=4096 server/index.js
