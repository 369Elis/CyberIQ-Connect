const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const progressRoutes = require("./progressRoutes");
const examRoutes = require("./examRoutes");

const authRoutes = require("./authRoutes");
const connection = require("./database");

const app = express();

// Parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON data
app.use(bodyParser.json());

// Session management
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use(express.static(path.join(__dirname, "../views")));
app.use("/", examRoutes);
app.use(
  "/certificates",
  express.static(path.join(__dirname, "../certificates"))
);

// Routes
app.use("/", authRoutes);
app.use("/", progressRoutes);

// Render homepage
app.get("/", (req, res) => {
  console.log("GET /homepage called");
  res.sendFile(path.join(__dirname, "../views/Home-Page.html"));
});

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).send("Page not found.");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
