const ws = new WebSocket('ws://localhost:3000');
let currentRoom = '';
let clipsLoaded = 0;

function getDeviceId() { 
    let id = localStorage.getItem('deviceId');
    if(!id){
        id = 'device-' + Math.random().toString(36).substring(2 , 4).toUpperCase();
        localStorage.setItem('deviceId' , id);
    }
    return id;
}

const myDeviceId = getDeviceId();
console.log(`My device ID : ${myDeviceId}`);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if(data.type === 'initial_clips'){
        data.clips.forEach(clip => displayClip(clip , false));
        clipsLoaded = data.clips.length;
    }

    if(data.type === 'receive_clip'){
        displayClip(data.clip , true);
        clipsLoaded++;
    }

    if(data.type === 'older_clips'){
        if(data.clips.length === 0){
            alert('No other clips found.');
            return;
        }
        data.clips.forEach(clip => displayClip(clip , false));
        clipsLoaded += data.clips.length;
    }

    if(data.type === 'error'){
        alert(data.message);
    }
};

function joinRoom() {
    const roomNameContainer = document.getElementById('room-input');
    const roomName = roomNameContainer.value;
    if(!roomName){
        alert('Enter a valid Room Name!');
        return;
    }
    currentRoom = roomName;
    ws.send(JSON.stringify({
        roomName : roomName,
        type : 'join_room'
    }));

    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'block';
    document.getElementById('room-title').textContent = roomName;
    document.getElementById('clips-container').innerHTML = ''; 
    clipsLoaded = 0;
}

function sendClip() {
    const textArea = document.getElementById('clip-input');
    const text = textArea.value;
    if(!text){
        return;
    }
    ws.send(JSON.stringify({
        text : text,
        type : 'send_clip',
        deviceId : myDeviceId
    }))
    textArea.value = '';
}

function fetchOlderClips(){
    ws.send(JSON.stringify({
        type : 'fetch_older_clips',
        skip : clipsLoaded
    }))
}

function leaveRoom() {
    ws.send(JSON.stringify({
        type : 'leave_room',
    }))
    currentRoom = '';
    document.getElementById('join-screen').style.display = 'block';
    document.getElementById('room-screen').style.display = 'none';
    document.getElementById('clip-input').value = '';
}

function displayClip(clip , prepend = true){
    let clipContainer = document.getElementById('clips-container');
    let clipDiv = document.createElement('div');
    clipDiv.className = 'clip-box';

    const date = new Date(clip.timestamp).toLocaleTimeString();

    clipDiv.innerHTML = `
    <span class="device-badge">${clip.deviceId}</span>
    <span class="timestamp">${date}</span>
    <p style="margin-top: 10px; word-wrap: break-word;">${clip.text}</p>
    `;

    if(prepend){
        clipContainer.prepend(clipDiv);
    }
    else{
        clipContainer.append(clipDiv);
    }
}