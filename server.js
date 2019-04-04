const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
var knex = require('knex');


const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'postgres',
    database : 'canisninja'
  }
});



//start the server (use npm start command in cmd promp, in package.json start: nodemon server.js)
const app = express();
app.listen(3000,()=>{
	console.log('server is running');
})

app.use(bodyParser.json()); //middleware makes req.body.email and all work


//1. Register Users
app.post('/register',(req,res)=>{
const pass = req.body.password;
const email = req.body.email;
const name = req.body.name;

var hash = bcrypt.hashSync(pass);
	
	db.transaction(trx => {
		trx.insert({
			hash:hash,
			email: email,
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: email,
				name:name,
				joined: new Date()
			})
			.then(user=>{
				res.json(user);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => {
		res.status(400).json("Unable to register")
        console.log(err);
})
});


//2. Signin
app.post('/signin', (req, res)=>{
	
db.select('email', 'hash').from('login').where('email','=', req.body.email)
.then(data =>{
 const isValid =bcrypt.compareSync(req.body.password, data[0].hash);
 if(isValid){
 	return db.select('*').from('users').where('email','=', req.body.email)
 	.then(user =>{
 		res.json(user[0]);
 	})
 	.catch(err => res.status(400).json("unable to get user"))
 }
 else{
 	res.status(400).json("wrong password");
 }
})
.catch(err => res.status(400).json("email not found"))
});




//3. Get all users
app.get('/users',(req, res)=>{
db.select('*').from('users').then(users=>{
	res.json(users);
})
.catch(err =>res.status(400).json('unable to get users'))

/*
To return specific user
const id  = req.params.id;
db.select('*').from('users').where({
	id:id
}).then(users=>{
	res.json(users);
})
*/
})


//4. Save Service
app.post('/saveservice', (req, res) => {

const Phone = req.body.Phone;
const email = req.body.email;
const Cusname = req.body.Cusname;
const Servname = req.body.Servname;

db('services')
.returning('*')
.insert({
	//case of column names matter - all in small letters cus postgres saves only in small case
	cusname: Cusname,
	email: email,
	servname: Servname,
	phone: Phone,
	daterequested: new Date()
	})
	.then(ServiceRecord =>{
		res.json(ServiceRecord);
	})
	.catch(err => {
		res.status(400).json(err);
		console.log(err);

	})
})



//5. Get Services
app.get('/getservices',(req,res) => {
	db.select('*').from('services').then(services=>{
	res.json(services);
})
.catch(err =>res.status(400).json('unable to get services'))
})









/*

// Load hash from your password DB.
bcrypt.compare(myPlaintextPassword, hash, function(err, res) {
    // res == true
});
bcrypt.compare(someOtherPlaintextPassword, hash, function(err, res) {
    // res == false
});

trial code
db.select('*').from('users').then(data=> {
console.log(data);
});

*/





/*
/signin --> POST
/register --> POST
/PROFILE/:USERid -->
*/
