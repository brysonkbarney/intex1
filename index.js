const express = require("express"); //call the express module into app

let app = express(); //server website, listen and have routes

let path = require("path"); //makes it easier to call files

const port = process.env.PORT || 3000; //Where the server is listening on.

app.set("view engine", "ejs"); //using ejs for our files.

app.use(express.urlencoded({ extended: true }));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  }, //a dictionary (keys and values)
}); //parameters go in the ({})

// Get request for the landing page
app.get("/", (req, res) => {
  res.render("index"); // This will render the index.ejs file
});

//Get request for the login page
app.get("/login", (req, res) => {
  knex
    .select()
    .from("login")
    .then((login) => {
      res.render("login.ejs", { allLogins: login });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
});

//Get Request for creating an account in our login page.
//add account user name and password to our account table

//Get request for the add data survey page
app.get("/addData", (req, res) => {
  res.render("addData"); // This will render the login.ejs file
});

//Get request for the view all data page
app.get("/viewData", (req, res) => {
  res.render("viewData"); // This will render the login.ejs file
});

//Get request for the dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard"); // This will render the login.ejs file
});

app.listen(port, () => console.log("Server is Listening")); //last line!!
