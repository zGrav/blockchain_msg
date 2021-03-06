const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const { debug } = require('tools/log')('server');
const trace = require('debug')('server:');
const error = require('debug')('server:');
/* eslint-disable no-console */
trace.log = console.trace.bind(console);
error.log = console.error.bind(console);
/* eslint-enable no-console */

const path = require('path');

app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/app', express.static(path.join(__dirname, '../app')));

let randomGenesisHash = '';

const currentdate = (new Date()).valueOf().toString();
const random = Math.random().toString();

randomGenesisHash = crypto.createHash('sha1').update(currentdate + random).digest('hex');
randomGenesisHash = CryptoJS.SHA256(CryptoJS.SHA256(randomGenesisHash)).toString(CryptoJS.enc.Base64);

const genesis = {
	hash: randomGenesisHash,
	header: {
		index: 0,
		previousHash: '',
		timestamp: Math.floor(Date.now()),
		nonce: 0,
	},
	data: {
		sender: randomGenesisHash,
		message: 'time has begun flowing...',
	},
};

let difficulty = 1;
let users = [];
const blocks = [ genesis ];
let nBlocks = blocks.length;
/*
   Adjust difficulty as follows:
   difficulty = number of received blocks during last minute (+ 1)
*/
setInterval(function() {
	difficulty = (blocks.length - nBlocks) + 1;
	nBlocks = blocks.length;
	debug('Difficulty during previous 15 seconds: ' + difficulty);
	io.emit('set-difficulty', difficulty);
}, 15000);

function getPlainUsersArray(users) {
	const output = [];

	for (let i = 0; i < users.length; i++) {
		const user = {};
		user['id'] = users[i].id;
		user['address'] = users[i].request.connection._peername.address;
		user['family'] = users[i].request.connection._peername.family;
		user['port'] = users[i].request.connection._peername.port;
		output.push(user);
	}

	debug('getPlainUsersArray(): ' + JSON.stringify(output));

	return output;
}

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/blockchain', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(blocks));
});

io.on('connection', function(socket) {

	/* Upon receiving a new connection, inform the client of its identity. */
	socket.emit('set-identity', socket.id);

	/* Upon receiving a new connection, update the list of clients and send it to all clients. */
	users.push(socket);
	io.emit('set-peers', getPlainUsersArray(users));

	socket.on('get-peers', function() {
		socket.emit('set-peers', getPlainUsersArray(users));
	});

	socket.on('get-difficulty', function() {
		socket.emit('set-difficulty', difficulty);
	});

	socket.on('get-blocks', function() {
		socket.emit('set-blocks', blocks);
	});

	socket.on('new-block', function(block) {
		const lastBlock = blocks[blocks.length - 1];

		/* validate block */

		/* validate sender id */
		if (block.data.sender.valueOf() === socket.id.valueOf()) {
			debug('sender id matches');
		} else {
			debug('sender id does not match');
		}

		/* validate index */
		if (block.header.index === lastBlock.header.index + 1) {
			debug('index matches');
		} else {
			debug('index does not match');
		}

		/* validate hash */
		if (block.header.previousHash.valueOf() === lastBlock.hash.valueOf()) {
			debug('previousHash matches');
		} else {
			debug('previousHash does not match');
		}

		/* JSON.parse(block); */
		debug('on block: ' + JSON.stringify(block));

		blocks.push(block);
		io.emit('new-block', block);

		difficulty++;
		io.emit('set-difficulty', difficulty);
	});

	socket.on('disconnect', function() {
		users = users.filter(function(el) { return el.id !== socket.id; });
		io.emit('users', getPlainUsersArray(users));
	});
});

http.listen(3000, function() {
	debug('listening on *:3000');
});
