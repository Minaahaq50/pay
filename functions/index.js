const functions = require("firebase-functions");
const fs = require("fs");
const path = require("path");

// هذه هي الوظيفة التي ستعيد الملف بدلًا من عرضه مباشر
exports.secureJson = functions.https.onRequest((req, res) => {
  const filePath = path.join(__dirname, "../secure/coursatk_scraped_data.json");

  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.set("Content-Type", "application/json");
    res.send(data);
  } catch (e) {
    res.status(404).send("File not found");
  }
});
