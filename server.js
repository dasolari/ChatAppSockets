// Set application
const express = require('express');
const app = express();
const server = require('http').Server(app);
const cors = require('cors');
const PORT = 8080;

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    headers: 'X-Requested-With,content-type',
    credentials: true
  },
  transports: ['polling']
});

// Cors
app.use(cors());

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = {};

// Socket connection code start
io.on('connection', (socket) => {
  socket.on('new-connection', (data) => {
    const { userName, chatRoomId }  = data;
    users[socket.id] = { chatRoomId, userName };
    socket.join(String(chatRoomId));
    socket.to(String(chatRoomId)).emit('user-joined', userName);
  });
  socket.on('send-chat-message', (data) => {
    const user = JSON.parse(data.user);
    const chatRoom = JSON.parse(data.chatRoom);
    socket.to(String(chatRoom.id)).emit('chat-message', { message: data.message, name: user.userName, userId: user.id });
  });
  socket.on('started-typing', (data) => {
    const { userName, chatRoomId } = data;
    socket.to(String(chatRoomId)).emit('user-is-typing', userName);
  });
  socket.on('finished-typing', (data) => {
    const { userName, chatRoomId } = data;
    socket.to(String(chatRoomId)).emit('user-stopped-typing', userName);
  });
  socket.on('ban-user', (data) => {
    const chatRoom = JSON.parse(data.chatRoom);
    socket.to(String(chatRoom.id)).emit('ban', data.userName);
  });
  socket.on('disconnect', function() {
    try {
      const userName = users[socket.id].userName;
      const chatRoomId = users[socket.id].chatRoomId;
      socket.to(chatRoomId).emit('user-left', userName);
      delete users[socket.id];
    } catch (error) {
      // Do nothing jeje
    }
  });
});

// Run server
server.listen(PORT, () => console.log(`Socket server started on port ${PORT}`));
