// utils/certificate.js
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function generateCertificate(userId, fullName, level, issueDate) {
  const inputPath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "cert_templates",
    `${level}.png`
  );
  const outputDir = path.join(__dirname, "..", "..", "public", "certificates");
  const outputPath = path.join(outputDir, `${userId}-${level}.png`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const template = await loadImage(inputPath);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(template, 0, 0);

  ctx.font = "70px 'Georgia'";
  ctx.textAlign = "center";
  ctx.fillText(fullName, canvas.width / 2, 690);

  ctx.font = "40px 'Georgia'";
  ctx.textAlign = "left";
  ctx.fillText(issueDate, 400, canvas.height - 290);

  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve) => {
    out.on("finish", () => resolve(`certificates/${userId}-${level}.png`));
  });
}

module.exports = { generateCertificate };
