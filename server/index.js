let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let crypto = require('crypto');
let CryptoJS = require('crypto-js');
const path = require('path');

app.use('/public', express.static(path.join(__dirname, '../public')))
app.use('/app', express.static(path.join(__dirname, '../app')))

let randomGenesisHash = "";

let current_date = (new Date()).valueOf().toString();
let random = Math.random().toString();

randomGenesisHash = crypto.createHash('sha1').update(current_date + random).digest('hex');
randomGenesisHash = CryptoJS.SHA256(CryptoJS.SHA256(randomGenesisHash)).toString(CryptoJS.enc.Base64);

let genesis = {
  hash: randomGenesisHash,
  header: {
    index: 0,
    previousHash: "",
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 0
  },
  data: {
    sender: "zgrav",
    message: "time has begun flowing.",
  }
};

let difficulty = 1;
let users = [];
let blocks = [ genesis ];
let nBlocks = blocks.length;
/*
   Adjust difficulty as follows:
   difficulty = number of received blocks during last minute (+ 1)
*/
setInterval(function() {
  difficulty = (blocks.length - nBlocks) + 1;
  nBlocks = blocks.length;
  console.log("Difficulty during previous 15 seconds: " +difficulty);
  io.emit('set-difficulty', difficulty);
}, 15000);

function getPlainUsersArray(users) {
    let output = [];

    for(var i = 0; i < users.length; i++) {
      let user = {};
      user['id'] = users[i].id;
      user['address'] = users[i].request.connection._peername.address;
      user['family'] = users[i].request.connection._peername.family;
      user['port'] = users[i].request.connection._peername.port;
      output.push(user);
    }

    console.log("getPlainUsersArray(): " + JSON.stringify(output));
    return output;
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/blockchain', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(blocks));
});

io.on('connection', function(socket){

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
    let lastBlock = blocks[blocks.length - 1];

    /* validate block */

    /* validate sender id */
    if(block.data.sender.valueOf() == socket.id.valueOf())
      console.log("sender id matches");
    else
      console.log("sender id does not match");

    /* validate index */
    if(block.header.index == lastBlock.header.index + 1)
      console.log("index matches");
    else
      console.log("index does not match");

    /* validate hash */
    if(block.header.previousHash.valueOf() == lastBlock.hash.valueOf())
      console.log("previousHash matches");
    else
      console.log("previousHash does not match");

    /* JSON.parse(block); */
    console.log("on block: " + JSON.stringify(block));
    blocks.push(block);
    io.emit('new-block', block);

    difficulty++;
    io.emit('set-difficulty', difficulty);
  });

  socket.on('disconnect', function() {
    users = users.filter(function(el) { return el.id != socket.id; });
    io.emit('users', getPlainUsersArray(users));
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
