var players = require('./controllers/playerController.js');
var games = require('./controllers/gameController.js');
var chess = require('./controllers/chessGameController.js');
var Users = require('./models/user.js');

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', {
			message : req.flash('loginMessage')
		});
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true
	// allow flash messages
	}));

	// process the login form
	// app.post('/login', do all our passport stuff here);

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', {
			message : req.flash('signupMessage')
		});
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true
	// allow flash messages
	}));

	// process the signup form
	// app.post('/signup', do all our passport stuff here);

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		// get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// =====================================
	// FACEBOOK ROUTES =====================
	// =====================================
	// route for facebook authentication and login
	app.get('/auth/facebook', passport.authenticate('facebook', {
		scope : 'email'
	}));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect : '/profile',
		failureRedirect : '/'
	}));

	// locally --------------------------------
	app.get('/connect/local', function(req, res) {
		res.render('connect-local.ejs', {
			message : req.flash('loginMessage')
		});
	});
	app.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
		failureFlash : true
	// allow flash messages
	}));

	// facebook -------------------------------

	// send to facebook to do the authentication
	app.get('/connect/facebook', passport.authorize('facebook', {
		scope : 'email'
	}));

	// handle the callback after facebook has authorized the user
	app.get('/connect/facebook/callback', passport.authorize('facebook', {
		successRedirect : '/profile',
		failureRedirect : '/'
	}));

	// =============================================================================
	// UNLINK ACCOUNTS =============================================================
	// =============================================================================
	// used to unlink accounts. for social accounts, just remove the token
	// for local account, remove email and password
	// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', function(req, res) {
		var user = req.user;
		user.local.email = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', function(req, res) {
		var user = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	app.get('/games', function(req, res) {
		games.list(function(games) {
			res.render('games.ejs', {
				games : games
			});
		});
	});

	app.get('/games/create', function(req, res) {
		res.render('game-create.ejs', {
			games : games
		});
	});

	app.post('/games/create', function(req, res) {
		if (req.user.player) {
			games.create(req.user.player, function(game) {
				res.redirect('/games');
			});
		} else {
			res.send(400);
		}
	});

	app.get('/chess', function(req, res) {
		console.log("chess");
		res.render('war/chess.ejs', {
			gameid : req.query.gameid,
			playerid : req.query.playerid
		});
	});

	app.get('/player/all', players.list);
	app.get('/player/:pseudo', players.find);
	app.get('/player/:pseudo/remove', players.remove);
	app.get('/player/:pseudo/create', players.create);
	app.get('/player/:pseudo/games', games.findByPlayer);
	//app.get('/game/all', games.list);
	app.get('/game/create/:pseudo', games.create);
	app.get('/game/open', games.findOpen);
	app.get('/game/connect/:gameid/:pseudo', games.connect);
	app.get('/game/moves/:gameid', chess.moves);
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		return next();
	}

	// if they aren't redirect them to the home page
	res.redirect('/');
}