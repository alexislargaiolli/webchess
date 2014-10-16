var players = require('./playerController.js');
var Player = require('../models/player.js');
var Game = require('../models/game.js');

exports.list = function(callback) {
	Game.find().populate('creator').exec(function(err, games) {
		callback(games);
	});
};

exports.create = function(playerid, callback) {
	Player.findOne({
		pseudo : playerid
	}, function(error, player) {
		if (error) {
			throw error;
		}
		var game = new Game({
			creator : playerid,
			opponent : null,
			state : 1
		}).save();
		callback(game);
	});
};

exports.connect = function(req, res) {
	var p = Player.findOne({
		pseudo : req.params.pseudo
	}, function(error, player) {
		if (error) {
			throw error;
		}
		Game.findOne({
			_id : req.params.gameid
		}, function(err, game) {
			if (err) {
				res.send('Game not found');
			}
			if (game.opponent === null) {
				Game.update({
					_id : req.params.gameid
				}, {
					opponent : player._id,
					state : 2
				}, function(err) {
					if (err) {
						throw err;
					}
					res.send('Connected');
				});
			} else {
				res.send('Game full');
			}
		});
	});
};

exports.findOpen = function(callback) {
	Game.find({
		state : 1
	}, function(err, games) {
		if (err) {
			throw err;
		}
		callback(games);
	});
};

exports.findByPlayer = function(playerId, callback) {
	Game.find({
		$or : [ {
			creator : playerId
		}, {
			opponent : playerId
		} ]
	}).populate('creator').exec(function(err, games) {
		if (err) {
			throw err;
		}
		callback(games);
	});
};

exports.findExceptPlayer = function(playerId, callback) {
	Game.find({
		$and : [ {
			creator : {
				$ne : playerId
			}
		}, {
			state : 1
		} ]
	}).populate('creator').exec(function(err, games) {
		if (err) {
			throw err;
		}
		callback(games);
	});
};