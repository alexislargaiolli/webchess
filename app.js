/**
 * Module dependencies.
 */

var express = require('express'), http = require('http'), path = require('path'),passport = require('passport'), flash = require('connect-flash'), configDB = require('./config/database.js');
var app = express();
app.mongoose = require('mongoose');

app.mongoose.connect(configDB.url);
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({
	secret : 'SECRET'
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views/war')));
// development only
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

require('./routes.js')(app, passport);
require('./config/passport')(passport);

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

var chess = require('./controllers/chessGameController.js');

var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
	httpServer : server
});

var connections = [];

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	var connectionGameId;
	var connectionPlayerId;
	var iCo = connections.push(connection);
	connection.sendUTF(JSON.stringify({
		type : 'auth'
	}));

	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			console.log(message);
			try {
				var data = JSON.parse(message.utf8Data);
				if (data.type === 'auth') {
					connectionGameId = data.gameid;
					connectionPlayerId = data.playerid;
				}
				chess.reveive(data, connection, iCo);
			}
			catch (ex) {
				console.log('Received none json datas');
		    }
		}
	});

	connection.on('close', function(connection) {
		if (connectionGameId) {
			if (chess.RunningGames[connectionGameId].creator === connectionPlayerId) {
				chess.RunningGames[connectionGameId].creator = null;
				if (chess.RunningGames[connectionGameId].opponent === null) {
					chess.RunningGames[connectionGameId] = null;
				}
			} else if (chess.RunningGames[connectionGameId].opponent === connectionPlayerId) {
				chess.RunningGames[connectionGameId].opponent = null;
				if (chess.RunningGames[connectionGameId].creator === null) {
					chess.RunningGames[connectionGameId] = null;
				}
			}
		}
		connections.pop(iCo);
	});
});
