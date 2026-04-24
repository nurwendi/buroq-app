const fs = require('fs');
const os = require('os');
const path = require('path');

const srcPath = path.join(os.homedir(), 'Downloads', '384.jpg');
const destPath = path.join(__dirname, 'assets', '384.jpg');
try {
  fs.copyFileSync(srcPath, destPath);
  console.log("Copied to", destPath);
} catch (e) {
  console.error(e);
}
