var mongoose = require("mongoose");
require('dotenv').load();

mongoose.connect("mongodb://localhost/family_photos_app" || process.env.MONGOLAB_URI);

mongoose.set("debug", true);

module.exports.Group = require("./group");
module.exports.User = require("./user");
module.exports.FacebookPhoto = require("./facebookPhotos");
module.exports.InstagramPhoto = require("./instagramPhotos");





// // //***** DATABASE SEED DATA *****

// // include .env variables
// // require('dotenv').load();

// // pg module - lets us talk to our postgres database
// var pg = require("pg");

// // tell it where our database is
// var databaseConnectionLocation = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";

// // connect to database using express methods with pg module
// // http://expressjs.com/guide/database-integration.html#postgres
// pg.connect(databaseConnectionLocation, function(err, client, done){

// 	if(err){
// 		return console.error("error connecting to database, from models folder index.js", err);
// 	}



// // TO FIX: remove these before production & figure out how to create tables JUST ONCE
// // was getting an error when running this without dropping the tables first
// // ask a teacher
// // ***************************************

// 	// remove myapp_users table if it exists
// 	client.query("DROP TABLE myapp_users", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error dropping table myapp_users", err);
// 		} else {
// 			console.log("dropped myapp_users table");
// 		}
// 	});

// 	// remove facebook_photos table if it exists
// 	client.query("DROP TABLE facebook_photos", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error dropping table facebook_photos", err);
// 		} else {
// 			console.log("dropped facebook_photos table");
// 		}
// 	});

// 	// remove instagram_photos table if it exists
// 	client.query("DROP TABLE instagram_photos", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error dropping table instagram_photos", err);
// 		} else {
// 			console.log("dropped instagram_photos table");
// 		}
// 	});

// // ***************************************
// // ^^^^ remove these before production



// 	// create a myapp_users table
// 	// this acts as the JOIN table because it contains all of the API ids in addition to my app's serial key 
// 	client.query("CREATE TABLE myapp_users (user_id SERIAL PRIMARY KEY, " + 
// 											"user_email TEXT, " +
// 											"username_first TEXT, " +
// 											"username_last TEXT, " +
// 											"myapp_group_name TEXT, " +
// 											"facebook_user_id TEXT, " +
// 											"facebook_access_token TEXT, " +
// 											"facebook_login_status BOOLEAN, " +
// 											"instagram_user_id TEXT, " +
// 											"instagram_access_token TEXT, " +
// 											"shutterfly_user_id TEXT, " +
// 											"shutterfly_access_token TEXT, " +
// 											"snapfish_user_id TEXT, " +
// 											"snapfish_access_token TEXT " +
// 											")", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error creating table myapp_users", err);
// 		}
// 	});


// 	// create a facebook_photos table
// 	client.query("CREATE TABLE facebook_photos (facebook_user_id TEXT, " +
// 												"fb_photo_id TEXT, " +
// 												"fb_photo_created_time TEXT, " +
// 												"fb_photo_album TEXT, " +	// object/array containing data about the place
// 												"fb_photo_url_full_size TEXT, " + // object containing url, height & width
// 												"fb_photo_thumbnail TEXT, " + // just a string of the URL
// 												"fb_photo_place TEXT, " + // object/array containing data about the place
// 												"fb_photo_tags TEXT " +  // object/array containing data about other people tagged in photo
// 												")", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error creating table facebook_photos", err);
// 		}
// 	});


// 	// create an instagram_photos table
// 	client.query("CREATE TABLE instagram_photos (insta_user_id TEXT, " +
// 												"insta_photo_id TEXT, " +
// 												"insta_photo_created_time TEXT, " +
// 												"insta_photo_url_full_size TEXT, " + // object containing url, height & width
// 												"insta_photo_thumbnail TEXT, " + // object containing url, height & width
// 												"insta_photo_place TEXT, " + // ??? unsure of format since my photos don't contain location info
// 												"insta_photo_tags TEXT " +  // object/array containing data about other people tagged in photo
// 												")", function(err, result){
// 		done();
// 		if(err){
// 			return console.error("error creating table instagram_photos", err);
// 		}
// 	});


// });

