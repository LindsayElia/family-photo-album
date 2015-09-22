//***** REQUIRE NODE MODULES & SET MIDDLEWARE *****

// express - lets us use dynamic data within our views
var express = require("express");
var app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// bring in our models & database
var db = require("./models");

// request - lets us make HTTP requests / get & post data
// it goes inside of route block of code
var request = require("request");

// morgan - lets us log HTTP requests in terminal
var morgan = require("morgan");
app.use(morgan("tiny")); // less text in our logs??

// method-override - lets us override the post action on form submissions
var methodOverride = require("method-override");
app.use(methodOverride("_method"));

// body-parser - lets us collect the data out of the body of an HTML page on form submissions
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));






// pg module - lets us talk to our postgres database
var pg = require("pg");

// tell it where our database is
var databaseConnectionLocation = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";



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
					// console.log("array...", photoArray);
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


// facebookLogin route
app.post("/facebookLogin", function(req, res){
	// need to give the client side a response code or else it hangs and errors out
	res.status(200).send("data received successfully");

	// need bodyParser module to interpret the data
	// console.log("this is from the ajax request - req.body - ", req);
	// unpack JSON so that it's a JavaScript ojbect & array format, rather than a string
	var fbDataReceived = JSON.parse(req.body.data);
	// console.log(fbDataReceived[0]);

	// save the data to my database
	pg.connect(databaseConnectionLocation, function(err, client, done){

		if(err){
			return console.error("error connecting to database, from inside of post /facebookLogin route", err);
		}

		for (var i = 0; i < fbDataReceived.length; i++){
			var currentPhotoObject = fbDataReceived[i];
			var facebook_user_id = currentPhotoObject.fb_user_id;
			var fb_photo_id = currentPhotoObject.fb_photo_id;
			var fb_created_time = currentPhotoObject.fb_photo_created_time;
			var fb_photo_url_full_size = currentPhotoObject.fb_photo_url_full_size;
			var fb_photo_thumbnail = currentPhotoObject.fb_photo_thumbnail;
			var fb_photo_place = currentPhotoObject.fb_photo_place;
			var fb_photo_tags = currentPhotoObject.fb_photo_tags;

			client.query("INSERT INTO facebook_photos (facebook_user_id, fb_photo_id, " + 
					"fb_created_time, fb_photo_url_full_size, fb_photo_thumbnail, " + 
					"fb_photo_place, fb_photo_tags) " +
					"VALUES ('" + facebook_user_id + "', '" + fb_photo_id + "', '" +
					fb_created_time + "', '" + fb_photo_url_full_size + "', '" + 
					fb_photo_thumbnail + "', '" + fb_photo_place + "', '" +
					fb_photo_tags + "')", 
				function(err, result){
					done();
					if(err){
						return console.error("error inserting into table facebook_photos", err);
					}
			}); // close client.query
		} // close for loop
		console.log("successfully saved fb data to facebook_photos table");
	}); // close pg.connect


	// these may not always exist, so make it conditional
	// fb_photo_place
	// fb_photo_tags


	// redirect to ? page, now showing new photos
	// getting error 'can't set headers after they are sent, in terminal console
	// res.render("users/facebookLanding");
});


// FALLBACK ROUTE
app.get("*", function(req,res){
	res.render("errors/404");
});




//***** START SERVER *****
app.listen(process.env.PORT || 3000, function(){
	console.log("Server starting on port: 3000");
});


