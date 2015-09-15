//***** REQUIRE NODE MODULES *****

// express - lets us use dynamic data within our views
var express = require("express");
var app = express();

// bring in our models for database use
var db = require("./models");

// request - lets us make HTTP requests to APIs
var request = require("request");
// morgan - lets us log HTTP requests in terminal
var morgan = require("morgan");

// method-override - lets us override the post action on form submissions
// var methodOverride = require("method-override");

// body-parser - lets us collect the data out of the body of an HTML page on form submissions
// var bodyParser = require("body-parser");



//***** SET MIDDLEWARE *****
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(morgan("tiny")); // less text in our logs??
// app.use(bodyParser.urlencoded({extended:true}));
// app.use(methodOverride("_method"));




//***** ROUTES *****

// ROOT
app.get("/", function(req, res){
	res.redirect("/index");
});


// var accessToken = "CAACEdEose0cBAKHuVw9M5ix6Cjb51eOuMHiDgUvCHF929NfX2Cvt62UF5pnZBgmUq32w7InnwP2sxPlmhs0sFUeNgAPl4xgfohDsFEaIv9y0pn4sPP77CD1vZAIXLVUxWjB9Jfe9zizhpIeD6RV9JIM8OGwyaSPMMTdSYM38lShQjToycpqf9IKZCmqHrpOP0uq3MTfFm3wSMgzZAj8F";

// testing...
app.get('/index', function(req, res){

	var fbData = "hello from app.js fbData pretend";
	res.render("users/index", {fbData:fbData});

});


app.get('/test', function(req, res){
	res.render("users/test");
});




// fallback route
app.get("*", function(req,res){
	res.render("errors/404");
});




//***** START SERVER *****
app.listen(3000, function(){
	console.log("Server starting on port: 3000");
});


