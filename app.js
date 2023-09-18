//jshint esversion:6
require('dotenv').config()
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');



const app = express()

app.set(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));


app.use(session({
  secret: 'Hard to crack!!',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser:true }).then(()=>console.log("Connected to DataBase!!"))

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function (req,res) {
    res.render("home");
})

app.get("/login",function (req,res) {
    res.render("login");
})

app.get("/logout",function (req,res) {
  req.logOut(function (err) {
    console.log(err);
  })
  res.redirect("/")
})

app.get("/register",function (req,res) {
    res.render("register");
})

app.get("/secrets",function (req,res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
      } else {
        res.redirect('/');
      }
    
})

app.post("/register",function (req,res) {

  const password = req.body.password;
User.register({username:req.body.username}, password , function(err, user) {
  if (err) {
    console.log(err);
    res.send("The user is already exist !!")
   }else{
 passport.authenticate("local")(req,res,function(){
  res.redirect("/secrets")
 })

    };
});
});


app.post("/login",function (req,res) {

  const username = req.body.username;
  const password = req.body.password;

const user = new User({
  username: username,
  password: password
});

req.login(user, function (err) {
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets")
     })
    
  }
})

});

app.listen(3000,function(){
 console.log("The server is starting at Port 3000!!");
})