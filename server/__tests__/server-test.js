import { expect } from 'jest';

describe('Server', () => {
	it('should be able to run tests', () => {
		expect(1 + 2).toEqual(3);
	});
});

const crypto = require('crypto');
const CryptoJS = require('crypto-js');

let randomGenesisHash;

const currentdate = (new Date()).valueOf().toString();
const random = Math.random().toString();

randomGenesisHash = crypto.createHash('sha1').update(currentdate + random).digest('hex');
randomGenesisHash = CryptoJS.SHA256(CryptoJS.SHA256(randomGenesisHash)).toString(CryptoJS.enc.Base64);

describe('Server', () => {
	it('should be able to define a randomGenesisHash', () => {
		expect(randomGenesisHash).toBeDefined();
	});
});

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

describe('Server', () => {
	it('should be able to see data inside genesis block', () => {
		expect(genesis.hash).toBe(randomGenesisHash);
		expect(genesis.data.sender).toBe(randomGenesisHash);
		expect(genesis.data.message).toBe('time has begun flowing...');
	});
});
