
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nicknameForm = document.querySelector("#nickname");

// establish a connection to the server
const socket = new WebSocket(`ws://${window.location.host}`);

// make a JSON object then stringify it to send to backend
function makeMessage(type, payload) {
    const msg = { type, payload };
    return JSON.stringify(msg);
}

// receive messages from the server
socket.addEventListener("open", () => {
    console.log("Connected to Server");
});

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener("close", () => {
    console.log("Disconnected from the Server");
});


function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value)); 
    
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
    input.value = ""; // empty the input field
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nicknameForm.addEventListener("submit", handleNicknameSubmit);