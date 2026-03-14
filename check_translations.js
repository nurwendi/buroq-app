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
    // Basic regex to find keys like `  someKey: '...`
    // Since it's nested (e.g., users: { addUserModal: '...' }), we'll just extract all simple word keys
    // A better approach with regex for the specific format:
    // We can just look for word characters before a colon
    const keys = new Set();
    const lines = content.split('\n');
    let currentObject = '';
    
    for (let line of lines) {
        if (line.includes(': {')) {
            currentObject = line.trim().split(':')[0] + '.';
        } else if (line.includes('},')) {
            currentObject = '';
        } else if (currentObject && line.includes(':')) {
            let key = line.trim().split(':')[0];
            // Remove quotes if present
            key = key.replace(/['"]/g, '');
            if (key && !key.includes('//')) {
                keys.add(currentObject + key);
            }
        }
    }
    return keys;
}

const main = () => {
    const usedKeys = extractUsedKeys();
    const enKeys = extractDefinedKeys('./src/translations/en.ts');
    const idKeys = extractDefinedKeys('./src/translations/id.ts');

    console.log("--- Missing in EN ---");
    const missingEn = usedKeys.filter(k => !enKeys.has(k) && k.includes('.'));
    console.log(missingEn.length > 0 ? missingEn.join('\n') : 'None');

    console.log("\n--- Missing in ID ---");
    const missingId = usedKeys.filter(k => !idKeys.has(k) && k.includes('.'));
    console.log(missingId.length > 0 ? missingId.join('\n') : 'None');
};

main();
