require("dotenv").config({ path: "../database.env" });

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const csurf = require("csurf");
const path = require("path");
const rateLimit = require("express-rate-limit");

// Import route files FIRST
const progressRoutes = require("./progressRoutes");
const examRoutes = require("./examRoutes");
const authRoutes = require("./authRoutes");
const connection = require("./database");

// Initialize Express
const app = express();

// Middleware order FIXED:
// 1. Body parsers first
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 2. Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  })
);

// 3. CSRF middleware (after session)
const csrfProtect = csurf();

app.use("/login", csrfProtect);
app.use("/register", csrfProtect);
app.use("/delete-account", csrfProtect);

app.get("/csrf-token", csrfProtect, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect auth routes: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again in 15 minutes.",
});

// General API protection: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Rate limit exceeded. Please slow down.",
});

app.use("/login", authLimiter);
app.use("/register", authLimiter);
app.use("/api", apiLimiter);
app.use("/", examRoutes);
app.use("/", authRoutes);
app.use("/", progressRoutes);
app.use(
  "/certificates",
  express.static(path.join(__dirname, "../certificates"))
);

// 4. Static files
app.use(express.static(path.join(__dirname, "../public")));
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use(express.static(path.join(__dirname, "../views")));

// Homepage route
app.get("/", (req, res) => {
  console.log("GET /homepage called");
  res.sendFile(path.join(__dirname, "../views/Home-Page.html"));
});

// Error handlers
app.use((req, res) => res.status(404).send("Page not found."));
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN")
    return res.status(403).send("Form tampered with.");
  next(err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
