const express = require("express"); //call the express module into app

let app = express(); //server website, listen and have routes

let path = require("path"); //makes it easier to call files

const port = process.env.PORT || 3000; //Where the server is listening on.

app.set("view engine", "ejs"); //using ejs for our files.

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "carolinetobler",
    password: process.env.RDS_PASSWORD || "P0ftim122-",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  }, //a dictionary (keys and values)
}); //parameters go in the ({})

// Get request for the landing page
app.get("/", (req, res) => {
  res.render("index"); // This will render the index.ejs file
});

app.post("/storeLogin", (req, res) => {
  const { username, password } = req.body;

  knex("login")
    .insert({
      userName: username,
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

app.post("/findLogin", (req, res) => {
  knex
    .select("userName", "password")
    .from("login")
    .where({
      userName: req.query.userName,
      password: req.query.password, // Add this line to include password in the query
    })
    .then((login) => {
      if (login.length > 0) {
        // If the login array is not empty, it means a match was found
        res.redirect("/");
      } else {
        // No matching credentials found
        res.status(401).send("Invalid credentials");
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
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

// Get request for the add data page
app.get("/addData", (req, res) => {
  res.render("addData"); // This will render the addData.ejs file
});

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
  } = req.body;

  try {
    await knex.transaction(async (trx) => {
      const currentTimestamp = new Date();
      const location = "Provo"; // Set location to 'Provo'
      const [userInsertResult] = await trx("user")
        .insert({
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
          sleep,
        })
        .returning("userID");

      const userId = userInsertResult.userID;

      // Inserting into user_organization
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

      // Inserting into user_platform
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
      res.send("Record added successfully. Thank you for your response.");
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
app.get("/viewData", (req, res) => {
  knex
    .select(
      "userID",
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
    .from("user")
    .then((user) => {
      res.render("viewData", { mydata: user });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err });
    });
});

app.listen(port, () => console.log("Server is Listening")); //last line!!
