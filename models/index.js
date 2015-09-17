//***** DATABASE SEED DATA *****

// include .env variables
// require('dotenv').load();

// pg module - lets us talk to our postgres database
var pg = require("pg");

// tell it where our database is
var connectionString = process.env.HEROKU_POSTGRESQL_NAVY_URL || "postgres://localhost:5432/family_photos";

// connect to database using express methods with pg module
// http://expressjs.com/guide/database-integration.html#postgres
pg.connect(databaseConnectionLocation, function(err, client, done){

	if(err){
		return console.error("error connecting to database, before all routes", err);
	}

	client.query("DROP TABLE test_photos", function(err, result){
		done();
		if(err){
			return console.error("error dropping table test_photos", err);
		}
	});

	client.query("CREATE TABLE test_photos (id SERIAL PRIMARY KEY, photo_owner TEXT, photo_url TEXT, height INTEGER, width INTEGER, alt_text TEXT)", function(err, result){
		done();
		if(err){
			return console.error("error creating table test_photos", err);
		}
	});

	client.query("INSERT INTO test_photos (photo_owner, photo_url) VALUES ('Lindsay Owner', 'https://fbcdn-photos-a-a.akamaihd.net/hphotos-ak-xpt1/v/t1.0-0/s130x130/12032164_10153658867316060_7448683016975595427_n.jpg?oh=afaa50e4af641a2b170a95d174312934&oe=56A2B9FB&__gda__=1449993241_f900242df4178de4be1ddc52da196eaf')", function(err, result){
		done();
		if(err){
			return console.error("error inserting into table test_photos", err);
		}
	});

	client.query("INSERT INTO test_photos (photo_owner, photo_url) VALUES ('Lindsay Owner', 'https://fbcdn-photos-c-a.akamaihd.net/hphotos-ak-xlf1/v/t1.0-0/s130x130/12002045_10153658867111060_6028797209844214191_n.jpg?oh=3437b81d006add75e549c09e2eabdf11&oe=56625B27&__gda__=1449777339_90e7441d3a18a514054a32077e683816')", function(err, result){
		done();
		if(err){
			return console.error("error inserting into table test_photos", err);
		}
	});

	client.query("INSERT INTO test_photos (photo_owner, photo_url) VALUES ('Lindsay Owner', 'https://scontent.xx.fbcdn.net/hphotos-xta1/v/t1.0-9/10300684_10153215492596060_4167049021788748131_n.jpg?oh=7a11aec3aac9ff15dae56351296e6420&oe=56A8723F')", function(err, result){
		done();
		if(err){
			return console.error("error inserting into table test_photos", err);
		}
	});

	client.query("INSERT INTO test_photos (photo_owner, photo_url) VALUES ('Lindsay Owner', 'https://scontent.xx.fbcdn.net/hphotos-xpl1/t31.0-8/11958197_10153658863746060_7297837500229249079_o.jpg')", function(err, result){
		done();
		if(err){
			return console.error("error inserting into table test_photos", err);
		}
	});


});

