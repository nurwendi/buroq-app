const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(srcDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace large border radius values for cards
    content = content.replace(/borderRadius:\s*24\b/g, 'borderRadius: 12');
    content = content.replace(/borderRadius:\s*28\b/g, 'borderRadius: 12');
    content = content.replace(/borderRadius:\s*22\b/g, 'borderRadius: 12');
    content = content.replace(/borderRadius:\s*20\b/g, 'borderRadius: 12');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated border radius in', filePath);
    }
  }
});
