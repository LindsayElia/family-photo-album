//***** DATABASE SEED DATA *****

// include .env variables
// require('dotenv').load();

// pg module - lets us talk to our postgres database
var pg = require("pg");

// tell it where our database is
var databaseConnectionLocation = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";

// connect to database using express methods with pg module
// http://expressjs.com/guide/database-integration.html#postgres
pg.connect(databaseConnectionLocation, function(err, client, done){

	if(err){
		return console.error("error connecting to database, from models folder index.js", err);
	}



// I should remove these before production
// ***************************************

	// remove myapp_users table if it exists
	client.query("DROP TABLE myapp_users", function(err, result){
		done();
		if(err){
			return console.error("error dropping table myapp_users", err);
		} else {
			console.log("dropped myapp_users table");
		}
	});

	// // remove facebook_photos table if it exists
	client.query("DROP TABLE facebook_photos", function(err, result){
		done();
		if(err){
			return console.error("error dropping table facebook_photos", err);
		} else {
			console.log("dropped facebook_photos table");
		}
	});

// ***************************************
// I should remove these before production



	// create a myapp_users table
	client.query("CREATE TABLE myapp_users (user_id SERIAL PRIMARY KEY, " + 
											"user_email TEXT, " +
											"username_first TEXT, " +
											"username_last TEXT, " +
											"myapp_group_name TEXT, " +
											"facebook_user_id TEXT, " +
											"facebook_access_token TEXT, " +
											"facebook_login_status BOOLEAN, " +
											"instagram_user_id TEXT, " +
											"instagram_access_token TEXT, " +
											"shutterfly_user_id TEXT, " +
											"shutterfly_access_token TEXT, " +
											"snapfish_user_id TEXT, " +
											"snapfish_access_token TEXT " +
											")", function(err, result){
		done();
		if(err){
			return console.error("error creating table myapp_users", err);
		}
	});


	// create a facebook_photos table
	client.query("CREATE TABLE facebook_photos (facebook_user_id TEXT, " +
												"fb_photo_id TEXT, " +
												"fb_created_time TEXT, " +
												"fb_photo_album TEXT, " +
												"fb_photo_url_full_size TEXT, " + // string containing json format data with url, height & width
												"fb_photo_thumbnail TEXT, " +
												"fb_photo_place TEXT, " + // string containing json format data about the place
												"fb_photo_tags TEXT " +  // string containing json format data about other people tagged in photo
												")", function(err, result){
		done();
		if(err){
			return console.error("error creating table facebook_photos", err);
		}
	});


});

