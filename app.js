const express = require("express");
const md5 = require("md5");
const app = express();
var MongoClient = require("mongodb").MongoClient;
var url = require("url");
var urldb = "mongodb://localhost:27017/mydb";
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require('lodash')

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("templates"));


app.use(session({
    
    secret: "Our little Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(urldb, { useNewUrlParser: true }, { useUnifiedTopology: true }).then(() => {
    console.log("Connected successfully");
}).catch((err) => {
    console.log(err);
});



const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    city: String,
    phone: String,
    age: Number,
    bloodType: String,
    availability: String
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const querySchema = new mongoose.Schema({
    name: String,
    email: String,
    query: String
});

const Query = new mongoose.model("Query",querySchema);

app.get("/", (req, res) => {

    if(req.isAuthenticated()){

        var initials = _.split(req.user.name,' ');

        if(initials.length > 1){
            initials = initials[0][0] + initials[1][0];
        }else{
            initials = initials[0][0];
        }

        res.render("home",{loggedIn:true, userData: req.user,initials:initials});
    }else{
        
        res.render("home",{loggedIn:false});
    }
    
});

app.post("/register", function(req, res) {


    User.register({
            username:req.body.username, 
            name:req.body.name, 
            city: req.body.city,
            phone: req.body.phone,
            bloodType: req.body.bloodType,
            age: req.body.age,
            availability: "Available"
        },req.body.password,function(err,user){
        
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{

            passport.authenticate('local')(req,res,function(){
                //console.log("Authenticated");
                res.redirect("/");
            });
        }
    });
    
})

app.get("/edit",function(req,res){

    if(req.isAuthenticated()){

        res.render("edit",{userData: req.user});
    }else{
        
        res.redirect("/loginPage/false");
    }
});

app.get("/loginPage/:wrgCred",(req,res)=>{
    
    res.render("login.ejs",{wrgCred:req.params.wrgCred});
})

app.post("/login",function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){

        if(err){
            console.log(err);
        }else{
            
            passport.authenticate("local", { failureRedirect: '/loginPage/true', failureMessage: true })(req,res,function(){
                res.redirect("/");
            });
            //res.redirect("/loginPage/true");
        }
    })
    
});

app.post("/edit",function(req,res){

    if(req.isAuthenticated()){

        User.updateOne({username:req.user.username},{
            name:req.body.name, 
            city: req.body.city,
            phone: req.body.phone,
            bloodType: req.body.bloodType,
            age: req.body.age,
            availability: req.body.availability
        },function(err,result){
            
            
            if(err){
                console.log(err);
            }else{
                res.redirect("/");
            }
        })
        
    }else{
        
        res.redirect("/loginPage/false");
    }
    
});

app.get("/logout",(req,res)=>{

    req.logout();
    res.redirect("/");
})



app.get("/search",(req,res)=>{
    res.render("search",{values:""});
})


app.post("/search", (req, res) => {
        
                
    User.find({bloodType:req.body.bloodType , city: req.body.city},function(err,result){

        if(err){
            console.log(err);
        }else{

            res.render("search", { values: result });
           
        }

    })

   
});

app.post("/query",function(req,res){

    const newQuery = new Query({
        name: req.body.name,
        email: req.body.email,
        query: req.body.query
    });

    newQuery.save(function(err,result){

        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    })
})

app.listen(3000, () => console.log("Server Started"));