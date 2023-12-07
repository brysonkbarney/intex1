//Bryson Barney, Caroline Tobler, Hannah Johnson, Jonah Allen
// This Node.js application connects to an AWS database to collect survey data on the correlation between social media usage and mental health in Provo.

// Importing necessary modules
const express = require("express"); // Call the express module into the app
let app = express(); // Server to listen, handle routes, and have middleware
let path = require("path"); // Module to make it easier to call files
const port = process.env.PORT || 3000; // Port where the server is listening

// Setting up EJS as the view engine
app.set("view engine", "ejs");

// Middleware setup for parsing URL-encoded and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files middleware setup
app.use(express.static("public"));

// Setting up express-session middleware
const session = require("express-session");
app.use(
  session({
    secret: "provomediaimpact", // Use a long, random string in production
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: false }, // Set to true if using https
  })
);

// Setting up the connection to PostgreSQL database using Knex
const knex = require("knex")({
  client: "pg",
  connection: {
    // Connection details
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "carolinetobler",
    password: process.env.RDS_PASSWORD || "P0ftim1225-",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

// Handling GET request for the landing page
app.get("/", (req, res) => {
  res.render("index"); // Render the index.ejs file
});

// Handling POST request for adding users to the data table
app.post("/storeLogin", (req, res) => {
  // Extracting data from the request body
  const { username, password } = req.body;

  // Inserting user data into the login table
  knex("login")
    .insert({
      username: username,
      password: password,
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      // Handling the case where the username already exists
      res.send(
        '<script>alert("Username already exists. Please choose another one to continue!"); window.location.href = "/create"; </script>'
      );
    });
});

// Handling POST request for searching the table for matches
app.post("/findLogin", async (req, res) => {
  // Extracting data from the request body
  const { username, password } = req.body;

  console.log("Received body:", req.body);
  console.log("Extracted username:", username);
  console.log("Extracted password:", password);

  try {
    // Searching for a user in the login table
    const user = await knex
      .select("*")
      .from("login")
      .where({
        username: username,
        password: password,
      })
      .first();

    if (user) {
      // Setting session variables for a logged-in user
      req.session.userInfo = user;
      req.session.loggedIn = true;
      // Redirecting with a success message
      res.send(
        '<script>alert("Your login credentials were validated!"); window.location.href = "/"; </script>'
      );
    } else {
      // Redirecting with an error message for invalid credentials
      res.send(
        '<script>alert("Login Credentials Invalid!"); window.location.href = "/login"; </script>'
      );
    }
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).send("An error occurred during login.");
  }
});

// Handling GET request for the login page
app.get("/login", (req, res) => {
  // Checking if the user is logged in
  const isLoggedIn = req.session.loggedIn || false;
  // Rendering the login page and passing the logged-in status to the EJS template
  res.render("login", { isLoggedIn: isLoggedIn });
});

// Handling GET request for the add data page
app.get("/addData", (req, res) => {
  res.render("addData"); // Render the addData.ejs file
});

// Handling GET request for the create account page
app.get("/create", (req, res) => {
  res.render("create"); // Render the create.ejs file
});

// Handling GET request for editing login information
app.get("/editLogin", (req, res) => {
  console.log("------Testing------");

  // Ensure req.session.userInfo is defined
  if (!req.session.userInfo) {
    // Redirect to the login page if userinfo is not defined
    res.redirect("/login");
    return;
  }

  console.log(req.session.userInfo.username);
  console.log(req.session.userInfo.password);
  // Render the editLogin page and pass userinfo to the template
  res.render("editLogin", { userinfo: req.session.userInfo });
});

// Handling POST request for editing login information
app.post("/editLogin", (req, res) => {
  const { username, password } = req.body;

  // Updating login information in the login table
  knex("login")
    .where("username", req.session.userInfo.username)
    .update({
      username: username,
      password: password,
    })
    .then(() => {
      // Update the session with the new username if it was changed
      if (username !== req.session.userInfo.username) {
        req.session.userInfo.username = username;
      }

      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

// Mappings for organization and platform types
const organizationMapping = {
  University: 1,
  Government: 2,
  School: 3,
  Company: 4,
  Private: 5,
  None: 6, // Assuming 'none' or 'N/A' is represented in your form and maps to 6
};

const platformMapping = {
  Twitter: 1,
  Youtube: 2,
  Facebook: 3,
  Reddit: 4,
  Discord: 5,
  Pinterest: 6,
  Instagram: 7,
  Snapchat: 8,
  TikTok: 9,
  None: 10,
};

// Handling POST request for storing survey data
app.post("/storeData", async (req, res) => {
  // Extracting survey data from the request body
  const {
    age,
    gender,
    relationshipStatus,
    occupationStatus,
    organizations,
    platforms,
    socialMediaUsage,
    avgDailyTime,
    purpose,
    distracted,
    restless,
    easilyDistracted,
    worried,
    concentration,
    comparison,
    comparisonFeelings,
    validation,
    depression,
    interests,
    sleep,
    location,
  } = req.body;

  try {
    // Using a transaction to ensure atomicity
    await knex.transaction(async (trx) => {
      const currentTimestamp = new Date();
      const location = "Provo"; // Setting location to 'Provo'
      // Inserting data into the user table
      const [userInsertResult] = await trx("user")
        .insert({
          timestamp: currentTimestamp,
          age,
          gender,
          relationshipStatus,
          occupationStatus,
          location,
          socialMediaUsage,
          avgDailyTime,
          purpose,
          distracted,
          restless,
          easilyDistracted,
          worried,
          concentration,
          comparison,
          comparisonFeelings,
          validation,
          depression,
          interests,
          sleep,
        })
        .returning("userID");

      const userId = userInsertResult.userID;

      // Inserting data into the user_organization table
      if (organizations) {
        const userOrganizations = Array.isArray(organizations)
          ? organizations
          : [organizations];
        const organizationInserts = userOrganizations.map((orgName) => ({
          userID: userId,
          organizationNum: organizationMapping[orgName],
        }));
        await trx("user_organization").insert(organizationInserts);
      }

      // Inserting data into the user_platform table
      if (platforms) {
        const userPlatforms = Array.isArray(platforms)
          ? platforms
          : [platforms];
        const platformInserts = userPlatforms.map((platformName) => ({
          userID: userId,
          platformNum: platformMapping[platformName],
        }));
        await trx("user_platform").insert(platformInserts);
      }

      await trx.commit();
      // Redirecting with a success message
      res.send(
        '<script>alert("Thank you for your response! Your record was added successfully."); window.location.href = "/"; </script>'
      );
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).send("Failed to store data");
  }
});

// Handling GET request for the dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard"); // Render the dashboard.ejs file
});

// Handling GET request for viewing all data
app.get("/viewData", (req, res) => {
  // Check if the user is logged in
  if (!req.session.loggedIn) {
    // Redirect to the login page if the user is not logged in
    res.send(
      '<script>alert("Please login to view records."); window.location.href = "/login"; </script>'
    );
  }

  let query = knex
    .select(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      knex.raw(
        'STRING_AGG(DISTINCT o."organizationName", \', \') AS "organizationAffiliation"'
      ),
      "socialMediaUsage",
      knex.raw(
        'STRING_AGG(DISTINCT pf."platformName", \', \') AS "socialMediaPlatforms"'
      ),
      "avgDailyTime",
      "purpose",
      "distracted",
      "restless",
      "easilyDistracted",
      "worried",
      "concentration",
      "comparison",
      "comparisonFeelings",
      "validation",
      "depression",
      "interests",
      "sleep",
      "location"
    )
    .from({ u: "user" })
    .innerJoin("user_platform as up", "u.userID", "up.userID")
    .innerJoin("platform as pf", "up.platformNum", "pf.platformNum")
    .innerJoin("user_organization as uo", "u.userID", "uo.userID")
    .innerJoin("organization as o", "uo.organizationNum", "o.organizationNum")
    .groupBy(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      "socialMediaUsage",
      "avgDailyTime",
      "purpose",
      "distracted",
      "restless",
      "easilyDistracted",
      "worried",
      "concentration",
      "comparison",
      "comparisonFeelings",
      "validation",
      "depression",
      "interests",
      "sleep",
      "location"
    );

  // Check if userId parameter is present
  if (req.query.userId && req.query.userId.trim() !== "") {
    query = query.where("u.userID", req.query.userId);
  }

  query
    .then((userData) => {
      res.render("viewData", { mydata: userData });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
});

// Handling GET request for viewing a single record
app.get("/searchData/:userNum", (req, res) => {
  knex
    .select(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      knex.raw(
        'STRING_AGG(DISTINCT o."organizationName", \', \') AS "organizationAffiliation"'
      ),
      "socialMediaUsage",
      knex.raw(
        'STRING_AGG(DISTINCT pf."platformName", \', \') AS "socialMediaPlatforms"'
      ),
      "avgDailyTime",
      "purpose",
      "distracted",
      "restless",
      "easilyDistracted",
      "worried",
      "concentration",
      "comparison",
      "comparisonFeelings",
      "validation",
      "depression",
      "interests",
      "sleep",
      "location"
    )
    .from({ u: "user" })
    .innerJoin("user_platform as up", "u.userID", "up.userID")
    .innerJoin("platform as pf", "up.platformNum", "pf.platformNum")
    .innerJoin("user_organization as uo", "u.userID", "uo.userID")
    .innerJoin("organization as o", "uo.organizationNum", "o.organizationNum")
    .where("u.userID", req.params.userNum)
    .groupBy(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      "socialMediaUsage",
      "avgDailyTime",
      "purpose",
      "distracted",
      "restless",
      "easilyDistracted",
      "worried",
      "concentration",
      "comparison",
      "comparisonFeelings",
      "validation",
      "depression",
      "interests",
      "sleep",
      "location"
    )
    .then((user) => {
      res.render("viewData", { mydata: user });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
});

// Start the server
app.listen(port, () => console.log("Server is Listening"));
