const express = require("express"); //call the express module into app

let app = express(); //server website, listen and have routes

let path = require("path"); //makes it easier to call files

const port = process.env.PORT || 3000; //Where the server is listening on.

app.set("view engine", "ejs"); //using ejs for our files.

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

const session = require("express-session");
app.use(express.json());

// Configure express-session
app.use(
  session({
    secret: "provomediaimpact", // You should use a long, random string in production
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: false }, // Set to true if using https
  })
);

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "carolinetobler",
    password: process.env.RDS_PASSWORD || "P0ftim1225-",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  }, //a dictionary (keys and values)
}); //parameters go in the ({})

// Get request for the landing page
app.get("/", (req, res) => {
  res.render("index"); // This will render the index.ejs file
});

//adding users to the data table
app.post("/storeLogin", (req, res) => {
  const { username, password } = req.body; // Make sure these names match your form input names

  knex("login")
    .insert({
      username: username, // This should match the column name in your database
      password: password,
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

//searching the table for matches
app.post("/findLogin", async (req, res) => {
  // Use 'username' and 'password' to match the form input names
  const { username, password } = req.body;

  console.log("Received body:", req.body);
  console.log("Extracted username:", username);
  console.log("Extracted password:", password);

  try {
    // Ensure the column name matches the database column name
    const user = await knex
      .select("*")
      .from("login")
      .where({
        username: username, // Column name in database: 'userName'
        password: password,
      })
      .first();

    if (user) {
      req.session.userInfo = user;
      req.session.loggedIn = true;
      res.send(
        '<script>alert("Your login credentials were validated!"); window.location.href = "/"; </script>'
      );
    } else {
      res.send(
        '<script>alert("Login Credentials Invalid!"); window.location.href = "/login"; </script>'
      );
    }
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).send("An error occurred during login.");
  }
});

//Get request for the login page
app.get("/login", (req, res) => {
  const isLoggedIn = req.session.loggedIn || false; // Check if user is logged in
  res.render("login", { isLoggedIn: isLoggedIn }); // Pass the logged-in status to the EJS template
});


// Get request for the add data page
app.get("/addData", (req, res) => {
  res.render("addData"); // This will render the addData.ejs file
});

app.get("/create", (req, res) => {
  res.render("create"); // This will render the addData.ejs file
});

app.get("/editLogin", (req, res) => {
  console.log("------Testing------");

  // Ensure req.session.userInfo is defined
  if (!req.session.userInfo) {
    // Redirect or handle the case where userinfo is not defined
    res.redirect("/login"); // You may want to redirect to the login page or handle it in a different way
    return;
  }

  console.log(req.session.userInfo.username);
  console.log(req.session.userInfo.password);
  res.render("editLogin", { userinfo: req.session.userInfo }); // Pass userinfo to the template
});

app.post("/editLogin", (req, res) => {
  const { username, password } = req.body;

  knex("login")
    .where("username", req.session.userInfo.username)
    .update({
      username: username, // Updated with the new username from the form
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

const organizationMapping = {
  'university': 1,
  'government': 2,
  'school': 3,
  'company': 4,
  'private': 5,
  'none': 6 // Assuming 'none' or 'N/A' is represented in your form and maps to 6
};

const platformMapping = {
  'twitter': 1,
  'youtube': 2,
  'facebook': 3,
  'reddit': 4,
  'discord': 5,
  'pinterest': 6,
  'instagram': 7,
  'snapchat': 8,
  'tiktok': 9
};
//Get request for the add data survey page
app.post("/storeData", async (req, res) => {
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
      location
  } = req.body;
  
  try {
      await knex.transaction(async trx => {
          const currentTimestamp = new Date();
          const location = 'Provo'; // Set location to 'Provo'
          const [userInsertResult] = await trx('user').insert({
              timestamp: currentTimestamp, // Include this line
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
              sleep
          }).returning('userID');

          const userId = userInsertResult.userID;

          // Inserting into user_organization
          if (organizations) {
              const userOrganizations = Array.isArray(organizations) ? organizations : [organizations];
              const organizationInserts = userOrganizations.map(orgName => ({
                  userID: userId,
                  organizationNum: organizationMapping[orgName]
              }));
              await trx('user_organization').insert(organizationInserts);
          }

          // Inserting into user_platform
          if (platforms) {
              const userPlatforms = Array.isArray(platforms) ? platforms : [platforms];
              const platformInserts = userPlatforms.map(platformName => ({
                  userID: userId,
                  platformNum: platformMapping[platformName]
              }));
              await trx('user_platform').insert(platformInserts);
          }

          await trx.commit();
          res.send(
            '<script>alert("Thank you for your response! Your record was added sucsessfully."); window.location.href = "/"; </script>'
          );
      });
  } catch (error) {
      console.error("Error details:", error);
      res.status(500).send("Failed to store data");
  }
}); 

//Get request for the dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard"); // This will render the login.ejs file
});

//Get request for the view all data page
//Get request for the view all data page
app.get("/viewData", (req, res) => {
  knex
    .select(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      knex.raw('STRING_AGG(DISTINCT o."organizationName", \', \') AS "organizationAffiliation"'),
      "socialMediaUsage",
      knex.raw('STRING_AGG(DISTINCT pf."platformName", \', \') AS "socialMediaPlatforms"'),
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
    )
    .then((user) => {
      res.render("viewData", { mydata: user });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
});

//get request for a single record
app.get("/searchData/:userNum", (req, res) => {
  knex
    .select(
      "u.userID",
      "timestamp",
      "age",
      "gender",
      "relationshipStatus",
      "occupationStatus",
      knex.raw('STRING_AGG(DISTINCT o."organizationName", \', \') AS "organizationAffiliation"'),
      "socialMediaUsage",
      knex.raw('STRING_AGG(DISTINCT pf."platformName", \', \') AS "socialMediaPlatforms"'),
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
app.listen(port, () => console.log("Server is Listening")); //last line!!
