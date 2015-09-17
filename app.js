//***** REQUIRE NODE MODULES *****

// express - lets us use dynamic data within our views
var express = require("express");
var app = express();

// bring in our models & database
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





// pg module - lets us talk to our postgres database
var pg = require("pg");

// tell it where our database is
var connectionString = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";



// I need to make routes that send out the data I need as json
// that connect to my database and return data on ajax requests from the client side

// also with angular i'll be using http-service directive or whatever


//***** ROUTES *****

// ROOT ROUTE
app.get("/", function(req, res){
	res.redirect("/index");
});


// INDEX PAGE
// not sure if I want to send data via fbData or someData ???
app.get('/index', function(req, res){
	res.format({
		// if the request to this route is an html type, render the page
		'text/html': function(){
			// for now, let's make a request to our database to grab the photo_urls
			pg.connect(databaseConnectionLocation, function(err, client, done){
				if(err){
					return console.error("error connecting to database in /index route", err);
				}
				client.query("SELECT * FROM test_photos", function(err, result){
					done();
					if(err){
						return console.error("error finding table test_photos, in /index route", err);
					}
					// console.log("result!!! is... ", result.rows);
					var photoArray = [];
					for (var i = 0; i < result.rows.length; i++){
						photoArray.push(result.rows[i].photo_url);
					}
					console.log("array...", photoArray);
					res.render("users/index", {photoArray:photoArray});
				});
			});

		},
		// if the request to this route is an ajax request, send the data as type json 
		'application/json': function(){
			res.send(someData);
		},
		// if other type of request, send an error status message
		'default': function(){
			res.status(406).send("Not Acceptable data type request");
		}
	});
});



// FALLBACK ROUTE
app.get("*", function(req,res){
	res.render("errors/404");
});




//***** START SERVER *****
app.listen(process.env.PORT || 3000, function(){
	console.log("Server starting on port: 3000");
});


