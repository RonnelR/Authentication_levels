//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express()

app.set(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser:true }).then(()=>console.log("Connected to DataBase!!"))

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


const User = new mongoose.model("User",userSchema);

app.get("/",function (req,res) {
    res.render("home");
})

app.get("/login",function (req,res) {
    res.render("login");
})

app.get("/register",function (req,res) {
    res.render("register");
})

app.get("/submit",function (req,res) {
    res.render("submit");
})


app.post("/register",function (req,res) {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newRegister = new User({
            email:req.body.username,
            password:hash
        });
        newRegister.save().then(()=> {
            res.render("secrets")
            console.log("New user is created!!")
    })
    });

});

app.post("/login",function (req,res) {

    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({email:userName}).catch((err)=>console.log(err))
    .then((result)=>
    { 
        bcrypt.compare(password, result.password, function(err, result) {


            if (result === true){
                res.render("secrets")
            }else{
                res.render("home")
            }
            
         }) 
    })
});

app.listen(3000,function(){
 console.log("The server is starting at Port 3000!!");
})