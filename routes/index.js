/*
 * GET home page.
 */

var Game = require('../models/game.js');
var Player = require('../models/player.js');

exports.index = function(req, res) {
	res.render('index', {
		title : 'Express'
	});
};

exports.games = function(req, res) {
	Game.find(function(err, games) {
		res.render('games', {
			games : games
		});
	});
};