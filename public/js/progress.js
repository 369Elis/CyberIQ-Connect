const pages = [
  "Cybersecurity Platform",
  "Virus",
  "Trojan",
  "Worm",
  "Zero-Day Attack",
  "Ransomware",
  "Botnet",
  "Botnet Command and Control",
  "Rootkit",
  "Keylogger",
  "Logic Bomb",
  "Backdoor",
  "Advanced Malware Analysis",
  "Advanced Rootkit Analysis",
  "AdwareSpyware",
  "ManInTheMiddle Attack",
  "passwrod attack",
  "shoulder surfing",
  "phishing",
  "Denial of Service",
  "tailgating",
  "watering hole attack",
  "buffer overflow",
  "cross site scripting",
  "cross site request forgery",
  "SQL injection",
  "privilege escalation",
  "replay-attacks",
  "client-hijacking",
  "driver manipulation",
  "spoofing",
  "acces point & evil twin",
  " wireless jamming",
  "bluejacking & bluesnarfing",
  "rfid-nfc attacks",
  " wireless disassociation",
  "cryptographic attacks",
  "agreement types",
  "essential security plolicies",
  "role-based awareness training",
  "security policies",
  "risk management",
  "incident response",
  "it policy & procedures",
  "disaster recovery",
  "incident response lifecycle",
  "geographical considerations",
  "data retention",
  "business continuity",
  "forensic data",
  "forencis data use",
  "data destruction",
  "handle sensitive data",
  "iso vs nist",
  "nist-framework",
  "iso-intoduction",
  "owasp top 10",
  "cis controls",
  "nist sp 800-53",
  "pdi dss",
  "mmitre att&ck",
  "rnist risk management",
  "sabsa",
  "zero trust",
  "crptography concepts",
  "types of encryption",
  "states of data",
  "cryptography use cases",
  "cryptography failures",
  "types of certificates",
  "PKI Concepts",
  "symmetric - asymmetric",
  "hashing",
  "block cypers modes",
  "crptographic keys",
  "authentication protocols",
  "wireless security",
  "certificate formats",
  "compromised of PKI",
  "steganography",
  "perfect forward secrecy",
  "key stretching algorithms",
  "randomized encryption",
  "obfuscation",
  "aaa authentication",
  "IAM",
  "authentication protocols",
  "federated identity",
  "rbac & abac",
  "account management",
  "account enforcement policy",
  "PAM",
  "advanced authentication protocols",
  "identity governance & administration",
  "zero trust architecture",
  "firewall",
  "vpn concentrator",
  "access point",
  "mail gateway",
  "proxy server",
  "security software",
  "mobile device management",
  "security protocols",
  "router switch",
  "load balancer",
  "network access control",
  "idps",
  "data loss prevention",
  "mobile device conections",
  "model deployment models",
  "model device enforcement",
  "command line tools",
  "common security issues",
  "security information & event management",
  "other security devices",
  "analyze security output",
  "zero trust network access",
  "advanced data loss prevention",
];

// Ensure each page is tracked for a new user
router.post("/api/register-progress", requireLogin, (req, res) => {
  const userId = req.session.userId;

  pages.forEach((page) => {
    connection.query(
      "INSERT IGNORE INTO user_progress (user_id, module_name, progress, status) VALUES (?, ?, 0, 'not started')",
      [userId, page],
      (err) => {
        if (err) {
          console.error(`Failed to register ${page} progress:`, err);
        }
      }
    );
  });

  res.json({ success: true, message: "User progress initialized." });
});

// progress.js - Handles saving user progress to MySQL database via API

async function saveProgressToDB(moduleName, progress) {
  try {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moduleName, progress }),
    });

    if (!response.ok) {
      throw new Error("Failed to save progress to database.");
    }

    const data = await response.json();
    console.log(`Progress saved: ${data.moduleName} - ${data.progress}%`);
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

// Function to update progress when the "Complete & Next" button is clicked
function completeAndNext(moduleName, nextPageURL) {
  const progress = 100; // Mark module as completed
  saveProgressToDB(moduleName, progress);
  window.location.href = nextPageURL; // Move to the next page
}

// Function for skipping a module
function skipModule(nextPageURL) {
  window.location.href = nextPageURL; // Move to the next page without saving
}

// Attach event listeners to buttons
document.addEventListener("DOMContentLoaded", () => {
  const moduleName = document.body.getAttribute("data-module"); // Get module name from HTML
  const nextPageURL = document.body.getAttribute("data-next-page"); // Next page URL

  document.getElementById("completeNextBtn").addEventListener("click", () => {
    completeAndNext(moduleName, nextPageURL);
  });

  document.getElementById("skipNextBtn").addEventListener("click", () => {
    skipModule(nextPageURL);
  });
});
