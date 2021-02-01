var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var User_voc=new Schema({
	word: String,
	def: String,
	ch_def: String,
	ex_eg: String,
	ex_ch: String,
	phrase: String
});

module.exports=mongoose.model('User_voc',User_voc);