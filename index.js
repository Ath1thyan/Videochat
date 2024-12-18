const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const ngrok = require('ngrok');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FormDataModel = require('./models/FormData');

// Add the URL for CORS
const allowedOrigins = ["https://ablelyf-video.netlify.app"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

const io = require("socket.io")(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://ablelyf-video.netlify.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});


app.use(express.json());
app.use(cors({
    origin: allowedOrigins, // Ensure the middleware matches the CORS setup
    credentials: true
}));

dotenv.config();
const URL = process.env.MONGOURL;
const PORT = process.env.PORT || 8000;

mongoose.connect(URL)
    .then(() => {
        console.log('DB connected');
    })
    .catch((error) => {
        console.log('DB connection error', error);
    });

app.get('/app', (req, res) => {
    res.send('Running');
});

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
app.listen(3001, () => {
    console.log('Server listening on 3001');
});

// Uncomment this section if ngrok is needed
// ngrok.connect(3002).then(ngrokUrl => {
//     console.log(`Ngrok tunnel in: ${ngrokUrl}`);
// }).catch(error => {
//     console.log(`Ngrok tunnel error: ${error}`);
// });
