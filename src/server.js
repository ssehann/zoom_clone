import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set('view engine', 'pug');
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
const wsServer = SocketIO(server);

function publicRooms() {
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;
    const {
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
    
}

wsServer.on("connection", socket => {
    socket["nickname"] = "Anonymous";
    socket.on("enter_room", (roomName, done) => {
        // join a room
        socket.join(roomName);
        done();

        // send an event called "welcome" to everyone in the room,
        // except yourself (the user that just joined)
        socket.to(roomName).emit("welcome", socket.nickname);
        
        // send an event called "room_change" to everyone in all rooms (all sockets)
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname));
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    }); 

    socket.on("nickname", (nickname) => (socket["nickname"] = nickname) );
});

server.listen(3000, handleListen);