var mongoose = require('mongoose')
,Schema = mongoose.Schema;

var gameSchema = new Schema({
	creator : { type: Schema.Types.ObjectId, ref: 'player' },
	opponent : { type: Schema.Types.ObjectId, ref: 'player' },
	state: Number
});

module.exports = mongoose.model('game', gameSchema);