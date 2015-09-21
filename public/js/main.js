var app = angular.module("familyPhotoAlbumApp", ['ngRoute']);
	
app.config(function($routeProvider){
	$routeProvider
	.when('/', {
		templateUrl: 'partials/home.html',
		controller: 'BaseController'
	})
	// .when('/search/:params', {
	// 	templateUrl: 'partials/searchResults.html',
	// 	controller: 'SearchController'
	// })
	// .when('/show/:params', {
	// 	templateUrl: 'partials/showMovie.html',
	// 	controller: 'ShowMovieDetailsController'
	// })
	.otherwise({ redirectTo: '/' })  // catch-all route for any URLs not specified here in my routing
});
