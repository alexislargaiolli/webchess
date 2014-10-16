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
	} else if (data.type === 'synch') {
		this.synch(data.gameId, data.playerId);
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
		if (err || game === null) {
			connection.sendUTF(JSON.stringify({
				type : 'auth-response',
				auth : 0,
				gameid : null,
				creator : null,
				opponent : null
			}));
		}
		var id = (String(gameId));
		console.log('Game auth - ' + (String(gameId)));
		if (runningGames[id]) {
			if (playerId === (String(game.creator))) {
				console.log('Creator join - ' + (String(game.creator)));
				runningGames[id].creator = connection;
			} else {
				console.log('Opponent join - ' + (String(game.opponent)));
				runningGames[id].opponent = connection;
			}
		} else {
			if (playerId === (String(game.creator))) {
				console.log('Creator open - ' + (String(game.creator)));
				var r = new RunningGame(id, connection, null, (String(game.creator)), (String(game.opponent)));
				runningGames[id] = r;
			} else {
				console.log('Opponent open - ' + (String(game.opponent)));
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
	console.log("Receive move - " + data.gameId);
	if (runningGame) {
		if (runningGame.creatorId === data.playerId) {
			console.log("Creator move - " + data.playerId);
			if (runningGame.opponent !== null) {
				runningGame.opponent.sendUTF(JSON.stringify(data));
			}
		} else if (runningGame.opponentId === data.playerId) {
			console.log("opponent move - " + data.playerId);
			if (runningGame.creator !== null) {
				runningGame.creator.sendUTF(JSON.stringify(data));
			}
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

exports.getMove = function(gameid, index, callback) {
	Move.findOne({
		game : gameid,
		index : index
	}, function(err, move) {
		callback(move);
	});
};

exports.putMove = function(index, start, end, promote, gameId, playerId) {
	var move = new Move({
		index : index,
		start : start,
		end : end,
		promote : promote,
		game : gameId,
		player : playerId
	}).save();

	//Search for running game
	var runningGame = runningGames[gameId];
	if (runningGame) {
		//Send update message to the other player
		if (runningGame.creatorId === playerId) {
			console.log("Creator move - " + playerId);
			if (runningGame.opponent !== null) {
				runningGame.opponent.sendUTF('UPDATE');
			}
		} else if (runningGame.opponentId === playerId) {
			console.log("opponent move - " + playerId);
			if (runningGame.creator !== null) {
				runningGame.creator.sendUTF('UPDATE');
			}
		}
	}
};

exports.synch = function(gameId, playerId) {
	console.log('synch() game: '+gameId + ' - player: '+playerId);
	this.moves(gameId, function(moves) {
		connection(gameId, playerId, function(co) {
			if (co !== null) {
				console.log('synch() connection found');
				for ( var m in moves) {
					var move = moves[m];
					console.log('send move ' + move);
					co.sendUTF(JSON.stringify({
						type : 'move',
						index : move.index,
						start : move.start,
						end : move.end,
						promote : move.promote,
						playerId : move.player,
						gameId : move.game
					}));
				}
				console.log('synch over');
				co.sendUTF(JSON.stringify({
					type : 'synch',
					status : 2
				}));
			}
		});
	});
};

var connection = function(gameId, playerId, callback) {
	console.log('connection() game: '+gameId + ' - player: '+playerId);
	var runningGame = runningGames[gameId];
	if (runningGame) {
		console.log('connection() - running game found');
		if (runningGame.creatorId === playerId) {
			console.log('connection() - creator found');
			callback(runningGame.creator);
		} else if (runningGame.opponentId === playerId) {
			console.log('connection() - opponnent found');
			callback(runningGame.opponent);
		} else {
			console.log('connection() - not found');
			callback(null);
		}
	} else {
		console.log('connection() - running game not found');
		callback(null);
	}
};

exports.moves = function(gameid, callback) {
	Move.find({
		game : gameid
	}, function(err, moves) {
		callback(moves);
	});
};