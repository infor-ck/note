var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var User=new Schema({
	account: String,
	password: String
});

module.exports=mongoose.model('User',User);