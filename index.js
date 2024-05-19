const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const ngrok = require('ngrok')
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FormDataModel = require ('./models/FormData');

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(express.json());
app.use(cors());
dotenv.config();
const URL = process.env.MONGOURL;
const PORT = process.env.PORT || 8000;
// mongoose.connect('mongodb://127.0.0.1:27017/practice_mern');
// mongoose.connect('mongodb://127.0.0.1:27017/vid');
mongoose.connect(URL)
  .then(() => {
    console.log('DB connected');
  })
  .catch((error) => {
    console.log('DB connection error', error);
  });


// const PORT = 5001
app.post('/register', (req, res)=>{

    const {email, password} = req.body;
    FormDataModel.findOne({email: email})
    .then(user => {
        if(user){
            res.json("Already registered")
        }
        else{
            FormDataModel.create(req.body)
            .then(log_reg_form => res.json(log_reg_form))
            .catch(err => res.json(err))
        }
    })
    
})

app.post('/login', (req, res)=>{
    const {email, password} = req.body;
    FormDataModel.findOne({email: email})
    .then(user => {
        if(user){
            if(user.password === password) {
                res.json("Success");
            }
            else{
                res.json("Wrong password");
            }
        }
        else{
            res.json("No records found! ");
        }
    })
})

app.get('/app', (req, res) => {
	res.send('Running');
});

io.on("connection", (socket) => {
	socket.emit("me", socket.id);

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
app.listen(3001, () => {
    console.log('Server listining on 3001');

});

ngrok.connect(PORT).then(ngrokUrl=>{
    console.log(`Ngrok tunnel in: ${ngrokUrl}`);
}).catch(error=>{
    console.log(`Ngrok tunnel error: ${error}`);
})

