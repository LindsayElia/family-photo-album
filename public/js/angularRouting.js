var app = angular.module("familyPhotoAlbumApp", ['ngRoute']);

// app.config(function($routeProvider, $locationProvider){
// // custom routes would go in here
// });

app.config(function($routeProvider){
	$routeProvider
	.when('/', {
		templateUrl: 'partials/home.html',
		controller: 'BaseController'
	})
	.when('/landing/facebook', {
		templateUrl: 'users/landingFacebook.ejs',
		controller: 'FacebookPhotoPreviewAll'
	})
	.when('/users/:user_id/myaccount', {
		templateUrl: 'users/show.ejs',
		controller: 'FacebookPhotoPreviewAll'
	})
	// .when('/show/:params', {
	// 	templateUrl: 'partials/showMovie.html',
	// 	controller: 'ShowMovieDetailsController'
	// })
	.otherwise({ redirectTo: '/' })  // catch-all route for any URLs not specified here in my routing
});
