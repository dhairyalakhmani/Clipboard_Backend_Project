const WebSocket = require('ws');
const Room = require('../models/Room.js');

const handleSocketConnection = (ws , wss) => {
    console.log('Device Connected!');

    ws.on('message' , async(message) => { 
        try{
            const data = JSON.parse(message);

            if(data.type === 'join_room') {

                if(!data.roomName || typeOf (data.roomName) !== "string" || data.roomName.length > 50){
                    return ws.send(JSON.stringify({
                        type : 'error',
                        message : 'Please enter a valid room name.'
                    }));
                }
                ws.room = data.roomName;

                let room = await Room.findOne({name : data.roomName});
                if(!room){
                    room = await Room.create({name : data.roomName , clips : [] });
                }
                const latestClips = room.clips.slice(-10).reverse();
                ws.send(JSON.stringify({type : 'initial_clips' , clips : latestClips }))
            }

            if(data.type == 'send_clip'){
                if (!data.text || typeof data.text !== 'string' || data.text.length > 5000) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'Clip is empty or exceeds 5000 characters.' }));
                }
                if (!data.deviceId) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'Device ID is required.' }));
                }
                const newClip = {text : data.text , deviceId : data.deviceId};
                const room = await Room.findOneAndUpdate(
                    {name : ws.room},
                    {$push : { clips : newClip}},
                    {new : true}
                );
                const savedClip = room.clips[room.clips.length - 1];
                wss.clients.forEach(client => {
                    if(client.readyState === WebSocket.OPEN && client.room === ws.room){
                        client.send(JSON.stringify({type: 'receive_clip', clip: savedClip}))
                    }
                });
            }

            if(data.type === 'fetch_older_clips'){
                if (typeof data.skip !== 'number' || data.skip < 0) {
                    return ws.send(JSON.stringify({ type: 'error', message: 'Invalid pagination data.' }));
                }
                const room = await Room.findOne({name : ws.room});
                if(room){
                    const olderClips = [...room.clips].reverse().slice(data.skip , data.skip + 10);
                    ws.send(JSON.stringify({type : 'older_clips' , clips : olderClips}));
                }
            }

            if(data.type === 'leave_room'){
                ws.room = null;
            }
        }

        catch(error){
            console.error('Server/DB error caught: ' , error.message);
            ws.send(JSON.stringify({
                type : error,
                message : 'Something went wrong on the server. Please try again!'
            }))
        }
    })
}

module.exports = handleSocketConnection;