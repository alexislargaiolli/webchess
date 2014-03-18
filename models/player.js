var mongoose = require('mongoose'), Schema = mongoose.Schema;

var playerSchema = new Schema({
	pseudo : String
});

module.exports = mongoose.model('player', playerSchema);