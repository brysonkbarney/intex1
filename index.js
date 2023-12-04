const express = require("express"); //call the express module into app

let app = express(); //server website, listen and have routes

let path = require("path"); //makes it easier to call files

const port = process.env.PORT || 3000; //Where the server is listening on.

app.set("view engine", "ejs"); //using ejs for our files.

app.use(express.urlencoded({ extended: true }));

// Get request for the landing page
app.get("/", (req, res) => {
  res.render("index"); // This will render the index.ejs file
});

//Get request for the login page
app.get("/login", (req, res) => {
  res.render("login"); // This will render the login.ejs file
});

//Get Request for creating an account in our login page.
//add account user name and password to our account table

  

app.listen(port, () => console.log('Server is Listening')); //last line!!