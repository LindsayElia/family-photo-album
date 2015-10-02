//***** FACEBOOK API login & authorization *****
// for reference: 
// https://developers.facebook.com/docs/facebook-login/web
// https://developers.facebook.com/docs/javascript/examples#login
// https://developers.facebook.com/docs/facebook-login/permissions/#reference

console.log("hello from faceobook frontend js file");

// initialize the Facebook SDK 
// https://developers.facebook.com/docs/javascript/quickstart/v2.4
window.fbAsyncInit = function() {
	FB.init({
		appId      : '1171727296190425',
		cookie     : true,  // enable cookies to allow the server to access the session
		xfbml      : true,  // parse social plugins on this page
		version    : 'v2.4' 
	});
};

// Load the Facebook SDK asynchronously
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


// wrap the call to the FB button in a document ready so it can find the button id
$(document).ready(function(){
	$("#goToFacebookLanding").hide();
	// execute FB API calls when the facebook button is clicked
	$("#facebookAuthButton").on("click", function() {
		console.log("facebookAuthButton button clicked");

		// This function gets the state of the
		// person visiting this page and can return one of three states to
		// the callback you provide.  They can be:
				// 1. Logged into your app ('connected')
				// 2. Logged into Facebook, but not your app ('not_authorized')
				// 3. Not logged into Facebook and can't tell if they are logged into your app or not.
		// These three cases are handled in the callback function.
		FB.getLoginStatus(function(response) {
			statusChangeCallback(response);
		});
	}); // close click handler
}); // close document.ready


// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
	console.log('statusChangeCallback response: ', response);
	// The response object is returned with a status field that lets the
	// app know the current login status of the person.
	// Full docs on the response object can be found in the documentation
	// for FB.getLoginStatus().
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		console.log("already logged in, getting data from API");
		testAPI();
		getPhotosAPI();
	} else if (response.status === 'not_authorized') {
		FB.login(function(){}, {
			scope: 'user_photos'
		});
		console.log("logging user in for first time");
		testAPI();
		getPhotosAPI();
	}
}


// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
function testAPI() {
	console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
    	console.log('Successful login for: ' + response.name);
    	document.getElementById('status').innerHTML =
        	'Thanks for logging in, ' + response.name + '!';
    });
}



// I added everthing below this :)

// make a request to the facebook graph API for photo data
// call the function to send data to my server
function getPhotosAPI(){

	var fb_user_id;

	// // get user's facebook user id
	FB.api(
		'/me/',
		'GET',
		{"fields":"id"},
		function(response) {
			fb_user_id = response.id;
		}
	);

	// console.log("my fb_user_id: ", fb_user_id);

	// currently limiting to 50 photos...too much data won't send successfully to my server
	// apparently 100 is too many for a single request
	// only getting type=uploaded to make sure the user owns those photos
	FB.api(
		'/me/photos',
		'GET',
		{"fields":"album,created_time,id,images,place,tags,picture","type":"uploaded","limit":"50"}, 
		function (response) {
	    	if (response && !response.error){
	    		console.log("response data: ", response);
	    		// clean up the data before I send it to my server
	    		var photoDataArray = [];
	    		for (var i = 0; i < response.data.length; i++){
	    			var thisImage = response.data[i];
	    			// if can_delete is set to false, do not save photo
	    			// because photo does not belong to this person
	    			if (thisImage.can_delete === false){
	    				// do nothing
	    				console.log("skipping an image");
	    			} else {
	    				var photoDataObject = {
	    					fb_user_id : fb_user_id,
	    					fb_photo_id : thisImage.id,
	    					fb_photo_created_time : thisImage.created_time,
	    					fb_photo_album : thisImage.album,
	    					fb_photo_url_full_size : thisImage.images[0],
	    					fb_photo_thumbnail : thisImage.picture,
	    					fb_photo_place : thisImage.place,
	    					fb_photo_tags : thisImage.tags
	    				};
	    				photoDataArray.push(photoDataObject);
	    			}
	    		}
	    		console.log("data i'm sending to my server: ", photoDataArray);
	    		// send the data to my server
	    		sendFbUserData(photoDataArray);

// note - this is asynchronous
// if there is an issue with this, I could create an Angular service
// see https://developers.facebook.com/docs/javascript/howto/angularjs for more info

	    	} else {
	    		console.log("problem getting facebook photo data: ", response.error);
	    	}
	});
}


// using jquery, send the JSON to my server, so my server can save it in my database
function sendFbUserData(fbUserData){
	// convert to JSON for travel
	var dataToSend = JSON.stringify(fbUserData);
	
	$.post("/landing/facebook",{data: dataToSend})
		.done(function(data){
			console.log("successful ajax post request data is: ", data);
			
			// redirect the user to the landing page
			redirectToFbLanding();
		})
		.fail(function(jqXHR){
			console.log("error/xhr from ajax request: ", jqXHR.status);
			console.log("error/xhr from ajax request: ", jqXHR);
		});
}


// need to pass in user_id...

// this redirects the user to the landing page when called
function redirectToFbLanding() {
	$("#goToFacebookLanding").show();
	$("#facebookAuthButton").hide();
}






 
