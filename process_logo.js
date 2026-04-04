const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'assets', 'thermal.jpg');

try {
  const fileData = fs.readFileSync(srcPath);
  const base64Str = fileData.toString('base64');
  
  const outPath = path.join(__dirname, 'src', 'constants', 'logo.ts');
  const content = `export const BUROQ_LOGO_BASE64 = '${base64Str}';\n`;
  fs.writeFileSync(outPath, content);
  
  console.log("Logo updated with base64 length: " + base64Str.length);
} catch (e) {
  console.error("Error generating logo from thermal.jpg:", e);
}
