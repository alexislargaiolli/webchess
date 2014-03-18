var Player = require('../models/player.js');
var Game = require('../models/game.js');
var Move = require('../models/move.js');

function RunningGame(gameId, creator, opponent, creatorId, opponentId) {
	this.gameId = gameId;
	this.creator = creator;
	this.creatorId = creatorId;
	this.opponent = opponent;
	this.opponentId = opponentId;
}

var runningGames = {};

exports.RunningGames = runningGames;

exports.reveive = function(data, connection) {
	if (data.type === 'auth') {
		this.auth(data.gameid, data.playerid, connection);
	} else if (data.type === 'move') {
		this.move(data);
	}
};

exports.auth = function(gameId, playerId, connection) {
	Game.findOne({
		_id : gameId,
		$or : [ {
			creator : playerId
		}, {
			opponent : playerId
		} ]
	}, function(err, game) {
		if (err) {
			connection.sendUTF(JSON.stringify({
				type : 'auth-response',
				auth : 0,
				gameid : null,
				creator : null,
				opponent : null
			}));
		}
		var id = (String(gameId));
		if (runningGames[id]) {
			if (playerId === (String(game.creator))) {
				runningGames[id].creator = connection;
			} else {
				runningGames[id].opponent = connection;
			}
		} else {
			if (playerId === (String(game.creator))) {
				var r = new RunningGame(id, connection, null, (String(game.creator)), (String(game.opponent)));
				runningGames[id] = r;
			} else {
				var r2 = new RunningGame(id, null, connection, (String(game.creator)), (String(game.opponent)));
				runningGames[id] = r2;
			}
		}
		connection.sendUTF(JSON.stringify({
			type : 'auth-response',
			auth : 1,
			gameid : game._id,
			creator : game.creator,
			opponent : game.opponent
		}));
	});
};

exports.move = function(data) {
	var runningGame = runningGames[data.gameId];
	if (runningGame) {
		if (runningGame.creatorId === data.playerId) {
			runningGame.opponent.sendUTF(JSON.stringify(data));
		} else if (runningGame.opponentId === data.playerId) {
			runningGame.creator.sendUTF(JSON.stringify(data));
		}
	}
	new Move({
		index : data.index,
		start : data.start,
		end : data.end,
		promote : data.promote,
		game : data.gameId,
		player : data.playerId
	}).save();
};

exports.moves = function(req, res) {
	Move.find({
		game : req.params.gameid
	}, function(err, moves) {
		res.send(moves);
	});
};