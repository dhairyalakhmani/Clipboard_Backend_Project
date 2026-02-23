require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db.js');
const handleSocketConnection = require('./controllers/socketController.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

connectDB();

app.use(express.json());

wss.on('connection' , (ws) => {
    handleSocketConnection(ws , wss);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT , () => { 
    console.log(`Server listening on http://localhost:${PORT}`)
});