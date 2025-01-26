const socket = io(); // automatically tries to connect to the server that serves the page

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true; // hide the room until the user enters the room
let roomName = "";

// SEND MESSAGE TO THE ROOM

// Show messages in a list format (ul of li's)
function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

// EVENT HANDLER: upon user pressing "Submit" on message
function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

// EVENT HANDLER: upon user pressing "Save" on nickname
function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

// Once user submits a room name, enter the room:
// hide the welcome screen and show the room screen with nickname + message input form
function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    // make a new heading with room name as title
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    // make 2 new forms for message and nickname input
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    // add EVENT LISTENERS for the 2 forms
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

// EVENT HANDLER: upon user pressing "Enter" on room name
function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", { payload: input.value }, showRoom);
    roomName = input.value;
    input.value = "";
}
form.addEventListener("submit", handleRoomSubmit);

// RECEIVE MESSAGES FROM THE BACKEND
// For "welcome" event: send "x joined!" message to everyone in the room 
socket.on("welcome", (user) => {
    addMessage(user, " joined!");
});

// For "bye" event: send "x left..." message to everyone in the room 
socket.on("bye", (user) => {
    addMessage(user, " left...");
});

socket.on("new_message", addMessage); // when a new message is received, add it to the room

// Show list of open rooms
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = ""; // always clear the list before adding new rooms

    if (rooms.length === 0) {
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.appendChild(li);
    });
})