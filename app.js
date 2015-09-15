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




// fallback route
app.get("*", function(req,res){
	res.render("404");
});



//***** START SERVER *****
app.listen(3000, function(){
	console.log("Server starting on port: 3000");
});


