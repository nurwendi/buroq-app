const fs = require('fs');
const { execSync } = require('child_process');

const extractUsedKeys = () => {
    try {
        const output = execSync('grep -rhoP "\\bt\\([\'\\"]\\K[^\'\\"]+" src/', { encoding: 'utf-8' });
        const keys = output.split('\n').filter(Boolean);
        return Array.from(new Set(keys)).sort();
    } catch (e) {
        console.error("Grep failed", e);
        return [];
    }
};

const extractDefinedKeys = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    // a very basic regex to find keys like `  someKey: 'Value',`
    // but the files are structured with nested objects.
    // It's easier to just use the typescript compiler.
    return content;
}

// Let's use tsx instead
