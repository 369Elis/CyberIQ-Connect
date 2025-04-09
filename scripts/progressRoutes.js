// routes/progressRoutes.js
const express = require("express");
const connection = require("./database");

const router = express.Router();

/**
 * Middleware: Ensure the user is logged in.
 * If not logged in, return 401 Unauthorized.
 */
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  next();
}

/**
 * GET /api/progress
 * Returns all module progress for the logged-in user.
 */
router.get("/api/progress", requireLogin, (req, res) => {
  const userId = req.session.userId;

  connection.query(
    "SELECT module_name, progress, status FROM user_progress WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Failed to fetch user progress:", err);
        return res.status(500).json({ error: "Database error" });
      }
      // Return an array of { module_name, progress, status }
      res.json(results);
    }
  );
});

/**
 * GET /api/progress/:moduleName
 * Returns the progress for a specific module for the logged-in user.
 */
router.get("/api/progress/:moduleName", requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { moduleName } = req.params;

  connection.query(
    "SELECT module_name, progress, status FROM user_progress WHERE user_id = ? AND module_name = ?",
    [userId, moduleName],
    (err, results) => {
      if (err) {
        console.error("Failed to fetch user progress:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length === 0) {
        // If no record, assume the user hasn't started this module
        return res.json({
          module_name: moduleName,
          progress: 0,
          status: "not started",
        });
      }
      res.json(results[0]);
    }
  );
});

/**
 * POST /api/progress
 * Updates the progress of a specific module for the logged-in user.
 * Expects JSON body: { moduleName, progress }
 */
router.post("/api/progress", requireLogin, (req, res) => {
  const userId = req.session.userId;
  const { moduleName, progress } = req.body;

  // Basic validation
  if (!moduleName || progress == null) {
    return res
      .status(400)
      .json({ error: "moduleName and progress are required." });
  }

  // Calculate status based on progress
  let status = "in progress";
  if (progress === 0) {
    status = "not started";
  } else if (progress >= 100) {
    status = "completed";
  }

  // Upsert logic: If there's no row for (userId, moduleName), insert one
  connection.query(
    "SELECT id FROM user_progress WHERE user_id = ? AND module_name = ?",
    [userId, moduleName],
    (err, results) => {
      if (err) {
        console.error("Error checking user_progress:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        // Insert new row
        connection.query(
          `INSERT INTO user_progress (user_id, module_name, progress, status)
           VALUES (?, ?, ?, ?)`,
          [userId, moduleName, progress, status],
          (insertErr) => {
            if (insertErr) {
              console.error("Failed to insert user progress:", insertErr);
              return res.status(500).json({ error: "Database insert error" });
            }
            return res.json({ moduleName, progress, status });
          }
        );
      } else {
        // Update existing row
        connection.query(
          `UPDATE user_progress
           SET progress = ?, status = ?
           WHERE user_id = ? AND module_name = ?`,
          [progress, status, userId, moduleName],
          (updateErr) => {
            if (updateErr) {
              console.error("Failed to update user progress:", updateErr);
              return res.status(500).json({ error: "Database update error" });
            }
            return res.json({ moduleName, progress, status });
          }
        );
      }
    }
  );
});

module.exports = router;
