importScripts('crypto-js/crypto-js.js'); // delete when webpack/browserify is used

function work(block, difficulty) {
	let counter = 0;
	let prefix = '';

	for (let i = 0; i < difficulty; i++) {
		prefix += '0';
	}

	// console.log("worker difficulty prefix is " + prefix);

	/* Adjust difficulty based on amount of messages. */
	while (!block.hash.startsWith(prefix)) {
		/* nonce is about to flip over, update timestamp and start again. */
		if (block.header.nonce === Number.MAX_VALUE - 1) {
			block.header.nonce = Number.MIN_VALUE;
			block.header.timestamp = new Date().valueOf();
		}

		block.header.nonce++;
		block.hash = CryptoJS.SHA256(CryptoJS.SHA256(JSON.stringify(block))).toString(CryptoJS.enc.Base64);

		counter++;

		if (counter % 1000 === 0) {
			// console.log("worker sha256 counter is " + counter);
		}
	}

	// console.log("created block: " + JSON.stringify(block));

	return block;
}

/* callback from main script */
onmessage = function(e) {
	// console.log('Message received from main script');

	const block = e.data[0];
	const difficulty = e.data[1];

	// console.log("worker:onmessage block is " + JSON.stringify(block));
	// console.log("worker:onmessage difficulty is " + JSON.stringify(difficulty));

	const result = work(block, difficulty);

	// console.log("worker found a result: " + JSON.stringify(block));

	postMessage(result);
};
