const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = path.join(os.homedir(), 'Downloads');
try {
  const files = fs.readdirSync(dir);
  console.log(files.filter(f => f.includes('384')));
} catch (e) {
  console.error(e);
}
