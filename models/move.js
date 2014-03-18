var mongoose = require('mongoose'), Schema = mongoose.Schema;

var moveSchema = new Schema({
	index : Number,
	start : Number,
	end : Number,
	promote : String,
	game : {
		type : Schema.Types.ObjectId,
		ref : 'game'
	},
	player : {
		type : Schema.Types.ObjectId,
		ref : 'player'
	}
});

module.exports = mongoose.model('move', moveSchema);