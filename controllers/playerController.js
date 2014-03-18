var Player = require('../models/player.js');

exports.create = function(req, res) {
	new Player({
		pseudo : req.params.pseudo
	}).save();
	res.send(req.params.pseudo + ' créé');
};

exports.remove = function(req, res) {
	Player.remove({
		pseudo : req.params.pseudo
	}, function(err) {
		if (err) {
			throw err;
		}
		console.log('Player deleted');
		res.send(req.params.pseudo + ' supprimé');
	});
};

exports.list = function(req, res) {
	Player.find(function(err, players) {
		res.send(players);
	});
};

exports.find = function(req, res) {
	Player.findOne({
		pseudo : req.params.pseudo
	}, function(error, player) {
		res.send(player);
	});
};