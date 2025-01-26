import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

// tell Express to use Pug as the template engine for rendering .pug files
app.set('view engine', 'pug');
// specify the directory where .pug templates are stored
app.set("views", __dirname + "/views");
// map requests to /public in the URL to the public folder in your file system
app.use("/public", express.static(__dirname + "/public"));
// create a route handler to render home.pug
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const handleListen = () => console.log("Listening on http://localhost:3000");
// app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];
wss.on("connection", (socket) => {
    // save each browser that connects to this server in an array 
    sockets.push(socket); 
    socket["nickname"] = "Anonymous";

    console.log("Connected to Browser");
    socket.on("close", () => console.log("Disconnected from the Browser"));

    socket.on("message", (message) => { // send a msg to all browsers connected
        const parsed = JSON.parse(message); // turn the stringified message back into JSON object
        console.log(parsed);

        if (parsed.type == "new_message") { // if received an actual message in the JSON object, broadcast it to all connected sockets
            sockets.forEach((aSocket) => 
                aSocket.send(`${socket.nickname}: ${parsed.payload.toString('utf8')}`)
            );
        } else if (parsed.type == "nickname") { // if received a nickname in the JSON object, just save it in the currently connected socket object (the browser from which this nickname message was sent)
            socket["nickname"] = parsed.payload.toString('utf8');
        }
        
    });
});

server.listen(3000, handleListen);