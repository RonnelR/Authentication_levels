//jshint esversion:6
require('dotenv').config()
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;



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






mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser:true }).then(()=>console.log("Connected to DataBase!!"))

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
}); 

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ username: profile.displayName,googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



app.use(passport.initialize());
app.use(passport.session());

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
   
User.find({secret: {$ne: null}}).then((result)=>{
  if(result){
  
    res.render("secrets",{secretz:result});
  }else{
    res.redirect("/")
  }


  
}).catch((err)=>{
  console.log(err);
})

})

app.get("/submit",function(req,res){

  if(req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("/")
  }
})

app.post("/submit",function(req,res){

  const submittedSecret = req.body.secret;
  const submittedId = req.user.id;

  User.findById(submittedId).then((foundItem)=>{
    if(foundItem){
      foundItem.secret=submittedSecret;
      foundItem.save().then(()=>{
        
          res.redirect("/secrets");
        
      })
    }else{
res.redirect("/")
    }
  })

  // User. findOneAndUpdate({_id:submittedId},{$set:{secret:submittedSecret}}).then( function(updated){
  // console.log("secrets inserted!!!");
  // }).catch((err)=>console.log(err));
  
  // // console.log(req.user.id);
  
  // res.redirect("/secrets")
})

app.get("/auth/google",
  passport.authenticate("google",{scope:['profile']})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.post("/register",function (req,res) {

  const password = req.body.password;
User.register({username:req.body.username}, password , function(err, user) {
  if (err) {
    console.log(err);
    res.send("The user is already exist !!")
   }else{
 passport.authenticate("local")(req,res,function(){
  res.redirect("/secrets");
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