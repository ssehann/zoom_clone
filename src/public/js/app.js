const socket = io();

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
// at first, the call screen is hidden and only show welcome screen
call.hidden = true;

// Video Call Code (w/ MediaStream API)
const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

//default state is unmuted + camera on
let myStream;
let muted = false;
let cameraOff = false;
let roomName = "";
let myPeerConnection;

async function getCameras() {
    try {
        // Get a list of devices and only return the ones that are videoinput
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => (device.kind === "videoinput"));
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            // Create an option element for each camera
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            // If the current camera is the same as the camera in this loop, set it as selected
            if (currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user" }
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } }
    }

    try {
        // Prompt the user for permission to access mic and cam
        // If deviceId is provided, use the camera with that deviceId
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints 
        );
        // If granted, it returns a MediaStream object, which is linked to myFace
        // This allows the video element to display the stream in real-time
        myFace.srcObject = myStream;
        
        if (!deviceId) {
            await getCameras();
        }

        console.log(myStream);
    } catch(e) {
        // If the user denies permission, an error will be thrown
        console.log(e);
    }
}

function handleMuteClick() {
    // Get list of audio tracks from the stream and set to opposite its curr state
    myStream.getAudioTracks().forEach((track) => {track.enabled = !track.enabled});

    // Keep track of the mute state
    if (!muted) {
        // If you're not muted, clicking the button will mute you
        muted = true;
        muteButton.innerText = "Unmute"; 
    } else {
        muted = false;
        muteButton.innerText = "Mute";
    }
}

function handleCameraClick() {
    // Get list of video tracks from the stream and set to opposite its curr state
    myStream.getVideoTracks().forEach((track) => {track.enabled = !track.enabled});
    
    // Keep track of the camera state
    if (cameraOff) {
        // If cam off, clicking the button will 
        cameraOff = false; // turn on camera
        cameraButton.innerText = "Turn Camera Off"; // you can turn it back off
    } else {
        cameraOff = true;
        cameraButton.innerText = "Turn Camera On"; 
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
}

muteButton.addEventListener("click", handleMuteClick);
cameraButton.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome Form (join room)
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();

    socket.emit("join_room", input.value); 
    roomName = input.value; // save the name of the room
    input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

// Browser A (local offer) -> Server (event "offer")
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    // this is description of the browser for the other peers to connect
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
    // tell server offer and room name so it can send info to the other peer
});

// -> Browser B (remote offer, local answer) -> Server (event "answer")
socket.on("offer", async (offer) => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

// -> Browser A (remote answer)
socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}