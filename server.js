const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
var knex = require('knex');
var cors = require('cors');

/* 
Knex is used as a driver package to connect the jf file
to the database
*/
const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl: true
   
  }
});

/* 
Initializing the server package, express library
Note: start the server (use npm start command in cmd promp, in package.json start: nodemon server.js)
*/
const app = express();
/* 
CORS is used to allow cross site calling of services. If this is not present, 
Browsers like Chrome will throw error when the services are called.
*/
app.use(cors());

/* 
The server is started and is configued to listen to port 3000 or the 
environmental PORT variable on a public server.
*/
app.listen(process.env.PORT || 3000,()=>{
	console.log(`server is running on ${process.env.PORT}`);
})


/*
bodyParser is middleware software that processes the request body that
comes in when a service is called. I makes commands like the one below to work: 
 middleware makes req.body.email and all work
*/

app.use(bodyParser.json());

/*
This is a GET request that is used to check if the 
client connection has been established successfully
*/

app.get('/',(req,res)=> {

db.select('*').from('users').then(users=>{
	res.json(users);
})
.catch(err =>res.status(400).json('unable to get users'))

});


/*
The below service is used to register a new user 
to the database. It makes an entry in the login and user 
tables in the database. It is treated as a transaction. 
If transaction fails, all changes are rolled back
*/

//1. Register Users
app.post('/register',(req,res)=>{
const pass = req.body.password;
const email = req.body.email;
const username = req.body.username;
const fullname = req.body.fullname;

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
				fullname:fullname,
				username:username,
				joined: new Date()
			})
			.then(user=>{
				res.json(user[0]);
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



/*
This service is used to validate the login credentials of a user.
It provides the output to the client side to decide if a user has
successfully logged in or not.
*/

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


/*
This services is used to get all the users who have signed up 
on the website. It is called from the admin screen.
*/

//3. Get all users
app.get('/users',(req, res)=>{
db.select('*').from('users').then(users=>{
	res.json(users);
})
.catch(err =>res.status(400).json('unable to get users'))
})


/*
The following service is used to record a service 
a user requests on the service screen. It makes a new entry 
into the services table
*/

//4. Save Service
app.post('/saveservice', (req, res) => {

const phone = req.body.phone;
const email = req.body.email;
const cusname = req.body.cusname;
const servname = req.body.servname;
const ondate = req.body.ondate;
const address = req.body.address;

db('services')
.returning('*')
.insert({
	//case of column names matter - all in small letters cus postgres saves only in small case
	cusname: cusname,
	address:address,
	email: email,
	servname: servname,
	phone: phone,
	ondate:ondate,
	daterequested: new Date()
	})
	.then(ServiceRecord =>{
		res.json('servicesaved');
	})
	.catch(err => {
		res.status(400).json(err);
		console.log(err);

	})
})

/*
The following service returns all services in the services table 
of the database. It is called from the Admin screen.
*/

//5. Get Services
app.get('/getservices',(req,res) => {
	db.select('*').from('services').then(services=>{
	res.json(services);
})
.catch(err =>res.status(400).json('unable to get services'))
})

/*
The following service returns the list of dog services that 
a particualr user has created. This service is called from the user
screen on the client side. 
*/

//6. Get Services of a Particular User
app.post('/getuserservice',(req,res) => {
	db.select('*').from('services').where('email','=', req.body.email)
	.then(services=>{
	res.json(services);
})
.catch(err =>res.status(400).json('unable to get services'))
})