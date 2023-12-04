const express = require('express'); //call the express module into app

let app = express(); //server website, listen and have routes

let path = require('path'); //makes it easier to call files

const port = 3000; //Where the server is listening on.

app.set('view engine', 'ejs'); //using ejs for our files. 

app.use(express.urlencoded({extended:true}));

app.listen(port, () => console.log('Server is Listening')); //last line!!