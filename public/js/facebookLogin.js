//***** FACEBOOK API login & authorization *****
// for reference: https://developers.facebook.com/docs/facebook-login/web

// execute everything in this js file when document is ready
$(document).ready(function() {


// Load the Facebook SDK asynchronously
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


// initialize the Facebook SDK 
	/// and call getLoginStatus ???
window.fbAsyncInit = function() {
	FB.init({
		appId      : '1171727296190425',
		cookie     : true,  // enable cookies to allow the server to access the session
		xfbml      : true,  // parse social plugins on this page
		version    : 'v2.2' // use version 2.2
	});
	// Now that we've initialized the JavaScript SDK, we call 
	// FB.getLoginStatus().  This function gets the state of the
	// person visiting this page and can return one of three states to
	// the callback you provide.  They can be:
			// 1. Logged into your app ('connected')
			// 2. Logged into Facebook, but not your app ('not_authorized')
			// 3. Not logged into Facebook and can't tell if they are logged into your app or not.
	// These three cases are handled in the callback function.

	FB.getLoginStatus(function(response) {
		statusChangeCallback(response);
	});

};


// on click button with id=lindsayFBbutton, call the FB.login method, call sendFbAccessTokenToServer()
$("#lindsayFBbutton").click(function(){
	FB.login(function(response) {
		if (response.authResponse) {
			console.log('Welcome!  Fetching your information.... ');
			console.log("access token: ", response.authResponse.accessToken);

			// need to send this access token to my server
			// and also verify again that the app id & user id match the token, server side
			sendFbAccessTokenToServer(response.authResponse.accessToken);


			FB.api('/me', function(response) {
				console.log('Good to see you, ' + response.name + '.');
			});
		} else {
			console.log('User cancelled login or did not fully authorize.');
	   }
	}, {scope: 'public_profile,user_photos'});
});


// // using jquery, send the JSON to my server, so my server can save it in my database
// function sendFbAccessTokenToServer(fbAcessToken){
// 	$.ajax({
// 		url: "/facebookLogin",
// 		method: "POST",
// 		data: fbAcessToken,
// 		contentType: "json"
// 	})
// 	.done(function(userPhotoData){
// 		console.log("successful ajax post request");
// 		console.log("ajax 'data' is...");
// 		$("#fbLoginResult").append("<span>successful login to FB</span>");
// 		$("#fbLoginResult").append("<span>" + userPhotoData + "</span>");
// 	})
// 	.fail(function(jqXHR){
// 		console.log("error/xhr from ajax request: ", jqXHR.status);
// 	});
// }
	





// This function is called when someone finishes with the Login Button.
// See the onlogin handler attached to it in the sample code below.
function checkLoginState() {
	FB.getLoginStatus(function(response) {
		statusChangeCallback(response);
	});
}


// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
	console.log('statusChangeCallback');
	console.log(response);
	// The response object is returned with a status field that lets the
	// app know the current login status of the person.
	// Full docs on the response object can be found in the documentation
	// for FB.getLoginStatus().
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		testAPI();
		getPhotosAPI();
	} else if (response.status === 'not_authorized') {
		// The person is logged into Facebook, but not your app.
		document.getElementById('status').innerHTML = 'Please log into this app.';
	} else {
		// The person is not logged into Facebook, so we're not sure if
		// they are logged into this app or not.
		document.getElementById('status').innerHTML = 'Please log into Facebook.';
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



// I added this :)
// make a request to the facebook graph API for photo data
function getPhotosAPI(){

	var userPhotoData;

	FB.api("/me/photos", {fields: "picture, images", limit: 200}, function (response) {
	    	if (response && !response.error){
	    		// console.log("response data? ", response.data[50].images[0].source);
	    		// console.log(response);
	    		// var data = "hello some test data";

	    		// convert data into JSON for readability
	    		// var userPhotoData = JSON.stringify(response);
	    		// var userPhotoData = response;
	    		// userPhotoData = {
	    		// 	id: "Lindsay",
	    		// 	other: "Stephanie"
	    		// };
	    		// console.log("userPhotoData......", userPhotoData);
	    		sendFbUserData(response);

	    		// display the data in the page div with id "facebookPhotoData"
	    		// document.getElementById('facebookPhotoData').innerHTML = userPhotoData;

	    	}
	    }
	);

}


// using jquery, send the JSON to my server, so my server can save it in my database
function sendFbUserData(fbUserData){
	var userPhotoData = JSON.stringify(fbUserData);
	$.ajax({
		url: "/facebookLogin",
		method: "POST",
		data: userPhotoData,
		contentType: "json"
	})
	.done(function(userPhotoData){
		console.log("successful ajax post request");
		console.log("ajax 'data' is...");
		$("#fbLoginResult").append("<span>successful login to FB</span>");
		$("#fbLoginResult").append("<span>" + userPhotoData + "</span>");
	})
	.fail(function(jqXHR){
		console.log("error/xhr from ajax request: ", jqXHR.status);
	});
}




}); // close document.ready
  	
