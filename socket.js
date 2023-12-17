const socketIO = require('socket.io');

const server = require('./index');

const allowedOrigins = ['http://localhost:3366', 'https://todo-fe-six.vercel.app'];
const io = socketIO(
  server,
  {
    cors: {
      origin: allowedOrigins,
    }
  }
);

module.exports = io;
