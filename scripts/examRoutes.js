// routes/examRoutes.js
const express = require("express");
const connection = require("./database");
const { generateCertificate } = require("./utils/certificate");

const router = express.Router();

// Helper
function queryPromise(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  next();
}

/**
 * GET /api/get-questions
 */
router.get("/api/get-questions", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;

    // 1) Check user level in DB
    const userRows = await queryPromise(
      "SELECT user_level FROM users WHERE id = ?",
      [userId]
    );
    let userLevel = null;
    if (userRows.length && userRows[0].user_level) {
      userLevel = userRows[0].user_level.toLowerCase().trim();
    }

    // If userLevel is null => user hasn't completed wizard => no questions
    if (userLevel === null) {
      return res.json({
        userLevel: null,
        questions: [],
        message: "Complete wizard first",
      });
    }

    // If userLevel not in allowed set, default to 'beginner'
    if (
      !["beginner", "intermediate", "advanced", "certified"].includes(userLevel)
    ) {
      userLevel = "beginner";
    }

    // e.g. block "certified" from retaking or do your custom logic
    if (userLevel === "certified") {
      return res.json({
        userLevel: "certified",
        questions: [],
        message: "Already certified, no further exams available.",
      });
    }

    // 2) Decide question count
    const questionCount = userLevel === "beginner" ? 65 : 71;

    // 3) Fetch questions
    const questions = await queryPromise(
      `
      SELECT id, question_text, option_a, option_b, option_c, option_d
      FROM questions
      WHERE difficulty_level = ?
      ORDER BY RAND()
      LIMIT ?
      `,
      [userLevel, questionCount]
    );

    // 4) Return userLevel & questions
    res.json({ userLevel, questions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Database error fetching questions." });
  }
});

/**
 * POST /api/submit-exam
 */
/**
 * POST /api/submit-exam
 */
router.post("/api/submit-exam", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [userInfo] = await queryPromise(
      "SELECT first_name, last_name, user_level FROM users WHERE id = ?",
      [userId]
    );
    if (!userInfo) {
      return res.status(400).json({ error: "User not found in DB." });
    }

    const firstName = userInfo.first_name || "";
    const lastName = userInfo.last_name || "";
    const oldLevel = (userInfo.user_level || "beginner").toLowerCase().trim();
    const fullName = (firstName + " " + lastName).trim() || "User";

    let { answers } = req.body;
    if (!Array.isArray(answers)) answers = [];

    let correctCount = 0;
    let totalQuestions = 0;

    for (const ans of answers) {
      const { question_id, selected_answer } = ans;
      if (!question_id) continue;

      const [questionRow] = await queryPromise(
        "SELECT correct_answer FROM questions WHERE id = ?",
        [question_id]
      );
      if (!questionRow) continue;

      const isCorrect = selected_answer === questionRow.correct_answer ? 1 : 0;
      if (isCorrect) correctCount++;
      totalQuestions++;

      await queryPromise(
        `INSERT INTO user_answers (user_id, question_id, selected_answer, is_correct)
         VALUES (?, ?, ?, ?)`,
        [userId, question_id, selected_answer ?? null, isCorrect]
      );
    }

    const scorePercent =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = scorePercent >= 75;

    let newLevel = oldLevel;
    let passMessage = "";
    let certificateUrl = null;

    if (passed) {
      await queryPromise(
        `INSERT INTO certificates (user_id, completion_date, score, status)
         VALUES (?, NOW(), ?, 'passed')`,
        [userId, scorePercent]
      );

      if (oldLevel === "advanced") {
        newLevel = "certified";
        passMessage = `
          <strong>${fullName}, congratulations you passed!</strong><br><br>
          You’ve completed the Advanced level and are now <strong>Certified</strong>!
          Your hard work truly paid off.`;
      } else {
        newLevel = oldLevel === "beginner" ? "intermediate" : "advanced";
        passMessage = `
          <strong>Congratulations, ${firstName} ${lastName} you passed!</strong><br>
          You've been promoted to <strong>${capitalize(newLevel)}</strong>.
          Keep pushing forward—each step brings you closer to mastery!`;
      }

      await queryPromise("UPDATE users SET user_level = ? WHERE id = ?", [
        newLevel,
        userId,
      ]);

      // 🔥 Generate certificate and store URL
      certificateUrl = await generateCertificate(
        userId,
        fullName,
        oldLevel, // Use oldLevel for the certificate design
        new Date().toLocaleDateString()
      );

      await queryPromise(
        "UPDATE certificates SET certificate_url = ? WHERE user_id = ? AND status = 'passed'",
        [certificateUrl, userId]
      );
      await queryPromise(
        "UPDATE users SET certificate_url = ?, certificate_issued_at = NOW() WHERE id = ?",
        [certificateUrl, userId]
      );
    } else {
      passMessage = `
        <strong>Unfortunately, ${firstName} ${lastName}, you did not pass.</strong>
        <br>You scored ${scorePercent.toFixed(1)}%.
        Keep learning, and try again!`;
    }

    return res.json({
      scorePercent,
      passed,
      passMessage,
      oldLevel,
      newLevel,
      firstName,
      lastName,
      certificateUrl,
    });
  } catch (err) {
    console.error("submit-exam error:", err);
    return res.status(500).json({ error: "Database error on submit-exam." });
  }
});

/**
 * GET /api/get-correct-answers
 */
router.get("/api/get-correct-answers", requireLogin, async (req, res) => {
  try {
    const questions = await queryPromise(
      "SELECT id, correct_answer FROM questions"
    );
    res.json({ questions });
  } catch (err) {
    console.error("Error fetching correct answers:", err);
    res.status(500).json({ error: "Database error fetching correct answers." });
  }
});

/**
 * POST /api/save-wizard-choices
 */
router.post("/api/save-wizard-choices", requireLogin, async (req, res) => {
  let { level, firstName, lastName } = req.body;
  if (!level) level = "beginner";
  level = level.toLowerCase().trim();
  if (!["beginner", "intermediate", "advanced"].includes(level)) {
    level = "beginner";
  }

  if (firstName) firstName = firstName.trim();
  if (lastName) lastName = lastName.trim();

  try {
    const [user] = await queryPromise(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [req.session.userId]
    );

    const updateFields = ["user_level = ?"];
    const values = [level];

    // Only overwrite if DB has not set them yet
    if (firstName && !user.first_name) {
      updateFields.push("first_name = ?");
      values.push(firstName);
    }
    if (lastName && !user.last_name) {
      updateFields.push("last_name = ?");
      values.push(lastName);
    }

    values.push(req.session.userId);

    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    await queryPromise(sql, values);

    return res.json({ message: "Wizard setup saved", newLevel: level });
  } catch (err) {
    console.error("Failed to save wizard data:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

function capitalize(str) {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = router;
