// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const connection = require("./database");

const router = express.Router();

// Password validation function
function isValidPassword(password) {
  const lengthCheck = password.length >= 8;
  const upperCheck = /[A-Z]/.test(password);
  const lowerCheck = /[a-z]/.test(password);
  const digitCheck = /\d/.test(password);
  const specialCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return lengthCheck && upperCheck && lowerCheck && digitCheck && specialCheck;
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../assets/avatar");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Use a unique name so we don't overwrite
    const uniqueName = `${req.session.userId}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type."));
  },
});

// ======================================================
// Route: POST /upload-avatar
// ======================================================
router.post("/upload-avatar", upload.single("avatar"), (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // File was successfully uploaded to disk at this point
  const newAvatarUrl = `/assets/avatar/${req.file.filename}`;

  connection.query(
    "SELECT avatar_url FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      // If there's an existing (non-default) avatar, remove it from disk
      const currentAvatar = results[0]?.avatar_url;
      if (currentAvatar && currentAvatar !== "/assets/avatar/pfp.JPG") {
        const oldFilePath = path.join(__dirname, "../", currentAvatar);
        fs.unlink(oldFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Failed to delete old avatar:", unlinkErr);
          }
        });
      }

      // Update DB with the new avatar URL
      connection.query(
        "UPDATE users SET avatar_url = ? WHERE id = ?",
        [newAvatarUrl, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Database Update Error:", updateErr);
            return res
              .status(500)
              .json({ success: false, message: "Failed to update avatar." });
          }
          res.json({ success: true, newAvatarUrl });
        }
      );
    }
  );
});

// ======================================================
// Route: GET /api/user-info
//  -> Now includes user_level
// ======================================================
router.get("/api/user-info", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ isLoggedIn: false });
  }

  // Include user_level here:
  connection.query(
    `SELECT first_name, last_name, age, avatar_url, personal_info_updates, user_level
     FROM users
     WHERE id = ?`,
    [req.session.userId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).send("Failed to retrieve user info.");
      }

      const user = results[0];
      res.json({
        isLoggedIn: true,
        firstName: user.first_name,
        lastName: user.last_name,
        age: user.age,
        avatarUrl: user.avatar_url || "/assets/avatar/pfp.JPG",
        personalInfoUpdates: user.personal_info_updates,
        userLevel: user.user_level ? user.user_level.toLowerCase() : null,
      });
    }
  );
});

// ======================================================
// Route: GET /login -> Show login.html
// ======================================================
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

// ======================================================
// Route: GET /personalinfo.html
// ======================================================
router.get("/personalinfo.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/personalinfo.html"));
});

// ======================================================
// Route: POST /login -> Process login
// ======================================================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.redirect("/login?error=Invalid email or password");
      }

      const user = results[0];
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (isPasswordMatch) {
        req.session.userId = user.id;
        return res.redirect("/account.html");
      } else {
        return res.redirect("/login?error=Invalid email or password");
      }
    }
  );
});

// ======================================================
// Route: GET /register -> Show register.html
// ======================================================
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

// ======================================================
// Route: POST /register -> Create new user
// ======================================================
router.post("/register", async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match." });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  connection.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error." });
      if (results.length > 0) {
        return res.status(400).json({ error: "Email is already registered." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert WITHOUT setting user_level => defaults to NULL
      connection.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword],
        (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ error: "Registration failed." });
          }
          res
            .status(200)
            .json({ message: "Registration successful. Please log in." });
        }
      );
    }
  );
});

// ======================================================
// Route: POST /logout
// ======================================================
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout failed.");
    }
    res.redirect("/login");
  });
});

// ======================================================
// Route: POST /update-personal-info
// ======================================================
router.post("/update-personal-info", upload.none(), (req, res) => {
  const { "first-name": firstName, "last-name": lastName, age } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  connection.query(
    "SELECT personal_info_updates FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      const user = results[0];
      const updatesCount = user.personal_info_updates;

      if (updatesCount >= 2) {
        return res.status(400).json({
          success: false,
          message:
            "You have already changed your age once. Contact support to change it again.",
        });
      }

      const ageValue = parseInt(age, 10);
      if (isNaN(ageValue)) {
        return res.status(400).json({
          success: false,
          message: "Invalid age provided. Please enter a numeric value.",
        });
      }

      const updates = {
        first_name: firstName,
        last_name: lastName,
        age: ageValue,
        personal_info_updates: updatesCount + 1,
      };

      connection.query(
        "UPDATE users SET ? WHERE id = ?",
        [updates, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Database Update Error:", updateErr);
            return res.status(500).json({
              success: false,
              message: "Failed to update personal info.",
            });
          }
          return res.status(200).json({
            success: true,
            message: "Your details have been updated successfully!",
          });
        }
      );
    }
  );
});

// ======================================================
// Route: POST /delete-account
// ======================================================
router.post("/delete-account", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send("Unauthorized: You must be logged in.");
  }

  // Step 1: Delete user's progress first
  connection.query(
    "DELETE FROM user_progress WHERE user_id = ?",
    [userId],
    (progressErr) => {
      if (progressErr) {
        console.error("Error deleting user progress:", progressErr);
        return res.status(500).send("Failed to delete user progress.");
      }

      // Step 2: Then delete user
      connection.query(
        "DELETE FROM users WHERE id = ?",
        [userId],
        (userErr) => {
          if (userErr) {
            console.error("Error deleting account:", userErr);
            return res.status(500).send("Failed to delete account.");
          }

          req.session.destroy((destroyErr) => {
            if (destroyErr) {
              console.error("Error destroying session:", destroyErr);
              return res.status(500).send("Failed to log out after deletion.");
            }
            res.redirect("/register.html");
          });
        }
      );
    }
  );
});

// ======================================================
// Route: POST /change-password
// ======================================================
router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!req.session.userId) {
    return res.status(401).send("Unauthorized: Please log in.");
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirm password do not match." });
  }

  // Validate password fully and return detailed errors if not met
  const lengthCheck = newPassword.length >= 8;
  const upperCheck = /[A-Z]/.test(newPassword);
  const lowerCheck = /[a-z]/.test(newPassword);
  const digitCheck = /\d/.test(newPassword);
  const specialCheck = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  let passwordErrors = [];
  if (!lengthCheck) passwordErrors.push("At least 8 characters");
  if (!upperCheck) passwordErrors.push("At least one uppercase letter");
  if (!lowerCheck) passwordErrors.push("At least one lowercase letter");
  if (!digitCheck) passwordErrors.push("At least one digit");
  if (!specialCheck) passwordErrors.push("At least one special character");

  if (passwordErrors.length > 0) {
    return res.status(400).json({
      error: "Password requirements not met.",
      details: passwordErrors,
    });
  }

  // Validate current password
  connection.query(
    "SELECT password FROM users WHERE id = ?",
    [req.session.userId],
    async (err, results) => {
      if (err || results.length === 0) {
        return res
          .status(500)
          .json({ error: "Failed to verify current password." });
      }

      const storedPassword = results[0].password;
      const isMatch = await bcrypt.compare(currentPassword, storedPassword);

      if (!isMatch) {
        return res
          .status(400)
          .json({ error: "Current password is incorrect." });
      }

      // Update new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      connection.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedNewPassword, req.session.userId],
        (updateErr) => {
          if (updateErr) {
            return res
              .status(500)
              .json({ error: "Failed to update password." });
          }
          res.json({ message: "Password updated successfully." });
        }
      );
    }
  );
});

// ======================================================
// Route: GET /api/certificate-url -> Get certificate URL for logged-in user
// ======================================================
router.get("/api/certificate-url", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.userId;

  connection.query(
    "SELECT certificate_url FROM certificates WHERE user_id = ? ORDER BY completion_date DESC LIMIT 1",
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB error fetching cert URL:", err);
        return res.status(500).json({ error: "Failed to fetch certificate." });
      }

      if (results.length === 0 || !results[0].certificate_url) {
        return res.status(404).json({ error: "Certificate not found." });
      }

      res.json({ url: `/${results[0].certificate_url}` });
    }
  );
});

module.exports = router;
