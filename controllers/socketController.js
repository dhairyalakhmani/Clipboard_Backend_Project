const WebSocket = require('ws');
const Room = require('../models/Room.js');

const handleSocketConnection = (ws , wss) => {
    console.log('Device Connected!');

    ws.on('message' , async(message) => { 
        try{
            const data = JSON.parse(message);

            if(data.type === 'join_room') {
                ws.room = data.roomName;

                let room = await Room.findOne({name : data.roomName});
                if(!room){
                    room = await Room.create({name : data.roomName , clips : [] });
                }
                const latestClips = room.clips.slice(-10).reverse();
                ws.send(JSON.stringify({type : 'initial_clips' , clips : latestClips }))
            }

            if(data.type == 'send_clip'){
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