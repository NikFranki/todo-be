const socketIO = require('socket.io');

const server = require('./index');

const allowedOrigins = ['http://localhost:3366', 'http://franki.com', 'http://franki.com:3366'];
const io = socketIO(
  server,
  {
    cors: {
      origin: allowedOrigins,
    }
  }
);

module.exports = io;
