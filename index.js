var express=require('express');
var app=express();
var path=require('path');
var cookieSession=require('cookie-session');
 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//connect to db
var mongoose=require('mongoose');
mongoose.connect( "mongodb://127.0.0.1:27017/note",{ useNewUrlParser: true,useUnifiedTopology: true,useCreateIndex: true },()=>{
  console.log('connected to mongodb');
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var User=require("./db/model_user");
var Note=require("./db/model_note");
var lib=require("./db/lib");
const { v4: uuidv4 } = require('uuid');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
  name:'jizz',
  secret: "infor32nd"
}));

//pages
app.get("/",(req,res,next)=>{
	res.render("index");
});
app.get("/login",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
  		res.redirect("/list");
  	}
  	else{
  		res.render("login");
  	}
});
app.get("/register",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
  		res.redirect("/list");
  	}
  	else{
  		res.render("register");
  	}
});
app.get("/list",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
		let notes=await Note.find({account: req.session.name});
		res.render("list",{notes: notes});
  	}
  	else{
  		res.redirect("/login");
  	}
});
app.get("/modify/:num",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
		let note=await Note.findOne({num: req.params.num});
		if(note.type==="word_sheet"){
			res.render("modify",{note: note});
		}
		else if(note.type==="voc_list"){
			res.render("modify_voc",{note: note});
		}
  	}
  	else{
  		res.redirect("/login");
  	}
});
app.get("/note/:num",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
		let note=await Note.findOne({num: req.params.num});
		if(note.type==="word_sheet"){
			res.render("note",{note: note});
		}
		else if(note.type==="voc_list"){			
			res.render("voc_list",{note: note});
		}
  	}
  	else{
  		res.redirect("/login");
  	}
});

//apis
app.post("/login",async(req,res,next)=>{
	if(req.body.user&&req.body.passwd){
		let pwd= await lib.create_crypto(req.body.passwd,"jizz7122");
		let user=await User.findOne({account: req.body.user});
		if(!user){
			console.log("user not exists at login");
			res.redirect("/register");
		}
		else if(user.password!=pwd){
			console.log("password not correct");
			res.redirect("/login");
		}
		else{
			req.session.logined=true;
			req.session.name=req.body.user;
			res.redirect("/list");
		}
	}
	else{
		console.log("name or password empty at login");
		res.redirect("/login");
	}
});
app.post("/register",async(req,res,next)=>{
	if(req.body.user&&req.body.passwd&&req.body.passwd_confirm){
		let pwd=await lib.create_crypto(req.body.passwd,"jizz7122");
		let user=await User.findOne({account: req.body.user});
		if(req.body.passwd!=req.body.passwd_confirm){
			console.log("password confirm fail at register");
			res.redirect("/register");
		}
		else if(user){
			console.log("user exists at register");
			res.redirect("/register");
		}
		else{
			let new_user=new User({
				account: req.body.user,
				password: pwd
			});
			await new_user.save((err)=>{
				if(err){
					console.log("can't save new_user at create_user");
				}
			});
			req.session.logined=true;
			req.session.name=req.body.user;
			res.redirect("/list");
		}
	}
	else{
		console.log("blank empty at register");
		res.redirect("/register");
	}
});
app.get('/logout',(req,res,next)=>{
	req.session.logined=false;
	req.session.name="jizzzzzzzzzzzzzz";
	res.redirect("/login");
});
app.post("/newnote",async(req,res,next)=>{
	if(req.body.sheet){
		let num=await uuidv4();
		let new_note= new Note({
			type: req.body.sheet,
			num: num,
			name: num,
			account: req.session.name,
			content: "",
			createdate: Date.now()
		});
		await new_note.save((err)=>{
			if(err){
				console.log("err at create new note");
			}
		});
		res.redirect("/modify/"+num);
	}
	else{
		res.redirect("/list");
	}
});
app.post("/modify/:num",async(req,res,next)=>{
	if(req.body.acc){
		let note=await Note.findOne({num: req.params.num});
		if(!note){
			console.log("note not exists at modify_post");
			res.redirect("/modify"+req.params.num);
		}
		else if(req.session.name!=note.account){
			console.log("no access to the note at modify_post");
			res.redirect("/modify"+req.params.num);
		}
		else{
			if(note.type==="word_sheet"){
				note.name=req.body.acc;
				note.content=req.body.con;
				await note.save((err)=>{
					if(err){
						console.log(err);
						console.log("can't modify note at post");
					}
				});
			}
			else if (note.type==="voc_list"){
				note.name=req.body.acc;
				note.content=req.body.con;
				await note.save((err)=>{
					if(err){
						console.log(err);
						console.log("can't modify note at post");
					}
				});
			}	
			res.redirect("/note/"+req.params.num);
		}
	}
	else{
		res.redirect("/modify/"+req.params.num);
	}
});
app.post("/search/",async(req,res,next)=>{
	let auth=await lib.auth(req.session.logined,req.session.name);
	if(auth===200){
		if(req.body.word){
			console.log(req.body.word);
			let result=await lib.search_voc(req.body.word);
			//console.log(result);
			res.send(result);
		}
		else{
			console.log("search fail");
		}
  	}
  	else{
  		res.redirect("/login");
  	}
});


app.listen(8080,()=>{
  console.log("listening...");
});
