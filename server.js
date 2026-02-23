require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db.js');
const handleSocketConnection = require('./controllers/socketController.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection' , (ws) => {
    handleSocketConnection(ws , wss);
});

const interval = setInterval(() => {
    const now = Date.now();
    wss.clients.forEach(ws => {
        if(now - ws.lastSeen > 90000){
            console.log('Terminating dead connection due to inactivity...');
            return ws.terminate();
        }
    })
}, 120000)

wss.on('close' , () => {
    clearInterval(interval);
})

const PORT = process.env.PORT || 3000;

server.listen(PORT , () => { 
    console.log(`Server listening on http://localhost:${PORT}`)
});