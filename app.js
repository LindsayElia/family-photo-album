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

// cookie-session - lets us create our own session cookies, for login auth with our app
var cookieSession = require("cookie-session");
app.use(cookieSession({
	maxAge: 7200000,	// 2 hours, in milliseconds
	secret: "family-photos",		// is this the key used to make the hash?
	name: "everyones-photos"	// name for cookie
}));

// bring in middleware files to check cookies/sessions in routes, for auth
var loginHelper = require("./middleware/loginHelper");
var routeHelper = require("./middleware/routeHelper");

// use loginHelpers functions in entire app.js file - before all routes?
app.use(loginHelper);

// nodemailer - for password reset emails
var nodemailer = require('nodemailer');
// SMTP transport module for Nodemailer is a built-in module with nodemailer
// create reusable transporter object using SMTP transport
var manrillEmail = process.env.MANDRILL_USER_EMAIL;
var mandrillPass = process.env.MANDRILL_API_KEY;
var transporter = nodemailer.createTransport({
    service: 'Mandrill',
    auth: {
        user: manrillEmail,
        pass: mandrillPass
    }
});

// crypto comes built in with NodeJS - used for generating a random token during password reset
// https://nodejs.org/api/crypto.html
var crypto = require('crypto');

// CHANGE FOR PRODUCTION
// CHANGE FOR PRODUCTION
// CHANGE FOR PRODUCTION
// base domain
var domain = "localhost:3000";
// var domain = "everyonesphotos.com";



// ____________MISC STUFF I TRIED FOR FLICKR OAUTH LOGIN____________

// express-session & grant-express - lets us use OAuth for 100+ APIs
// 
// currenlty I'm just using this for Flickr, but it also works with Facebook, Instagram, & Dropbox
// relies on the express module I already brought in (lines 4 & 5 above)
// https://github.com/simov/grant
// https://grant-oauth.herokuapp.com/#/
// getting started reference: (written by the module author) https://scotch.io/tutorials/implement-oauth-into-your-express-koa-or-hapi-applications-using-grant
var expressSession = require('express-session');
var Grant = require('grant-express');
var config = require('./config.json'); // bring in the config.json file in the same dirctory
var grant = new Grant(config['development'||'production']);
// REQUIRED: (any session store - see ./example/express-session)
app.use(expressSession({secret:'grant'}));
// mount grant
app.use(grant);

// purest - works well with grant module to make API requests easier
// remove??
var Purest = require('purest');
var FlickrPurest = new Purest({provider:'flickr'});

// flickrapi node module - for making signed, authenticated requests
// use grant to authenticate, then use this to make requests to the API
var FlickrApi = require("flickrapi");

// passport auth - third attempt at auth for flickr
// also relies on express, express-session
var passport = require('passport');
var flickrPassportStrategy = require('passport-flickr').Strategy;
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(passport.initialize()); // passport method
app.use(passport.session());  // passport method





// ____________ROUTES____________


//_______HOME_______

// ROOT
app.get("/", function(req, res){
	res.redirect("/index");
});

// INDEX PAGE
app.get("/index", function(req, res){
	res.render("users/index", {req:req});
});

//_______SIGNUP_______

// SIGNUP - GET "signup"
// show the signup page
app.get("/signup", routeHelper.loggedInStop, function(req, res){
	res.render("users/signup");
});

// SIGNUP - POST "signup"
// create a new user and redirect to api auth buttons for now
app.post("/signup", function(req, res){

	// check email format
	var thisEmail = req.body.userEmail;
	console.log("thisEmail 1st: ", thisEmail);
	// SUPER simple / basic email validation, just checkes that there is an @ symbol between strings
	// function validateEmail(email) {
 //    	var emailPattern = /\S+@\S+/;
 //    	return emailPattern.test(email);
	// }
	// thisEmail = validateEmail(thisEmail);
	// console.log("thisEmail 2nd: ", thisEmail);

	var newUser = {};
	newUser.email = thisEmail;
	newUser.password = req.body.userPass;
	newUser.firstName = req.body.userFirstName;
	newUser.lastName = req.body.userLastName;
	console.log("post to /signup for newUser: ", newUser);

	// create user in database
	db.User.create(newUser, function(err, user){
		if(err){
			console.log(err);
			res.render("errors/500");
		} else {
			console.log(user);
			req.login(user); // set the session id for this user to be the user's id from our DB
			res.redirect("/users/" + user._id + "/apiAuthStart");
		}
	});
});


//_______LOGIN_______

// LOGIN - GET "login"
// show the login page
app.get("/login", routeHelper.loggedInStop, function(req, res){
	res.render("users/login");
});

// LOGIN - POST "login"
// sign the user in and redirect to to api auth buttons for now
app.post("/login", function(req, res){
	var userLoggingIn = {};
	userLoggingIn.email = req.body.userEmail;
	userLoggingIn.password = req.body.userPass;
	console.log("this user is logging in, user email & pass: ", userLoggingIn);	

	db.User.authenticate(userLoggingIn, function(err, user){
		if (!err && user !== null){
			// if email & pw match, set the session id to the user id for this user
			req.login(user);
			// send the user to their own landing page
			res.redirect("/users/" + user._id + "/apiAuthStart");
		} else {
			console.log(err);
			res.render("users/login", {err:err}); 
// TO DO:
// add some error messaging to login page if error
		}
	});

});

//_______PASSWORD RESET_______

// password reset page request page - open to anyone
app.get('/passwordreset', function(req, res){
	res.render("users/requestPassReset");
});


// TO DO:
// validate that user entered something (with front end), before submitting form


// password email request - by clicking button to send email with link to reset pw
app.post('/passwordreset', function(req, res){
	
	// generate the token
	var token;
	crypto.randomBytes(20, function(err, buffer) {
		token = buffer.toString('hex');
		console.log("curious to see what this generates: ", token);
	});
	
	// look for user in our db
	var receipientEmail = req.body.userEmail;
	db.User.findOne({email: receipientEmail}, function (err, user){
		if (err){
			console.log("error in /forgotpassword route, finding user in db");
			res.redirect("errors/500");
		}
		if (!user) {
// TO DO:
// tell user no account with that email address in our system, try again
			console.log("no user by that email in system");
			res.render("users/requestPassReset");
		} else if (user) {

			// set user's info 
			user.resetPasswordToken = token;
    		user.resetPasswordExpires = Date.now() + 7200000; // 2 hours, in milliseconds
    		// save user with token
        	user.save(function(err){
        		if (err){
					console.log("error in /forgotpassword route, saving token to user db");
					res.redirect("errors/500");
				} else {
					console.log("saved user reset token to db, sending email...", token);
					// configure e-mail data
					var mailOptions = {
					    from: "Eveyrone\'s Photos<lindsay@everyonesphotos.com>", // sender address
					    to: receipientEmail,
					    subject: "Password reset requested for Everyone\'s Photos ✉", // Subject line
					    // plaintext body
					    text: "Hello " + user.firstName + ", \n \n Someone requested a password reset for this account. \n" + 
					    "Please click on this link, or copy and paste it into your browser, to reset your password: \n \n" + 
					    "http://" + domain + "/reset/" + user._id + "/" + token +  "\n \n" +
					    "This link will expire in 2 hours. \n If you did not request a password reset, you can " +
					    "ignore this email and your password will remain unchanged. \n \n" + 
					    " Do not forward this email to anyone. \n \n " +
					    "~Lindsay",
					    // html body
					    html: "<p>Hello " + user.firstName + ",</p>" + 
					    "<p>Someone requested a password reset for this account.</p>" + 
					    "<p>Please click on this link, or copy and paste it into your browser, to reset your password:</p>" + 
					    "<p>http://" + domain + "/reset/" + user._id + "/" + token +  "</p>" +
					    "<p>This link will expire in 2 hours. If you did not request a password reset, you can " +
					    "ignore this email and your password will remain unchanged. </p>" + 
					    "<p>Do not forward this email to anyone.</p>" +
					    "<p>~Lindsay<p>"
					};

					// send password reset email to user
					transporter.sendMail(mailOptions, function(error, info){
					    if (error) {
					        console.log(error);
					        res.render("users/requestPassReset");
					    } else {
// TO DO:
// flash confirmation to user
					        console.log('Message sent: ' + info.response);
					        res.redirect("/");
					    }
					}); // close transporter.sendMail

				} // close else
        	}); // close user.save

        } // close else if (user)
	}); // close User.findOne
}); // close app.post
	

// login with reset password email link
app.get('/reset/:user_id/:token', function(req, res){
	// pass the token from the requesting url into the page as data, to save in a hidden field
	var token = req.params.token;
	// $gt selects those documents where the value of the field is greater than the specified value.
	db.User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
// TO DO:
// flash message token is invalid
			// req.flash('error', 'Password reset token is invalid or has expired.');
			res.redirect('/passwordreset');
		} else {
    		// show a password reset form
			res.render("users/reset", {token:token});
    	}
	});
});


// post - password reset, submit new password
app.post('/reset/:user_id/:token', function(req, res){
	// $gt selects those documents where the value of the field is greater than the specified value.
	console.log("Logging req.body.token: ", req.body.token);	
	db.User.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
// TO DO:
// flash message token is invalid
			// req.flash('error', 'Password reset token is invalid or has expired.');
			res.redirect('/passwordreset');
		} else {
			var receipientEmail = user.email;
			user.password = req.body.userPass;
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;
			user.save(function(err){
				if (err){
					console.log("error in POST /reset/:user_id/:token route, saving user's new info to user db");
					res.redirect("errors/500");
				} else {
					// send password email confirmation
					// configure e-mail data
					console.log("password successfully changed & saved in db");
					var mailOptions = {
					    from: "Eveyrone\'s Photos<lindsay@everyonesphotos.com>", // sender address
					    to: receipientEmail,
					    subject: "Password reset confirmation for Everyone\'s Photos ✉", // Subject line
					    // plaintext body
					    text: "Hello " + user.firstName + ", \n \n" + 
					    "This email is to let you know that your password has been changed for your account. \n \n" + 
					    "We are sending this email as a confirmation and no further action is needed, " + 
					    "unless you did not reset your password. If this was not you, please go to our " +
					    "password reset page and request a new password reset. www.everyonesphotos.com/passwordreset\n \n" + 
					    "~Lindsay",
					    // html body
					    html: "<p>Hello " + user.firstName + ",</p>" + 
					    "<p>This email is to let you know that your password has been changed for your account.</p>" + 
					    "<p>We are sending this email as a confirmation and no further action is needed, " +
					    "unless you did not reset your password. If this was not you, please go to our " +
					    "<a href='www.everyonesphotos.com/passwordreset'>password reset page</a> and request a new password reset.</p>" + 
					    "<p>~Lindsay<p>"
					};

					// send password reset email to user
					transporter.sendMail(mailOptions, function(error, info){
					    if (error) {
					        console.log(error);
					        res.redirect("/");
					    } else {
// TO DO:
// flash confirmation to user
					        // log the user in with loginHelper middleware
							req.login(user);
							// send the user to their own landing page
							res.redirect("/users/" + user._id + "/apiAuthStart");
					    }
					}); // close transporter.sendMail
				} // close else

			});
    	} // close else
	}); // close db.User.findOne
}); // close app.post('/reset/:user_id/:token...



//_______LOGOUT_______
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/index");
});


//_______USER FLOWS_______

// show the page with buttons for all the APIs
app.get("/users/:user_id/apiAuthStart", routeHelper.ensureSameUser, function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.render("errors/500");
		} else {
			res.render("users/apiAuthStart", {user:user});
		}
	});
});




// ____________FACEBOOK____________


// displays a page with the facebook authorization via a FB login button
// TO FIX: not sure if I need all three send type options?
app.get('/users/:user_id/authorize/facebook', routeHelper.ensureSameUser, function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.render("errors/500");
		} else {
			res.render("users/authFacebook", {user:user});
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

	// console.log("req.params >>> ", req.params);
	// console.log("req.body >>> ", req.body);
	// console.log("req.query >>> ", req.query);
	// console.log("req.session.id >>> ", req.session.id);

	// need bodyParser module to interpret the data
	// console.log("this is from the ajax request - req.body - ", req.body);
	// unpack JSON so that it's a JavaScript ojbect & array format, rather than a string
	var fbDataReceived = JSON.parse(req.body.data);
	// console.log("fbDataReceived[0]:", fbDataReceived[0]);

	// grab the fb user id off of the first item in data received from client side
	var user = {};
	user.facebookId = fbDataReceived[0].fb_user_id;	// save fb id off of the first item returned
	console.log("user? >>> ", user);

	// save the user's facebook user id to user db
	db.User.findByIdAndUpdate(req.session.id, user, function(err, user){
		if(err){
			console.error("error with findByIdAndUpdate in User DB in post to /users/:user_id/landing/facebook route", err);
		} else {
			console.log("successfully saved user's fb_id to User DB: ", user);

			// iterate through the data we've received from client side
			for (var i = 0; i < fbDataReceived.length; i++){
				
				// format the data received from client side
				// some pieces are not simple text strings, they are objects or arrays,
				// so we need to convert to JSON in order to save in our db as a string
				var currentPhotoObject = fbDataReceived[i];
				var fbphotoToSave = {
					facebookPhotoId: currentPhotoObject.fb_photo_id,
					owner: user,
					createdTime: currentPhotoObject.fb_photo_created_time,
					album: JSON.stringify(currentPhotoObject.fb_photo_album), 		// these may not always exist
					urlFullSize: JSON.stringify(currentPhotoObject.fb_photo_url_full_size), 
					urlThumbnail: currentPhotoObject.fb_photo_thumbnail,
					place: JSON.stringify(currentPhotoObject.fb_photo_place),		// these may not always exist
					tags: JSON.stringify(currentPhotoObject.fb_photo_tags)			// these may not always exist
				};

				// save the data to my database
				db.FacebookPhoto.findOneAndUpdate({fb_photo_id: fbphotoToSave.facebookPhotoId}, fbphotoToSave, {upsert:true}, function(err, user){
					if(err){
						console.error("error with findOneAndUpdate in post to /users/:user_id/landing/facebook route", err);
					} else {
						console.log("successfully saved item to facebookphotos document");
					}
				}); // close db.FacebookPhoto.findOneAndUpdate

			} // close for loop

		}
	}); // close db.User.findByIdAndUpdate

}); // close app.post("/landing/facebook"...


// displays a page showing fb photo stream
// connects to database and finds all fb photos
// renders the users/landingFacebook page
app.get('/users/:user_id/landing/facebook', function(req, res){
	// connect to User db to grab user id
	db.User.findById(req.session.id, function(err, user){
		if (err){
			console.error("error with findById for User DB in get to /users/:user_id/landing/facebook route", err);
		} else {
			// connect to FB photo db to find all photos for this user
			db.FacebookPhoto.find({owner:user}, function(err, fbphotodata){
				if (err){
					console.error("error with FacebookPhoto.find() in get to /users/:user_id/landing/facebook route", err);
				} else {
					console.log("all fbphotodata for this user: ", fbphotodata);
					// put all thumbnails into an array to pass to view
					var fbPhotoThumbsArray = [];
					for (var i = 0; i < fbphotodata.length; i++){
						var fbThumbUrl = fbphotodata[i].urlThumbnail;
						fbPhotoThumbsArray.push(fbThumbUrl);
					}
					res.render("users/landingFacebook", {fbPhotoThumbsArray:fbPhotoThumbsArray});
				} // close else
			}); // close db.FacebookPhoto.findOne
		} // close else
	}); // close db.User.findById
}); // close app.get




// ____________INSTAGRAM____________


// Instagram credentials
var instagramClientId = process.env.INSTAGRAM_CLIENT_ID;
var instagramClientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
var instagramRedirectUri = process.env.INSTAGRAM_REDIRECT_URI;
console.log("instagramRedirectUri: ", instagramRedirectUri);


// displays a page with the instagram authorization via a button
app.get('/users/:user_id/authorize/instagram', function(req, res){
	res.render("users/authInstagram");
});


// user clicks on button from the /authorize/instagram page,
// which gets this route, which starts the authentication process
// to the instagram API, and redirects to the /landing/instagram route below
app.get('/users/:user_id/login/instagram', function(req, res) {
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

									var	insta_photo_id_with_user_id = thisInstaItem.id;
									// remove the underscore & user id from end of photo id
									var pattern = /_/;
									var	insta_photo_id_array = insta_photo_id_with_user_id.split(pattern);
									
									var	insta_photo_id = insta_photo_id_array[0];
									// console.log("after splitting: ", insta_photo_id);
									
									var	insta_photo_created_time = thisInstaItem.created_time;
									// the following pieces are not simple text strings, they are objects or arrays,
									// so we need to convert to JSON in order to save in our db as a string
									var	insta_photo_url_full_size = JSON.stringify(thisInstaItem.images.standard_resolution.url);
									var	insta_photo_thumbnail = JSON.stringify(thisInstaItem.images.thumbnail);
									var	insta_photo_place = JSON.stringify(thisInstaItem.location);  // these may not always exist
									var	insta_photo_tags = JSON.stringify(thisInstaItem.tags);  // these may not always exist

									var temptype = typeof insta_photo_id;
									// console.log("this insta_photo_id: ", insta_photo_id);
									// console.log("typoe of insta_photo_id: ", temptype);
									// add data to db
											
// TO FIX:
// trying to only add item if not already in table
// and update item's data if it is in table
// problem with how I compare the result of searching in the table
// ??? try putting pg.connect inside of the for loop
// do same for facebook once I fix

// TO DO:
// change query statements so they are not insecure
// using prepared statements
// https://github.com/brianc/node-postgres/wiki/Prepared-Statements
// https://students.galvanize.com/cohorts/13/daily_plans/2015-07-08

									client.query("INSERT INTO instagram_photos (insta_user_id, insta_photo_id, " + 
														"insta_photo_created_time, insta_photo_url_full_size, " +
														"insta_photo_thumbnail, insta_photo_place, insta_photo_tags) " +
														"VALUES ('" + insta_user_id + "', '" + insta_photo_id + "', '" +
														insta_photo_created_time + "', '" + 
														insta_photo_url_full_size + "', '" + insta_photo_thumbnail + "', '" + 
														insta_photo_place + "', '" + insta_photo_tags + "')", 
															function(err, result){
																// console.log("CHECK!", result);
																done();
																if(err){
																	return console.error("error inserting into table instagram_photos", err);
																}
									}); // close client.query


									// var query = client.query("SELECT * FROM instagram_photos WHERE insta_photo_id = '" + insta_photo_id + "'");
									// query.on('row', function(row, result) {
									// 	// console.log("just 'row':", row);
									// 	// console.log("just result #1:", result);
									// 	console.log("result.rows.length, before: ", result.rows.length);
									// 	result.addRow(row);
									// 	// console.log("just result #2:", result);
									// 	console.log("result.rows.length, after: ", result.rows.length);
								 //     	// console.log('row.insta_photo_id', row.insta_photo_id);
								 //     	// console.log("row.rowCount: ", row.rowCount);
								 //    });


									// look first to see if item exists by photo id				// old: CAST(insta_photo_id AS text)
									// client.query("SELECT * FROM instagram_photos WHERE insta_photo_id = '" + insta_photo_id + "'", 
									// 		function(err, result){
									// 			// console.log("just the result: ", result);
									// 			console.log("result.rowCount: ", result.rowCount);
									// 			// done();
									// 			if(err){
									// 					return console.error("error selecting photo by id from table instagram_photos", err);
									// 			}

									// 			// if the item exists in table, update it
									// 			if (result.rows.rowCount === 1){
									// 				console.log("rows.rowCount is one, update! <<<<");
									// 				client.query("UPDATE instagram_photos " + 
									// 					"SET insta_photo_place = '" + insta_photo_place + "' " +
									// 					", insta_photo_tags = '" + insta_photo_tags + "' " +
									// 					"WHERE insta_photo_id = " + insta_photo_id,
									// 						function(err, result){
									// 							done();
									// 							if(err){
									// 								return console.error("error updating row in table instagram_photos", err);
									// 							}
									// 				}); // close client.query
									// 			} 

									// 			// if the item does not exist in table, add it
									// 			else if (result.rowCount === 0){
									// 				console.log("rows.rowCount is zero, add! <<<<");
									// 				client.query("INSERT INTO instagram_photos (insta_user_id, insta_photo_id, " + 
									// 					"insta_photo_created_time, insta_photo_url_full_size, " +
									// 					"insta_photo_thumbnail, insta_photo_place, insta_photo_tags) " +
									// 					"VALUES ('" + insta_user_id + "', '" + insta_photo_id + "', '" +
									// 					insta_photo_created_time + "', '" + 
									// 					insta_photo_url_full_size + "', '" + insta_photo_thumbnail + "', '" + 
									// 					insta_photo_place + "', '" + insta_photo_tags + "')", 
									// 						function(err, result){
									// 							console.log("CHECK!", result);
									// 							done();
									// 							// result.addRow(row); // without this, the rowcount doesn't go up, and the loop repeats with the same photo id :(
									// 							if(err){
									// 								return console.error("error inserting into table instagram_photos", err);
									// 							}
									// 				}); // close client.query
									// 			}  
									// 			// if there is more than 1 row with that photo_id, we have a problem!!
									// 			else {
									// 				console.log("we might have a serious problem with the data in select from instagram_photos");
									// 			}
									// 	});

									
									
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


app.get("/users/:user_id/landing/show/instagram", function(req, res){
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

			// console.log("connecting to db in /landing/show/instagram");
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

// FlickrApi
var flickrOptions = {
      api_key: flickrApiKey,
      secret: flickrClientSecret
    };


// passport-flickr
var flickrRedirectUri = process.env.FLICKR_REDIRECT_URI;
console.log("flickrRedirectUri - ", flickrRedirectUri);

passport.use(new flickrPassportStrategy({
    consumerKey: flickrApiKey,
    consumerSecret: flickrClientSecret,
    callbackURL: flickrRedirectUri
  },
  function(token, tokenSecret, profile, done) {
  	console.log("flickrPassportStrategy token: ", token);
  	console.log("flickrPassportStrategy tokenSecret: ", tokenSecret);
  	console.log("flickrPassportStrategy profile: ", profile);
  	console.log("done: ", done);
    // User.findOrCreate({ flickrId: profile.id }, function (err, user) {
      // return done(err, user);
    // });
	return done();
  }
));

// displays a page with the flickr authorization via a button
app.get('/users/:user_id/authorize/flickr', function(req, res){
	res.render("users/authFlickr");
});

// user clicks on button from the /authorize/flickr page,
// which gets this route, which starts the authentication process
// to the flickr API, and redirects to the /landing/flickr route below

// using passport-flickr
app.get('/users/:user_id/login/flickr', passport.authenticate('flickr'));


app.get('/auth/flickr/callback',
	passport.authenticate('flickr'),
	function(req, res){
  		// Successful authentication, redirect to landing page
		res.redirect('/landing/show/flickr');
	});






// this works with both the node module "flickrapi" 
// and grant module
// see https://github.com/simov/grant#typical-flow - step #5
app.get('/users/:user_id/connect/flickr', function(req, res){
});

// TO FIX: I'm not handling what happens if the user declines to authorize...they get sent back to my app's home page
// which is a poor experience



// path specified by grant module
app.get('/handle_flickr_callback', function(req, res){
	res.end(JSON.stringify(req.query, null, 2));
});


// path specified by grant module
app.get('/flickr/callback', function(req, res){

	console.log("logging req.query: ", req.query);
	console.log("headers sent: ", res.headersSent);
	console.log("grant res:");

	var userFlickrAccessToken = req.query.access_token;
	var userFlickrAccessSecret = req.query.access_secret;
	var userFlickrOauthToken = req.query.raw.oauth_token;
	var userFlickrOauthTokenSecret = req.query.raw.oauth_token_secret;
	var userFlickrId = req.query.raw.user_nsid;
	var userFlickrUsername = req.query.raw.username;

	console.log("all the things1: ", userFlickrAccessToken);
	console.log("all the things2: ", userFlickrAccessSecret);
	console.log("all the things3: ", userFlickrOauthToken);	 // this appears to be the same as the userFlickrAccessToken
	console.log("all the things4: ", userFlickrOauthTokenSecret);  // this appears to be the same as the userFlickrAccessSecret
	console.log("all the things5: ", userFlickrId);
	console.log("all the things6: ", userFlickrUsername);



// attempt with grant & purest
	// FlickrPurest
	// 	.query()
	// 	.get("flickr.people.getPhotos")
	// 	.auth({"oauth": {"token": userFlickrOauthToken, "secret": userFlickrOauthTokenSecret}}
	// 	// {
	// 	// 	"oauth": {"token": userFlickrOauthToken, "secret": userFlickrOauthTokenSecret},
	// 	// 	"oauth_consumer_key":flickrApiKey, 
	// 	// 	"user_id":userFlickrId,
	// 	// 	"oauth_token":userFlickrOauthToken,
	// 	// 	"access_token":userFlickrAccessToken,
	// 	// 	"oauth_token_secret":userFlickrOauthTokenSecret
	// 	// }
	// 	)
	// 	.request(function (flickrErr, flickrRes, flickrBody) {
	// 		// do stuff
	// 		console.log("flickrErr: ", flickrErr);
	// 		console.log("flickrRes: ", flickrRes);
	// 		console.log("flickrBody: ", flickrBody);
	// });

// attempt with info returned from grant, regular request module
	var flickrUrlToGetFirst = "https://api.flickr.com/services/rest/?" + 
	"method=flickr.people.getPhotos" + 
	"&oauth_consumer_key=" + flickrApiKey +
	"&user_id=" + userFlickrId +
	"&content_type=1" + // type=1 is photos only
	"&per_page=50&page=1" + // get 50 results per page, and just 1 page of results
	"&format=json&nojsoncallback=1" + // get the data as JSON
	"&oauth_token=" + userFlickrAccessToken +
	"oauth_signature_method=HMAC-SHA1" +
	"&oauth_version=1.0";

	console.log("flickrUrlToGetFirst: ", flickrUrlToGetFirst);

	request.get(flickrUrlToGetFirst,
	function(flickrApiRequest, flickrApiResponse){
		console.log("flickrApiResponse #1 --->>>> ", flickrApiResponse.body);
	});

// junk
	// var flickrUrlToGetSecond = "https://api.flickr.com/services/rest" +
	// 		"?nojsoncallback=1&oauth_nonce=84354935" +
	// 		"&format=json" +
	// 		"&oauth_consumer_key=" + flickrApiKey +
	// 		"&oauth_timestamp=1305583871" +
	// 		"&oauth_signature_method=HMAC-SHA1" +
	// 		"&oauth_version=1.0" +
	// 		"&oauth_token=" + userFlickrOauthToken +
	// 		"&oauth_signature=dh3pEH0Xk1qILr82HyhOsxRv1XA%3D" +
	// 		"&method=flickr.test.login";
	
	// console.log("flickrUrlToGetSecond: ", flickrUrlToGetSecond);

	// request.get(flickrUrlToGetSecond,
	// function(flickrApiRequesttwo, flickrApiResponsetwo){
	// 	console.log("flickrApiResponsetwo #2 --->>>> ", flickrApiResponsetwo.body);
	// });



 
	res.redirect("/users/" + user._id + "/landing/show/flickr");
});


app.get('/users/:user_id/landing/show/flickr', function(req, res){
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


