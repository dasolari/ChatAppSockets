// Set application
const express = require('express');
const app = express();
const server = require('http').Server(app);
const cors = require('cors');
const PORT = 8080;

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://nuestrochatg8.ml.s3-website-us-east-1.amazonaws.com/',
    methods: ['GET', 'POST'],
    headers: 'X-Requested-With,content-type',
    credentials: true
  },
  transports: ['websocket']
});

// Cors
app.use(cors());

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = {};
  
// Run server
server.listen(PORT, () => console.log(`Socket server started on port ${PORT}`));

// Socket connection code start
io.on('connection', (socket) => {
  socket.on('new-connection', (data) => {
    const { userName, chatRoomId }  = data;
    users[socket.id] = { chatRoomId, userName };
    socket.join(chatRoomId);
    socket.to(chatRoomId).emit('user-joined', userName);
  });
  socket.on('send-chat-message', (data) => {
    const user = JSON.parse(data.user);
    const chatRoom = JSON.parse(data.chatRoom);
    socket.to(chatRoom.id).emit('chat-message', { message: data.message, name: user.userName, userId: user.userId });
  });
  socket.on('started-typing', (data) => {
    const { userName, chatRoomId }  = data;
    socket.to(chatRoomId).emit('user-is-typing', userName);
  });
  socket.on('finished-typing', (data) => {
    const { userName, chatRoomId }  = data;
    socket.to(chatRoomId).emit('user-stopped-typing', userName);
  });
  socket.on('ban-user', (data) => {
    const chatRoom = JSON.parse(data.chatRoom);
    socket.to(chatRoom.id).emit('ban', data.userName);
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
