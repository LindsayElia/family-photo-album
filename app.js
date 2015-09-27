// ____________REQUIRE NODE MODULES & SET MIDDLEWARE____________

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

// dotenv - lets us use SECRET global variables
require('dotenv').load();



// pg module - lets us talk to our postgres database
var pg = require("pg");

// tell it where our database is
var databaseConnectionLocation = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";



// I need to make routes that send out the data I need as json
// that connect to my database and return data on ajax requests from the client side

// also with angular i'll be using http-service directive or whatever


// ____________ROUTES____________

// ROOT ROUTE
app.get("/", function(req, res){
	res.redirect("/index");
});

// INDEX PAGE
app.get("/index", function(req, res){
	res.render("users/index");
});





// ____________FACEBOOK____________


// displays a page with the facebook authorization via a FB login button
// TO FIX: not sure if I need all three send type options?
app.get('/authorize/facebook', function(req, res){
	res.format({
		// if the request to this route is an html type, render the page
		'text/html': function(){
			res.render("users/authFacebook");
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


// posts data to the landing page for facebook after authorization/login
// from a button on the /authorize/facebook page
// receives data from the client side js facebook file after authorizing user & retrieving data from FB API
// saves data to my database
app.post("/landing/facebook", function(req, res){
	// need to give the client side a response code or else it hangs and errors out
	res.status(200).send("data received successfully");

	// need bodyParser module to interpret the data
	// console.log("this is from the ajax request - req.body - ", req.body);
	// unpack JSON so that it's a JavaScript ojbect & array format, rather than a string
	var fbDataReceived = JSON.parse(req.body.data);
	// console.log(fbDataReceived[0]);

	// save the data to my database
	pg.connect(databaseConnectionLocation, function(err, client, done){

		if(err){
			return console.error("error connecting to database, from inside of post /facebookLogin route", err);
		}

		// format the data received from client side
		for (var i = 0; i < fbDataReceived.length; i++){
			var currentPhotoObject = fbDataReceived[i];
			var facebook_user_id = currentPhotoObject.fb_user_id;
			var fb_photo_id = currentPhotoObject.fb_photo_id;
			var fb_photo_created_time = currentPhotoObject.fb_photo_created_time;
			// the following pieces are not simple text strings, they are objects or arrays,
			// so we need to convert to JSON in order to save in our db as a string
			// except thumbnail, that's already just a string of the url
			var fb_photo_album = JSON.stringify(currentPhotoObject.fb_photo_album); // these may not always exist??
			var fb_photo_url_full_size = JSON.stringify(currentPhotoObject.fb_photo_url_full_size);
			var fb_photo_thumbnail = currentPhotoObject.fb_photo_thumbnail;
			var fb_photo_place = JSON.stringify(currentPhotoObject.fb_photo_place); // these may not always exist
			var fb_photo_tags = JSON.stringify(currentPhotoObject.fb_photo_tags); // these may not always exist

// **** TO FIX ***
// only save if does not yet exist
// change before production
	// find value, then if it exists, update
	// else, insert new item

			// add data to db
			client.query("INSERT INTO facebook_photos (facebook_user_id, fb_photo_id, " + 
					"fb_photo_created_time, fb_photo_album, fb_photo_url_full_size, " +
					"fb_photo_thumbnail, fb_photo_place, fb_photo_tags) " +
					"VALUES ('" + facebook_user_id + "', '" + fb_photo_id + "', '" +
					fb_photo_created_time + "', '" + fb_photo_album + "', '"+ 
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



// displays a page showing fb photo stream
// connects to database and finds all fb photos
// renders the users/landingFacebook page
app.get('/landing/facebook', function(req, res){
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
						return console.error("error SELECTing table facebook_photos, in /landing/facebook route", err);
					}
					// console.log("result is... ", result.rows);
					var fbPhotoThumbsArray = [];
					for (var i = 0; i < result.rows.length; i++){

// **** TO FIX ***
// change this to get ALL the image data, then do what I want with it on the view
// also need to save ALL of the user data (fb_user_id, etc)

						var fbThumbUrl = result.rows[i].fb_photo_thumbnail;
						fbPhotoThumbsArray.push(fbThumbUrl);
					}
					// console.log("array...", photoThumbsArray);
					// console.log("number of items in array: ", photoThumbsArray.length);
					res.render("users/landingFacebook", {fbPhotoThumbsArray:fbPhotoThumbsArray});
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




// ____________INSTAGRAM____________


// Instagram credentials
var instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
var instagramClientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
var instagramRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;
console.log("instagramRedirectUri: ", instagramRedirectUri);


// displays a page with the instagram authorization via a button
app.get('/authorize/instagram', function(req, res){
	res.render("users/authInstagram");
});


// user clicks on button from the /authorize/instagram page,
// which gets this route, which starts the authentication process
// to the instagram API, and redirects to the /landing/instagram route below
app.get('/login/instagram', function(req, res) {
	// ask instagram for authorization
	res.redirect("https://api.instagram.com/oauth/authorize/?client_id=" + 
		instagramClientId + "&redirect_uri=" + instagramRedirectUri + "&response_type=code&scope=basic");
});


// ON RETURN, GET ALL THE DATA FROM THE API AND STORE IT IN MY DATABASES
// NOTES: 
// req.params gets everything after the 'http://localhost:3000/', so in this case, it's '/instagramLanding'
// and req.query gets everything after the '?', so in this case, it's '?code=...'
// and we can access that by using req.query.whatever-thing-is-before-the-equals-sign
// don't change this path without also changing the redirect URLs on Instagram API Manage Client page
app.get('/landing/instagram', function(req, expressResponse) {
	// if the user declines authorization, handle the error response query from instagram
	if (req.query.error){
		console.log("error requesting user instagram code, error reason: ", req.query.error_reason);
		console.log("error requesting user instagram code, error description: ", req.query.error_description);
		expressResponse.redirect("errors/nope");
	} else {
		console.log("requesting access token from Instagram");
		var instgramCode = req.query.code;

		// post info in a form submission format
		// use the 'form' format with a callback from https://github.com/request/request
		request.post({
			url:"https://api.instagram.com/oauth/access_token", 
			form: {client_id:instagramClientId, 
				client_secret:instagramClientSecret,
				grant_type:"authorization_code", 
				redirect_uri:instagramRedirectUri, 
				code:instgramCode}
			}, 
			function(err, instagramTokenResponse, body){
				console.log("error in getting response from instagram for access token: ", err);
				// console.log("response from getting instagram  access token: ", instagramTokenResponse);
				console.log("body from getting instagram access token: ", body);

				var userInstagramData = JSON.parse(body);
				var userInstagramAccessToken = userInstagramData.access_token;
				// console.log("just the userInstagramAccessToken: ", userInstagramAccessToken);

				// var userInstagramId = userInstagramData.user.id;
				// console.log("my instagram user_id:", userInstagramId);

// currently grabbing just 50 most recent photos
				var instagramApiUrl = "https://api.instagram.com/v1/users/self" + 
				"/media/recent?access_token=" + userInstagramAccessToken +
				"&count=50";

				// set header types using options
				// https://github.com/request/request#custom-http-headers
				// this is OPTIONAL in this instance, but it's nice to see how to format it
				request.get(
				{
					url:instagramApiUrl, 
					headers: {"content-type": "application/json"}
				}, 
					function(apiError, apiResponse, apiBody){
						// console.log("apiError: ", apiError);
						// console.log("apiResponse: ", apiResponse);
						var instagramApiDataParsed = JSON.parse(apiBody);
						
						var instagramApiBodyParsedData = instagramApiDataParsed.data;
						// console.log("apiBody: ", instagramApiBodyParsedData);

						// save data to my db
						pg.connect(databaseConnectionLocation, function(err, client, done){

							if(err){
								return console.error("error connecting to database, from inside of /landing/instagram route", err);
							}


							// format the data
							for (var i = 0; i < instagramApiBodyParsedData.length; i++){

								var thisInstaItem = instagramApiBodyParsedData[i];
								// only save photos, not images
								if (thisInstaItem.type === "image"){
									var thisInstaPhotoObject = thisInstaItem;
									var insta_user_id = thisInstaItem.user.id;
									var	insta_photo_id = thisInstaItem.id;
									var	insta_photo_created_time = thisInstaItem.created_time;
									// the following pieces are not simple text strings, they are objects or arrays,
									// so we need to convert to JSON in order to save in our db as a string
									var	insta_photo_url_full_size = JSON.stringify(thisInstaItem.images.standard_resolution.url);
									var	insta_photo_thumbnail = JSON.stringify(thisInstaItem.images.thumbnail);
									var	insta_photo_place = JSON.stringify(thisInstaItem.location);  // these may not always exist
									var	insta_photo_tags = JSON.stringify(thisInstaItem.tags);  // these may not always exist

// **** TO FIX ***
// only save if does not yet exist
// change before production
	// find value, then if it exists, update
		// else, insert new item

									// add data to db
									client.query("INSERT INTO instagram_photos (insta_user_id, insta_photo_id, " + 
											"insta_photo_created_time, insta_photo_url_full_size, " +
											"insta_photo_thumbnail, insta_photo_place, insta_photo_tags) " +
											"VALUES ('" + insta_user_id + "', '" + insta_photo_id + "', '" +
											insta_photo_created_time + "', '" + 
											insta_photo_url_full_size + "', '" + insta_photo_thumbnail + "', '" + 
											insta_photo_place + "', '" + insta_photo_tags + "')", 
												function(err, result){
													done();
													if(err){
														return console.error("error inserting into table instagram_photos", err);
													}
									}); // close client.query
								} // close if (thisInstaItem.type === "image")
							} // close for loop
							console.log("successfully saved instagram data to instagram_photos table");
						}); // close pg.connect


						// redirect to the /landing/show/instagram page
						expressResponse.redirect("/landing/show/instagram");

				});
				
			});
	}
});


app.get("/landing/show/instagram", function(req, res){
	console.log("hello from inside of /landing/show/instagram");
	// get data out of database
	pg.connect(databaseConnectionLocation, function(err, client, done){
		if(err){
			return console.error("error connecting to database, from inside of /landing/show/instagram route", err);
		}

// **** TO FIX ***
// hard coding user id - fix to do this dynamically later

		client.query("SELECT * FROM instagram_photos WHERE insta_user_id = '2173066951'", function(err, result){
			done();
			if(err){
				return console.error("error SELECTing from table instagram_photos, in /landing/show/instagram route", err);
			}

			console.log("connecting to db in /landing/show/instagram");
			// console.log("result: ", result);
			var thisUserInstaAllPhotosData = result.rows;
			// console.log("thisUserInstaAllPhotosData: ", thisUserInstaAllPhotosData);
			var instaThumbsArray = [];
			for (var n = 0; n < thisUserInstaAllPhotosData.length; n++){
				var currentThumbString = thisUserInstaAllPhotosData[n].insta_photo_thumbnail;
				var currentThumbObject = JSON.parse(currentThumbString);
				// console.log("current insta thumb:", currentThumbString);
				var currentThumUrl = currentThumbObject.url;
				instaThumbsArray.push(currentThumUrl);
			}

			res.render("users/landingInstagram", {instaThumbsArray:instaThumbsArray});
		}); // close client.query
	}); // close pg.connect
});




// ____________FLICKR____________


// Flickr credentials
var flickrApiKey = process.env.FLICKR_API_KEY;
var flickrClientSecret = process.env.FLICKR_CLIENT_SECRET;
var flickrRedirectUri = process.env.FLICKR_REDIRECT_URI;

// bring in the flickrapi node module & set global variables for the api requests
var Flickr = require("flickrapi");
var flickrOptions = {
      api_key: flickrApiKey,
      secret: flickrClientSecret,
      permissions: "read",	// my app has read-only permissions to the user's flickr data
      // nobrowser: true, 	 // console.logs the auth URL instead of opening a browser for it
      callback: flickrRedirectUri	// put my own URL as the callback URL
      // noAPI: true
    };
 

// displays a page with the flickr authorization via a button
app.get('/authorize/flickr', function(req, res){
	res.render("users/authFlickr");
});

// user clicks on button from the /authorize/flickr page,
// which gets this route, which starts the authentication process
// to the instagram API, and redirects to the /landing/instagram route below
// this uses the node module "flickrapi" that we brought in above, which has magical
// authentication, so we don't have to specify a callback / etc
app.get('/login/flickr', function(req, res) {
	
	// this does magic!
	// it asks the user to authenticate for me, so easy!
	Flickr.authenticate(flickrOptions, function(error, flickr) {
	  // we can now use "flickr" as our API object
	  console.log("flickr result??? ", flickr);
	});

});


app.get('/landing/flickr', function(req, res){

	// request.get("https://api.flickr.com/services/rest/?" + 
	// 	"method=flickr.people.getPhotos" + 
	// 	"&api_key=c8180da7533fc15f8d1f2939632ca386" + // this is for testing only...mine is different
	// 	"&user_id=me" + 
	// 	"&content_type=1" + // type=1 is photos only
	// 	"&per_page=50&page=1" + // get 50 results per page, and just 1 page of results
	// 	"&format=json&nojsoncallback=1" + // get the data as JSON
	// 	"&auth_token=72157659126665372-793381e0584fa188" + // ??? create this???
	// 	"&api_sig=76b758782432b6c9388e117372e92f3e", // ??? do I need to create this?
	// 	function(apiReq, apiRes){
	// 		console.log(apiRes);
	// 	});

	res.redirect("/landing/show/flickr");
});


app.get('/landing/show/flickr', function(req, res){
	res.render("users/landingFlickr");
});




// ____________ERRORS____________

// if user declines to authorize an application
app.get("/nope", function(req, res){
	res.render("errors/nope");
});

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


