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
app.get("/index", function(req, res){
	res.render("users/index");
});

// Facebook login button page
// not sure if I want to send data via fbData or someData ???
// not sure if I need all three send type options?
app.get('/indexFacebook', function(req, res){
	res.format({
		// if the request to this route is an html type, render the page
		'text/html': function(){
			res.render("users/indexFacebook");
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


// facebookLogin post route
app.post("/facebookLogin", function(req, res){
	// need to give the client side a response code or else it hangs and errors out
	res.status(200).send("data received successfully");

	// need bodyParser module to interpret the data
	console.log("this is from the ajax request - req.body - ", req.body);
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
			var fb_photo_album = currentPhotoObject.fb_photo_album; // these may not always exist??
			var fb_photo_url_full_size = currentPhotoObject.fb_photo_url_full_size;
			var fb_photo_thumbnail = currentPhotoObject.fb_photo_thumbnail;
			var fb_photo_place = currentPhotoObject.fb_photo_place; // these may not always exist
			var fb_photo_tags = currentPhotoObject.fb_photo_tags; // these may not always exist

// **** TO FIX ***
// only save if does not yet exist
// change before production
	// find value, then if it exists, update
	// else, insert new item

			client.query("INSERT INTO facebook_photos (facebook_user_id, fb_photo_id, " + 
					"fb_created_time, fb_photo_album, fb_photo_url_full_size, " +
					"fb_photo_thumbnail, fb_photo_place, fb_photo_tags) " +
					"VALUES ('" + facebook_user_id + "', '" + fb_photo_id + "', '" +
					fb_created_time + "', '" + fb_photo_album + "', '"+ 
					fb_photo_url_full_size + "', '" + fb_photo_thumbnail + "', '" + 
					fb_photo_place + "', '" + fb_photo_tags + "')", 
						function(err, result){
							done();
							if(err){
								return console.error("error inserting into table facebook_photos", err);
							}
			}); // close client.query
		} // close for loop
		console.log("successfully saved fb data to facebook_photos table");
	}); // close pg.connect
});



// facebookLanding page - photo stream
app.get('/facebookLanding', function(req, res){
	res.format({
		// if the request to this route is an html type, render the page
		'text/html': function(){
			// make a request to our database to grab the photo_urls

// **** TO FIX ***
// hard coding user id - fix to do this dynamically later

			pg.connect(databaseConnectionLocation, function(err, client, done){
				if(err){
					return console.error("error connecting to database in /facebookLanding route", err);
				}
				client.query("SELECT * FROM facebook_photos WHERE facebook_user_id = '10153659612406060'", function(err, result){
					done();
					if(err){
						return console.error("error finding table test_photos, in /index route", err);
					}
					// console.log("result is... ", result.rows);
					var photoThumbsArray = [];
					for (var i = 0; i < result.rows.length; i++){

// **** TO FIX ***
// change this to get ALL the image data, then do what I want with it on the view

						photoThumbsArray.push(result.rows[i].fb_photo_thumbnail);
					}
					console.log("array...", photoThumbsArray);
					console.log("number of items in array: ", photoThumbsArray.length);
					res.render("users/facebookLanding", {photoThumbsArray:photoThumbsArray});
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








// Instagram login button page
app.get('/indexInstagram', function(req, res){
	res.render("users/indexInstagram");
});


app.get('/login/instagram', function(req, res) {
	// ask instagram for authorization
	res.redirect("https://api.instagram.com/oauth/authorize/?client_id=" + 
		INSTAGRAM_CLIENT_ID + "&redirect_uri=" + INSTAGRAM_REDIRECT_URI + "&response_type=code&scope=basic");
});


// ON RETURN, GET ALL THE DATA FROM THE API AND STORE IT IN MY DATABASES

app.get('/instagramLanding', function(req, res) {
	res.render("users/instagramLanding");
});	



//_______ERRORS_______

// 500 page
app.get("/500", function(req, res){
	console.log("in the /errors/500 - oopsie route");
	res.render("errors/500");
});

// FALLBACK ROUTE
app.get("*", function(req, res){
	res.render("errors/404");
});



//***** START SERVER *****
app.listen(process.env.PORT || 3000, function(){
	console.log("Server starting on port: 3000");
});


