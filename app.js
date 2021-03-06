// ____________REQUIRE NODE MODULES & SET MIDDLEWARE____________

// when is for ?
var when = require('when');

// express - lets us use dynamic data within our views
var express = require("express");
var app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// serve-favicon - let's us use a custom image for the favicon
var favicon = require("serve-favicon");
app.use(favicon(__dirname + "/public/img/camera-icon.png"));

// bring in our models & database
var db = require("./models");

// request - lets us make HTTP requests / get & post data
// it goes inside of route block of code
var request = require("request");

// got this from https://github.com/request/request#oauth-signing
// using to parse for flickr auth response along with 'request' module
var qs = require('querystring');

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

// use loginHelpers functions in entire app.js file - before all routes
// this lets us use the req.login(user) and req.logout() functions inside of any route
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
// var domain = "localhost:3000";
var domain = "everyonesphotos.com";




// ____________ROUTES____________


//_______HOME_______

// ROOT
app.get("/", function(req, res){
	res.redirect("/index");
});

// INDEX PAGE
app.get("/index", function(req, res){
	res.render("statics/index", {req:req});
});

// ABOUT
app.get("/about", function(req, res){
	res.render("statics/about", {req:req});
});


//_______SIGNUP_______

// SIGNUP - GET "signup"
// show the signup page
app.get("/signup", routeHelper.loggedInStop, function(req, res){
	res.render("users/signup", {req:req});
});

// SIGNUP - POST "signup"
// create a new user and redirect to api auth buttons for now
app.post("/signup", function(req, res){
	var newUser = {};
	newUser.email = req.body.userEmail;
	newUser.password = req.body.userPass;
	newUser.firstName = req.body.userFirstName;
	newUser.lastName = req.body.userLastName;
	console.log("post to /signup for newUser: ", newUser);

	// create user in database
	db.User.create(newUser, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			console.log(user);
			req.login(user); // set the session id for this user to be the user's id from our DB
			res.redirect("/users/" + user._id + "/myaccount");
		}
	});
});


//_______LOGIN_______

// LOGIN - GET "login"
// show the login page
app.get("/login", routeHelper.loggedInStop, function(req, res){
	res.render("users/login", {req:req});
});

// LOGIN - POST "login"
// sign the user in and redirect to to api auth buttons for now
app.post("/login", function(req, res){
	var userLoggingIn = {};
	userLoggingIn.email = req.body.userEmail;
	userLoggingIn.password = req.body.userPass;
	// console.log("this user is logging in, user email & pass: ", userLoggingIn);	

	db.User.authenticate(userLoggingIn, function(err, user){
		if (!err && user !== null){
			// if email & pw match, set the session id to the user id for this user
			req.login(user);
			// send the user to their own landing page
			res.redirect("/users/" + user._id + "/myaccount");
		} else {
			console.log(err);
			res.render("users/login", {err:err}); 
// TO DO:
// add some error messaging to login page if error
// alert user if input is incorrect
		}
	});

});

//_______PASSWORD RESET_______

// password reset page request page - open to anyone
app.get('/passwordreset', function(req, res){
	res.render("users/requestPassReset", {req:req});
});


// TO DO:
// validate that user entered something (with front end), before submitting form


// password email request - by clicking button to send email with link to reset pw
app.post('/passwordreset', function(req, res){
	
	// generate the token
	var token = crypto.randomBytes(20).toString('hex'); // 'hex' makes it so that the result is only letters and numbers
	console.log("token in /passwordreset: ", token);
	
	// look for user in our db
	var receipientEmail = req.body.userEmail;
	db.User.findOne({email: receipientEmail}, function (err, user){
		if (err){
			console.log("error in /forgotpassword route, finding user in db");
			res.redirect("/500");
		}
		if (!user) {
// TO DO:
// tell user no account with that email address in our system, try again
			console.log("no user by that email in system");
			res.render("users/requestPassReset", {req:req});
		} else if (user) {

			// set user's info 
			user.resetPasswordToken = token;
    		user.resetPasswordExpires = Date.now() + 7200000; // 2 hours, in milliseconds
    		// save user with token
        	user.save(function(err){
        		if (err){
					console.log("error in /forgotpassword route, saving token to user db");
					res.redirect("/500");
				} else {
					console.log("saved user reset token to db, sending email...", token);
					// configure e-mail data
					var mailOptions = {
					    from: "Everyone\'s Photos<lindsay@everyonesphotos.com>", // sender address
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
			res.render("users/reset", {token:token, req:req});
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
					res.redirect("/500");
				} else {
					// send password email confirmation
					// configure e-mail data
					console.log("password successfully changed & saved in db");
					var mailOptions = {
					    from: "Everyone\'s Photos<lindsay@everyonesphotos.com>", // sender address
					    to: receipientEmail,
					    subject: "Password reset confirmation for Everyone\'s Photos ✉", // Subject line
					    // plaintext body
					    text: "Hello " + user.firstName + ", \n \n" + 
					    "This email is to let you know that your password has been changed for your account. \n \n" + 
					    "We are sending this email as a confirmation and no further action is needed, " + 
					    "unless you did not reset your password. If this was not you, please go to our " +
					    "password reset page and request a new password reset. " + domain+ "/passwordreset\n \n" + 
					    "~Lindsay",
					    // html body
					    html: "<p>Hello " + user.firstName + ",</p>" + 
					    "<p>This email is to let you know that your password has been changed for your account.</p>" + 
					    "<p>We are sending this email as a confirmation and no further action is needed, " +
					    "unless you did not reset your password. If this was not you, please go to our " +
					    "<a href='" + domain + "/passwordreset'>password reset page</a> and request a new password reset.</p>" + 
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


// getuser to show user - from home page
app.get("/users/getuser/myaccount", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.redirect("/users/"+ req.session.id+"/myaccount");
		}
	});
});


// user show page - user landing page after logging in
app.get("/users/:user_id/myaccount", function(req, res){
	// USER DB
	db.User.findById(req.session.id, function(errUser, user){
		if(errUser){
			console.log("errUser from users/myaccount with user db", errUser);
			res.redirect("/500");
		} else {

			// populate group data onto user so it's available on show page
			user.populate('groupId', function (errPop, userPop) {
				// console.log("populating user in user edit page: >>> ", userPop);
			});

			// FLACEBOOK DB
			db.FacebookPhoto.find({owner:user}, function(errFb, fbphotodata){
				if (errFb){
					console.error("error from users/myaccount with fb db", errFb);
				} else {

					// FLICKR DB
					db.FlickrPhoto.find({owner:user}, function(errFlickr, flickrphotodata){
						if (errFlickr){
							console.error("error from users/myaccount with flickr db", errFb);
						} else {
							// format the flickr data
							var flickrThumbsArray = [];
							for (var i = 0; i < flickrphotodata.length; i++){
								var flickrThumbUrl = flickrphotodata[i].urlThumbnail;
								flickrThumbsArray.push(flickrThumbUrl);
							}

							// INSTAGRAM DB
							db.InstagramPhoto.find({owner:user}, function(errInsta, instaphotodata){
								if (errInsta){
									console.error("error from users/myaccount with insta db", errInsta);
								} else {
									// format the instagram data
									var instaThumbsArray = [];
									for (var i = 0; i < instaphotodata.length; i++){
										var instaThumbUrl = instaphotodata[i].urlThumbnail;
										instaThumbsArray.push(instaThumbUrl);
									}

									db.Group.findOne({_id:user.groupId}, function(errGroup, group){
										if (errGroup){
											console.error("error from users/myaccount with group db", errGroup);
										} else {

											// populate admin data onto group so it's available on show page
											// group.populate('groupAdmin', function (errGroupPop, groupPop) {
											// 	console.log("populating group with admin in user show page: >>> ", errGroupPop);
											// });


											// SEND THE DATA!!!
											res.format({
												'text/html': function(){
													res.render("users/show", {user:user, req:req, flickrThumbsArray:flickrThumbsArray, instaThumbsArray:instaThumbsArray, group:group});
												},
												'application/json': function(){
													// we can send the data in the same format we received it from our database,
													// because we want to send as JSON and parse on the client side
													res.send({fbphotodata:fbphotodata});
												},
												'default': function() {
													// log the request and respond with 406
													res.status(406).send('Not Acceptable');
												}
											}); // close res.format

										} // close else
									}); // close db.Group.find
								} // close else - instagram db
							}); // close db.InstagramPhoto.find
						} // close else - flickr db
					}); // close db.FlickrPhoto.find
				} // close else - facebook db
			}); // close db.FacebookPhoto.find
		} // close else - user db
	}); // close db.User.findById
});

// getuser to edit user - from home page
app.get("/users/getuser/myaccount/edit", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.redirect("/users/"+ user._id +"/edit");
		}
	});
});

// user edit page
app.get("/users/:user_id/edit", function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("users/edit", {user:user});
		}
	});
});


// TO FIX:
// add flash messaging for all three routes below on submit
// make all fields, per form, required to submit

// post - edit form - name details
app.post("/users/:user_id/edit/name", function(req, res){
	var user = {
		firstName: req.body.userFirstName,
		lastName: req.body.userLastName
	};
	db.User.findByIdAndUpdate(req.params.user_id, user, {upsert:true}, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("users/show", {user:user});
		}
	});
});

// post - edit form - email
app.post("/users/:user_id/edit/email", function(req, res){
	var user = {
		email: req.body.userEmail
	};
	db.User.findByIdAndUpdate(req.params.user_id, user, {upsert:true}, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("users/show", {user:user});
		}
	});
});

// post - edit form - password
app.post("/users/:user_id/edit/password", function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		user.password = req.body.userPass;
		user.save(function(err){
			if (err){
				console.log("error in POST /users/:user_id/edit/password route, saving user's new info to user db");
				res.redirect("/500");
			} else {
				// send password email confirmation
				// configure e-mail data
				console.log("password successfully changed & saved in db");
				res.render("users/show", {user:user});
			}
		}); // close user.save
	}); // close db.User.findById
});



// show the page with buttons for all the APIs
app.get("/users/:user_id/apiAuthStart", routeHelper.ensureSameUser, function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
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
			res.redirect("/500");
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
	db.User.findByIdAndUpdate(req.session.id, user, {upsert:true}, function(err, user){
		if(err){
			console.error("error with findByIdAndUpdate in User DB in post to landing/facebook route", err);
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
					urlFullSize: currentPhotoObject.fb_photo_url_full_size, 
					urlThumbnail: currentPhotoObject.fb_photo_thumbnail,
					urlMidSize: currentPhotoObject.fb_photo_url_mid_size,
					place: JSON.stringify(currentPhotoObject.fb_photo_place),		// these may not always exist
					tags: JSON.stringify(currentPhotoObject.fb_photo_tags)			// these may not always exist
				};

				// save the data to my database
				db.FacebookPhoto.findOneAndUpdate({facebookPhotoId: fbphotoToSave.facebookPhotoId}, fbphotoToSave, {upsert:true}, function(err, fbphotodata){
					if(err){
						console.error("error with findOneAndUpdate in post to /landing/facebook route", err);
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
					// console.log("all fbphotodata for this user: ", fbphotodata);
					// put all thumbnails into an array to pass to view
					var fbPhotoThumbsArray = [];
					for (var i = 0; i < fbphotodata.length; i++){
						var fbMidSizeUrl = fbphotodata[i].urlMidSize;
						fbPhotoThumbsArray.push(fbMidSizeUrl);
					}

					res.format({
						'text/html': function(){
							res.render("users/landingFacebook", {fbPhotoThumbsArray:fbPhotoThumbsArray, user:user});
						},
						'application/json': function(){
							// we can send the data in the same format we received it from our database,
							// because we want to send as JSON and parse on the client side
							res.send({fbphotodata:fbphotodata});
						},
						'default': function() {
							// log the request and respond with 406
							res.status(406).send('Not Acceptable');
						}
					});


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
// console.log("instagramRedirectUri: ", instagramRedirectUri);


// displays a page with the instagram authorization via a button
app.get('/users/:user_id/authorize/instagram', function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("users/authInstagram", {user:user});
		}
	});
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
					url: instagramApiUrl, 
					headers: {"content-type": "application/json"}
				}, 
					function(apiError, apiResponse, apiBody){
						// console.log("apiError: ", apiError);
						// console.log("apiResponse: ", apiResponse);
						var instagramApiDataParsed = JSON.parse(apiBody);
						
						var instagramApiBodyParsedData = instagramApiDataParsed.data;
						console.log("apiBody: ", instagramApiBodyParsedData);

						// format user's user-instagram-id and instagram access token
						var user = {};
						user.instagramId = userInstagramData.user.id;  // received with callback, before request to get user photos
						user.instagramAccessToken = userInstagramAccessToken;
						console.log("user? >>> ", user);

						// save data to my db

							// save the user's instagram user id & access token to user db
							db.User.findByIdAndUpdate(req.session.id, user, {upsert:true}, function(err, user){
								if(err){
									console.error("error with findByIdAndUpdate in User DB in post to /landing/instagram route", err);
								} else {
									console.log("successfully saved user's instagram_id to User DB: ", user);


									// iterate through the data we've received from client side
									for (var i = 0; i < instagramApiBodyParsedData.length; i++){
										var thisInstaItem = instagramApiBodyParsedData[i];
										// only save photos, not images
										if (thisInstaItem.type === "image"){
											// format the data received from client side
											var thisInstaPhotoObject = {
												instagramPhotoId: thisInstaItem.id,
												owner: user,
												createdTime: thisInstaItem.created_time,
												urlFullSize: thisInstaItem.images.standard_resolution.url,
												urlThumbnail: thisInstaItem.images.thumbnail.url,
												// some pieces are not simple text strings, they are objects or arrays,
												// so we need to convert to JSON in order to save in our db as a string
												place: JSON.stringify(thisInstaItem.location),  // these may not always exist
												tags: JSON.stringify(thisInstaItem.tags)  // these may not always exist
											};

											// save the data to my database
											db.InstagramPhoto.findOneAndUpdate({instagramPhotoId: thisInstaPhotoObject.instagramPhotoId}, thisInstaPhotoObject, {upsert:true}, function(err, instaphotodata){
												if(err){
													console.error("error with findOneAndUpdate in get /landing/instagram route", err);
												} else {
													console.log("successfully saved item to instagramphotos document");
													
												}
											}); // close db.InstagramPhoto.findOneAndUpdate

										} // close if
									} // close for loop

								} // close else
							}); // close db.User.findByIdAndUpdate

				}); // close function callback on request.get
			}); // close function callback on request.post
	} // close first 'else'

	// render a page with a button that lets the user go to the 'show' page
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			expressResponse.render("users/authInstagramGoToShow", {user:user});
		}
	});

}); // close app.get ('/landing/instagram'...


app.get("/users/:user_id/landing/show/instagram", function(req, res){
	// connect to User db to grab user id
	db.User.findById(req.session.id, function(err, user){
		if (err){
			console.error("error with findById for User DB in get to /users/:user_id/landing/show/instagram route", err);
		} else {
			// connect to instagram photo db to find all photos for this user
			db.InstagramPhoto.find({owner:user}, function(err, instaphotodata){
				if (err){
					console.error("error with InstagramPhoto.find() in get to /users/:user_id/landing/show/instagram route", err);
				} else {
					console.log("all instaphotodata for this user: ", instaphotodata);
					// put all thumbnails into an array to pass to view
					var instaThumbsArray = [];
					for (var i = 0; i < instaphotodata.length; i++){
						var instaThumbUrl = instaphotodata[i].urlThumbnail;
						instaThumbsArray.push(instaThumbUrl);
					}
					res.render("users/landingInstagram", {instaThumbsArray:instaThumbsArray, user:user});
				} // close else
			}); // close db.InstagramPhoto.findOne
		} // close else
	}); // close db.User.findById
});




// ____________FLICKR____________

// Notes for potential write up or blog post:
// I made 3 calls to the flickr API with a signature key
// most of the notes on how to do so are in the third call
// notes are repeated throughout for my own clarity, on all three calls
// notes on how to create the signingKey are only on the first two calls,
// since the same signingKey was used for the second and third call


// Flickr credentials
var flickrApiKey = process.env.FLICKR_API_KEY;
var flickrClientSecret = process.env.FLICKR_CLIENT_SECRET;
var flickrRedirectUri = process.env.FLICKR_REDIRECT_URI;
var flickrRedirectUriEncoded = process.env.FLICKR_REDIRECT_URI_ENCODED;
// console.log("flickrRedirectUri - ", flickrRedirectUri);
var userFlickrOauthTokenSecret; // this will be assigned when we obtain a request token, below
// keeping it global so it can be used in another route, exchanging the request token for the access token


// displays a page with the flickr authorization via a button
app.get('/users/:user_id/authorize/flickr', function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("users/authFlickr", {user:user});
		}
	});
});


// user clicks on button from the /authorize/flickr page,
// which gets this route, which starts the authentication process
// to the flickr API, and redirects to the /landing/flickr route below
// get an oauth token from flickr to display the flickr permissions page to the user
app.get('/users/:user_id/login/flickr', function(req, res){
	// ask flickr for authorization
	console.log("requesting request_token from flickr - get /users/:user_id/login/flickr");

	var nonce = crypto.randomBytes(20).toString('hex'); // 'hex' makes it so that the result is only letters and numbers
	console.log("nonce #1:", nonce);

	var timestamp = Date.now();

	// replace all ampersands EXCEPT for the two between the three parts: 
		// 1 - the HTTP verb
		// 2 - the request URL
		// 3 - all of the request parameters (everything else)
	var baseString = "GET&" + 
		"https%3A%2F%2Fwww.flickr.com%2Fservices%2Foauth%2Frequest_token&" + 
		"oauth_callback%3D" + flickrRedirectUriEncoded + 
		"%26oauth_consumer_key%3D" + flickrApiKey +
		"%26oauth_nonce%3D" + nonce + 
		"%26oauth_signature_method%3DHMAC-SHA1" + 
		"%26oauth_timestamp%3D" + timestamp + 
		"%26oauth_version%3D1.0"; 


	console.log("base string from first request to flickr for request_token: ", baseString);

	// Our signing key is on this format: CONSUMER_SECRET + "&" + TOKEN_SECRET. 
	// But since we do not have a token yet, the signing key is JUST the consumer secret and an ampersand.
	// http://stackoverflow.com/questions/9486840/issue-with-oauth-and-flickr-cannot-request-token
	var signingKey = flickrClientSecret + "&" ;

	// make the hash
	var apiSignature = crypto.createHmac("sha1", signingKey).update(baseString).digest('base64'); // I read somewhere this is supposed to be in base 64 format ??
	console.log("my crypto apiSignature for request token: ", apiSignature);

	// need to URL encode the signature before sending it in the 'get' request below
	// JavaScript has a built-in method for this
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
	var apiSignatureEncoded = encodeURIComponent(apiSignature);
	console.log("signature after URI encoding: ", apiSignatureEncoded);

	// combine the apiSignature with the request Url base string
	var flickrUrlToGet = "https://www.flickr.com/services/oauth/request_token?" + 
	"oauth_callback=" + flickrRedirectUri + 
	"&oauth_consumer_key=" + flickrApiKey + 
	"&oauth_nonce=" + nonce + 
	"&oauth_signature_method=HMAC-SHA1" + 
	"&oauth_timestamp=" + timestamp + 
	"&oauth_version=1.0" + 
	"&oauth_signature=" + apiSignatureEncoded;

	// console.log("flickrUrlToGet --->>>> ", flickrUrlToGet);

	request.get(flickrUrlToGet, 
		function(flickrApiError, flickrApiResponse, flickrApiBody){
			// console.log("flickrApiError --->>>> ", flickrApiError); // -->  null
			// console.log("flickrApiResponse --->>>> ", flickrApiResponse); // --> long thing... 
			console.log("flickrApiBody --->>>> ", flickrApiBody); // --> string containing data to parse

			var responseData = qs.parse(flickrApiBody);
			// console.log("responseData --->>>> ", responseData);

			var userFlickrOauthToken = responseData.oauth_token;
			userFlickrOauthTokenSecret = responseData.oauth_token_secret;
			console.log("userFlickrOauthToken - ", userFlickrOauthToken);
			console.log("userFlickrOauthTokenSecret - ", userFlickrOauthTokenSecret);

			res.redirect("https://www.flickr.com/services/oauth/authorize?oauth_token=" +
				userFlickrOauthToken + "&perms=read"); 

	}); // close request.get

}); // close app.get


// redirect url from flickr
app.get('/landing/flickr', function(req, expressResponse){
	// if the user declines authorization, handle the error response query from instagram
	// looks like Flickr has their own redirect if the user declines... :(
	if (req.query.error){
		console.log("error requesting user flickr access token, error reason: ", req.query.error_reason);
		console.log("error requesting user flickr access token, error description: ", req.query.error_description);
		expressResponse.redirect("errors/nope");
	} else {
		// exchange the request token for an access token that we then save to our db
		console.log("requesting access token from Flickr - get /landing/flickr");

		var nonce = crypto.randomBytes(20).toString('hex'); // 'hex' makes it so that the result is only letters and numbers
		var timestamp = Date.now();
		var userFlickrOauthToken = req.query.oauth_token;
		var userFlickrOauthVerifier = req.query.oauth_verifier;
		// console.log("userFlickrOauthToken --->>> ", userFlickrOauthToken);
		// console.log("userFlickrOauthVerifier --->>> ", userFlickrOauthVerifier);

		var baseString = "GET&" + 
		"https%3A%2F%2Fwww.flickr.com%2Fservices%2Foauth%2Faccess_token&" + 
		"oauth_consumer_key%3D" + flickrApiKey + 
		"%26oauth_nonce%3D" + nonce + 
		"%26oauth_signature_method%3DHMAC-SHA1" + 
		"%26oauth_timestamp%3D" + timestamp + 
		"%26oauth_token%3D" + userFlickrOauthToken + 
		"%26oauth_verifier%3D" + userFlickrOauthVerifier + 
		"%26oauth_version%3D1.0"; 

		console.log("base string in acccess_token route : ", baseString);

		// Our signing key is on this format: CONSUMER_SECRET + "&" + TOKEN_SECRET. 
		// http://stackoverflow.com/questions/9486840/issue-with-oauth-and-flickr-cannot-request-token
		console.log("userFlickrOauthTokenSecret in new route - ", userFlickrOauthTokenSecret);
		var signingKey = flickrClientSecret + "&" + userFlickrOauthTokenSecret;

		// make the hash
		var apiSignature = crypto.createHmac("sha1", signingKey).update(baseString).digest('base64'); // I read somewhere this is supposed to be in base 64 format ??
		console.log("my crypto apiSignature, for access token: ", apiSignature);

		// need to URL encode the signature before sending it in the 'get' request below
		// JavaScript has a built-in method for this
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
		var apiSignatureEncoded = encodeURIComponent(apiSignature);
		console.log("signature after URI encoding, for access token: ", apiSignatureEncoded);

		// combine the apiSignature with the request Url base string
		var flickrUrlToGet = "https://www.flickr.com/services/oauth/access_token?" + 
		"oauth_consumer_key=" + flickrApiKey + 
		"&oauth_nonce=" + nonce + 
		"&oauth_signature_method=HMAC-SHA1" + 
		"&oauth_timestamp=" + timestamp + 
		"&oauth_token=" + userFlickrOauthToken + 
		"&oauth_verifier=" + userFlickrOauthVerifier + 
		"&oauth_version=1.0" + 
		"&oauth_signature=" + apiSignatureEncoded;


		request.get(flickrUrlToGet, 
			function(flickrApiError, flickrApiResponse, flickrApiBody){
				// console.log("flickrApiError --->>>> ", flickrApiError); // -->  null
				// console.log("flickrApiResponse --->>>> ", flickrApiResponse); // --> long thing... 
				console.log("flickrApiBody in acccess_token route --->>>> ", flickrApiBody); // --> string containing data to parse

				var responseData = qs.parse(flickrApiBody);
				console.log("responseData --->>>> ", responseData);

				// save the user data & access tokens to variables (we'll save to our db later on in this route)
				var permanentUserFlickrOauthToken = responseData.oauth_token;
				var permanentUserFlickrOauthTokenSecret = responseData.oauth_token_secret;
				var userFlickrId = responseData.user_nsid;
				// var userFlickrUsername = responseData.username;

				console.log("permanentUserFlickrOauthToken: ", permanentUserFlickrOauthToken);
				console.log("permanentUserFlickrOauthTokenSecret: ", permanentUserFlickrOauthTokenSecret);
				console.log("userFlickrId: ", userFlickrId);
				// console.log("userFlickrUsername: ", userFlickrUsername);



// make a call to the flickr api after the user grants permission, to get 50 photos

				// generate an api signature; required by flickr API

				// https://www.flickr.com/services/api/auth.oauth.html
				// First create a base string for the request. 
				// The base string is constructed by concatenating the HTTP verb, the request URL, and all request parameters 
				// sorted by name, using lexicograhpical byte value ordering, separated by an '&'.

				var nonceApiCall = crypto.randomBytes(20).toString('hex'); // 'hex' makes it so that the result is only letters and numbers
				console.log("nonce #2: ", nonce);

				var timestampApiCall = Date.now();

				// ORDER WITH URL FIRST, THEN QUERY PARAMS IN ALPHABETICAL ORDER
				// GET
					// &
				// https://www.flickr.com/services/rest/
					// &
				// &content_type=1
				// &extras=date_upload,original_format,geo,tags,url_q,url_o
				// &format=json
				// &method=flickr.people.getPhotos
				// &nojsoncallback=1
								// skip? // &oauth_callback=			//--> flickrRedirectUri
				// &oauth_consumer_key= 	//--> flickrApiKey		// my app's API key 
				// &oauth_nonce= 			//--> nonce 			// any random number that will likely be unique each time
				// &oauth_signature_method=HMAC-SHA1
				// &oauth_timestamp=		//--> timestamp
				// &oauth_token=			//--> userFlickrAccessToken
				// &oauth_version=1.0
				// &page=1
				// &per_page=50
				// &user_id=				//--> userFlickrId

				// convert symbols to HTML Character Codes http://www.7is7.com/software/chars.html
				// :   is   %3A
				// /   is   %2F
				// &   is 	%26
				// =   is 	%3D
				// ,   is	%2C
				// &oauth_signature=		//--> what we're creating here, leave out of base string

				// original, before swapping out & and = and ,
				// var stringToConvertToSignature = "GET&" + 
				// 	"https%3A%2F%2Fwww.flickr.com%2Fservices%2Frest&" + 
				//  "content_type=1&extras=date_upload,original_format,geo,tags,url_q,url_o" +
				// 	"&format=json&method=flickr.people.getPhotos&nojsoncallback=1" +
				// 	"&oauth_callback=" + flickrRedirectUri + "&oauth_consumer_key=" + flickrApiKey +
				// 	"&oauth_nonce=" + nonce + "&oauth_signature_method=HMAC-SHA1" + 
				// 	"&oauth_timestamp=" + timestamp + "&oauth_token=" + userFlickrAccessToken +
				// 	"&oauth_version=1.0&page=1&per_page=50&user_id=" + userFlickrId ;

				// replace all ampersands EXCEPT for the two between the three parts: 
					// 1 - the HTTP verb
					// 2 - the request URL
					// 3 - all of the request parameters (everything else)
				var baseStringApiCall = "GET&" + 
					"https%3A%2F%2Fwww.flickr.com%2Fservices%2Frest&" + 
					"content_type%3D1&extras%3Ddate_upload%2Coriginal_format%2Cgeo%2Ctags%2Curl_q%2Curl_o" +
					"%26format%3Djson%26method%3Dflickr.people.getPhotos%26nojsoncallback%3D1" +
					"%26oauth_consumer_key%3D" + flickrApiKey +
					"%26oauth_nonce%3D" + nonceApiCall + "%26oauth_signature_method%3DHMAC-SHA1" + 
					"%26oauth_timestamp%3D" + timestampApiCall + "%26oauth_token%3D" + permanentUserFlickrOauthToken +
					"%26oauth_version%3D1.0%26page%3D1%26per_page%3D50%26user_id%3D" + userFlickrId ;

				console.log("baseStringApiCall: ", baseStringApiCall);


				// use same signingKey we created above
				// make the hash
				var apiSignatureApiCall = crypto.createHmac("sha1", signingKey).update(baseStringApiCall).digest('hex');
				console.log("my crypto apiSignature: ", apiSignatureApiCall);

				// make call to flickr API for the photos,
				// using the api signature we generated above
				var flickrUrlToGetApiCall = "https://api.flickr.com/services/rest/?" + 
				"content_type=1" + // type=1 is photos only
				"&extras=date_upload,original_format,geo,tags,url_q,url_o" +
				"&format=json" +
				"&method=flickr.people.getPhotos" + 
				"&nojsoncallback=1" + // get the data as JSON
				"&oauth_consumer_key=" + flickrApiKey +
				"&oauth_nonce=" + nonceApiCall +
				"&oauth_signature_method=HMAC-SHA1" +
				"&oauth_timestamp=" + timestampApiCall +
				"&oauth_token=" + permanentUserFlickrOauthToken +
				"&oauth_version=1.0" + 
				"&page=1" +
				"&per_page=50" + // get 50 results per page, and just 1 page of results
				"&user_id=" + userFlickrId +	
				"&oauth_signature=" + apiSignatureApiCall ; // our hashed variable

				// console.log("flickrUrlToGetApiCall: ", flickrUrlToGetApiCall);

				request.get(flickrUrlToGetApiCall,
					function(flickrApiRequestApiCall, flickrApiResponseApiCall){
					// console.log("flickrApiResponse.body --->>>> ", flickrApiResponse.body);
					var flickrDataApiCall = JSON.parse(flickrApiResponseApiCall.body);
					// console.log("flickrDataApiCall.photos.photo --->>>>", flickrDataApiCall.photos.photo);

					// make the user object
					var user = {};
					user.flickrId = userFlickrId;
					user.flickrAccessToken = permanentUserFlickrOauthToken;
					user.flickrAccessSecret = permanentUserFlickrOauthTokenSecret;
					// save the user's flickr user id to user db
					db.User.findByIdAndUpdate(req.session.id, user, {upsert:true}, function(err, user){
						if(err){
							console.error("error with findByIdAndUpdate in User DB in get /flickr/callback route", err);
						} else {
							console.log("successfully saved user's flickr_id to User DB: ", user);

							// loop through the response data
							for(var i = 0; i < flickrDataApiCall.photos.photo.length; i++){
								var currentFlickrPhoto = flickrDataApiCall.photos.photo[i];
								// console.log("currentFlickrPhoto: ", currentFlickrPhoto);
								var latAndLong = {
										latitude: currentFlickrPhoto.latitude,
										longitude: currentFlickrPhoto.longitude
									};
								// make the instagramPhoto object
								var thisFlickrPhotoObject = {
									flickrPhotoId: currentFlickrPhoto.id,
									flickrPhotoSecret: currentFlickrPhoto.secret,
									flickrPhotoOriginalSecret: currentFlickrPhoto.originalsecret,
									owner: user,
									createdTime: currentFlickrPhoto.dateupload,
									urlFullSize: currentFlickrPhoto.url_o,
									urlThumbnail: currentFlickrPhoto.url_q,
									place: JSON.stringify(latAndLong),	// can't save an object to a string placeholder
									tags: currentFlickrPhoto.tags
								};
								// console.log("thisFlickrPhotoObject: ", thisFlickrPhotoObject);
								db.FlickrPhoto.findOneAndUpdate({flickrPhotoId: thisFlickrPhotoObject.flickrPhotoId}, thisFlickrPhotoObject, {upsert:true}, function(err, flickrphotodata){
									if(err){
										console.error("error with findOneAndUpdate in get /flickr/callback route", err);
									} else {
										console.log("successfully saved item to flickrphotos document");
									}
								}); // close db.FlickrPhoto.findOneAndUpdate
							} // close for loop
						} // close else
					}); // close db.User.findByIdAndUpdate
				}); // close inner request.get - call API to get all the photo data

		}); // close outer request.get - exchanging request token for access token


		// render a page with a button that lets the user go to the 'show' page
		db.User.findById(req.session.id, function(err, user){
			if(err){
				console.log(err);
				res.redirect("/500");
			} else {
				expressResponse.render("users/authFlickrGoToShow", {user:user});
			}
		});

	} // close first (outermost) else
});



app.get('/users/:user_id/landing/show/flickr', function(req, res){
	// connect to User db to grab user id
	db.User.findById(req.session.id, function(err, user){
		if (err){
			console.error("error with findById for User DB in get to /users/:user_id/landing/show/flickr route", err);
		} else {
			// connect to flickr photo db to find all photos for this user
			db.FlickrPhoto.find({owner:user}, function(err, flickrphotodata){
				if (err){
					console.error("error with FlickrPhoto.find() in get to /users/:user_id/landing/show/flickr route", err);
				} else {
					// console.log("all flickrphotodata for this user: ", flickrphotodata);
					// put all thumbnails into an array to pass to view
					var flickrThumbsArray = [];
					for (var i = 0; i < flickrphotodata.length; i++){
						var flickrThumbUrl = flickrphotodata[i].urlThumbnail;
						flickrThumbsArray.push(flickrThumbUrl);
					}
					res.render("users/landingFlickr", {flickrThumbsArray:flickrThumbsArray, user:user});
				} // close else
			}); // close db.FlickrPhoto.findOne
		} // close else
	}); // close db.User.findById
});



// ____________GROUPS____________

app.get("/group/new", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("groups/new", {user:user});
		}
	});
});

app.post("/group/new", function(req, res){

	var time = Date.now();
	var newGroup = {
		groupUrlName: req.body.groupUrl,
		groupDisplayName: req.body.groupName,
		groupCreatedTime: time,
		groupAdmin: req.session.id
	};
	console.log("post to /group/new for newGroup: ", newGroup);

	// create group in database
	db.Group.create(newGroup, function(errGroup, group){
		if(errGroup){
			console.log("error in post to new group, group db", errGroup);
			res.redirect("/500");
		} else {

			var user = {
				groupId: group,
				isGroupAdmin: true
			};

			// update the user's info
			db.User.findByIdAndUpdate(req.session.id, user, {upsert:true}, function(errUser, user){
				if(errUser){
					console.log("error in post to new group, user db", errUser);
					res.redirect("/500");
				} else {
					res.redirect("/group/" + group._id + "/addmembers");
				}
			});

		} // close else
	}); // close db.Group.create
});


app.get("/group/join", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("groups/join", {user:user});
		}
	});
});


// getgroup to show group new member form - from show page
app.get("/group/getgroup/new", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.redirect("/group/" + user.groupId + "/addmembers");
		}
	});
});

// form to invite new group members
app.get("/group/:group_id/addmembers", function(req, res){
	db.User.findById(req.session.id, function(errUser, user){
		if(errUser){
			console.log("errUser from /group/:group_id/addmembers with user db", errUser);
			res.redirect("/500");
		} else {

			// populate group data onto user so it's available on show page
			user.populate('groupId', function (errPop, userPop) {
				console.log("populating user in user edit page: >>> ", userPop);
			});

			res.render("groups/addMember", {user:user});	
		}
	});
});


// post from invite new group members form
app.post("/group/:group_id/addmembers", function(req, res){

// TO DO:
// add flash messaging on successful post

	// generate a token to use in the invitation
	var inviteToken;
	crypto.randomBytes(20, function(err, buffer) {
		inviteToken = buffer.toString('hex');
		console.log("generated inviteToken in /group/:group_id/addmembers ", inviteToken);
	});

	// add details to new user being invited
	var receipientEmail = req.body.groupInviteEmail;
	var newUser = {};
	newUser.groupInviteToken = inviteToken;
	newUser.groupId = req.params.group_id;
	newUser.email = receipientEmail;
	
	// get the current user to pass their name into the email body
	var invitingUserId = req.session.id;
	var invitingUser;
	db.User.findById(invitingUserId, function(err, userResult){
		if (err){
			console.log("problem with finding invitingUser in user db", err);
		} else {
			invitingUser = userResult;
		}
	});


	// save new user with invite token
	db.User.findOneAndUpdate({email:newUser.email}, newUser, {upsert:true}, function (errUser, user) {
		if (errUser) {
			console.log("error in post to /group/:group_id/addmembers in User db", errUser);
			res.redirect("/500");
		}
		// console.log("inside!!! user:", user);

			// configure e-mail data
			var mailOptions = {
			    from: "Everyone\'s Photos<lindsay@everyonesphotos.com>", // sender address
			    to: receipientEmail,
			    subject: "You've been invited to join a Family Group with Everyone\'s Photos ✉", // Subject line

			    // plaintext body
			    text: "Hello, \n \n " +
			    invitingUser.firstName + " " + invitingUser.lastName +
			    " has invited you to join their Family Group with the application " +
			    "Everyone's Photos.\n \n" + 
			    "Once you join the group, you can import photos from Facebook, Flickr, or Instagram, " +
			    "and then share these photos with anyone on the internet. You can get started by clicking " +
			    "on the following link:\n \n" +
			    "http://" + domain + "/joingroupfromemail/" + req.params.group_id+ "/" + inviteToken +  "\n \n" +
			    "<p>~ The Team at Everyone's Photos<p>",

			    // html body
			    html: "<p>Hello,</p>" + 
			     "<p>" + invitingUser.firstName + " " + invitingUser.lastName +
			   	" has invited you to join their Family Group with the application " + 
			    "Everyone's Photos.</p>" + 
			    "<p>Once you join the group, you can import photos from Facebook, Flickr, or Instagram, " +
			    "and then share these photos with anyone on the internet. You can get started by clicking " +
			    "on the following link:</p>" +
			    "<p>http://" + domain + "/joingroupfromemail/" + req.params.group_id+ "/" + inviteToken +  "</p>" +
			    "<p>~ The Team at Everyone's Photos<p>"
			};

			// send password reset email to user
			transporter.sendMail(mailOptions, function(error, info){
			    if (error) {
			        console.log("error with transporter.sendMail in /addMembers post route", error);
			        res.redirect("/group/getgroup/new");
			    } else {

			    	// saving again...because it's not getting attached before saving the first time :(
			    	var thisuser = {
			    		groupInviteToken: inviteToken
			    	};
					db.User.findOneAndUpdate({email:newUser.email}, thisuser, {upsert:true}, function(){
						console.log("inside second saving of user with invite token, ", thisuser);
					});

// TO DO:
// flash confirmation to user
			        console.log('Message sent: ' + info.response);
			        res.redirect("/users/"+ req.session.id + "/myaccount");

			    }
			}); // close transporter.sendMail


	}); // close db.User.findOne

});



// getgroup to show group edit - from show page
app.get("/group/getgroup/edit", function(req, res){
	db.User.findById(req.session.id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.redirect("/group/" + user.groupId + "/edit");
		}
	});
});


// edit details for a group - name and url only
app.get("/group/:group_id/edit", function(req, res){
	db.Group.findById(req.params.group_id, function(errGroup, group){
		if(errGroup){
			console.log("errGroup from /group/:group_id/edit with group db", errGroup);
			res.redirect("/500");
		} else {
			db.User.findById(req.session.id, function(errUser, user){
				if(errUser){
					console.log("errUser from /group/:group_id/edit with user db", errUser);
					res.redirect("/500");
				} else {
					res.render("groups/edit", {group:group, user:user});	
				}
			});
		} // close else
	}); // close db.Group.findById
});



// user joins group from email invite
app.get("/joingroupfromemail/:group_id/:invite_token", function(req, res){
	// pass the token from the requesting url into the page as data, to save in a hidden field
	var inviteToken = req.params.invite_token;
	console.log("** get /joingroupfromemail path, one - inviteToken >> ", inviteToken);
	db.User.findOne({groupInviteToken:inviteToken}, function(err, user) {
		if (!user) {
// TO DO:
// flash message token is invalid
			// req.flash('error', 'Password reset token is invalid or has expired.');
			res.redirect('/index');
		} else {
    		// show the join group form
    		console.log("user inside get /joingroupfromemail path: ", user);
    		console.log("** get /joingroupfromemail path, two - inviteToken >> ", inviteToken);
			res.render("groups/joingroup", {user:user, req:req, inviteToken:inviteToken});
    	}
	});
});


app.post("/joingroup/:invite_token/signup", function(req, res){
	var newUser = {
		password: req.body.userPass
	};

	db.User.findOneAndUpdate({groupInviteToken:req.params.invite_token}, newUser, {upsert:true}, function(err, user){
		if (err){
			console.log("error posting to /joingroup in user db ", err);
		} else {
			req.login(user); // set the session id for this user to be the user's id from our DB
			res.redirect("/users/" + user._id + "/myaccount");
		}
	});
});


// render a group's public page
app.get("/groups/:group_name", function(req, res){
	var everyonesPhotosArray = [];
	var promisesArray = [];
	var groupDisplayName;

	db.Group.findOne({groupUrlName:req.params.group_name}).exec()
		.then(function(groupResponse){
		console.log("groupResponse >>> ", groupResponse);
		// need to pass in group name / group id, so that the navbar on the group's page will load
		groupDisplayName = groupResponse.groupDisplayName;
		return db.User.find({groupId:groupResponse}).exec();
	}).then(function(allUsersResponse){
		console.log("allUsersResponse >>> ", allUsersResponse);
		console.log("length of allUsersResponse >>> ", allUsersResponse.length);

		var allPromisesArray = [allUsersResponse];
		for (var i = 0; i < allUsersResponse.length; i++){
			var eachUser = allUsersResponse[i];

			var instagramPromise = db.InstagramPhoto.find({owner:eachUser}).exec();
			allPromisesArray.push(instagramPromise);
			console.log("pushing from instagram into allPromisesArray");

			var flickrPromise = db.FlickrPhoto.find({owner:eachUser}).exec();
			allPromisesArray.push(flickrPromise);
			console.log("pushing from flickr into allPromisesArray");

			var facebookPromise = db.FacebookPhoto.find({owner:eachUser}).exec();
			allPromisesArray.push(facebookPromise);
			console.log("pushing from facebook into allPromisesArray");

		}
		// console.log()
		return when.all(allPromisesArray);

	}).then(function(allPromiseResponses){
		console.log("allPromiseResponses >>> ", allPromiseResponses);
		// console.log("looking for first name >>>", allPromiseResponses[0][0].firstName);
		res.render("groups/customGroupAllPhotos", {allPromiseResponses:allPromiseResponses, groupDisplayName:groupDisplayName});
	});

}); // close app.get





// ____________ERRORS____________

// if user declines to authorize an application
app.get("/nope", function(req, res){
	db.User.findById(req.params.user_id, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/500");
		} else {
			res.render("errors/nope", {user:user, req:req});
		}
	});
});

// 500 page
app.get("/500", function(req, res){
	console.log("in the /errors/500 - oopsie route");
	res.render("errors/500", {req:req});
});

// FALLBACK ROUTE
app.get("*", function(req, res){
	res.render("errors/404", {req:req});
});



//***** START SERVER *****
app.listen(process.env.PORT || 3000, function(){
	console.log("Server starting on port: 3000");
});


