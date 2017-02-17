const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current directory
// (in this case the same folder as the server js file)
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);

// object to hold all of our connected users
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
        // add a user object
    socket.name = data.name;
    users[socket.name] = socket.name;

        // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('memeHouse');

        // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('memeHouse').emit('msg', response);

    console.log(`${data.name} joined`);
        // success message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;


  socket.on('diceroll', () => {
    const roll = Math.random() * 6;
    io.sockets.in('memeHouse').emit('msg', { name: 'server', msg: `${socket.name} rolled a ${roll}` });
  });

  socket.on('msgToServer', (data) => {
    io.sockets.in('memeHouse').emit('msg', { name: socket.name, msg: data.msg + data.catchphrase, color: data.color });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

    // remove a user from the user object
  socket.on('disconnect', () => {
        // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${socket.name} has left the room.`,
    };

    socket.broadcast.to('memeHouse').emit('msg', response);
    console.log(`${socket.name} left`);
    socket.leave('memeHouse');

    delete users[socket.name];
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');

