import * as fs from 'fs';
import * as path from 'path';

import en from './src/translations/en';
import id from './src/translations/id';

// Get all keys used in the source code using the previous grep logic translated to JS,
// or just run grep again via child_process.
import { execSync } from 'child_process';

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

const flattenObject = (obj: any, prefix = ''): string[] => {
    let result: string[] = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            result = result.concat(flattenObject(obj[key], `${prefix}${key}.`));
        } else {
            result.push(`${prefix}${key}`);
        }
    }
    return result;
}

const main = () => {
    const usedKeys = extractUsedKeys();
    const enKeys = new Set(flattenObject(en));
    const idKeys = new Set(flattenObject(id));

    console.log("--- Missing in EN ---");
    const missingEn = usedKeys.filter(k => !enKeys.has(k));
    console.log(missingEn.join('\n') || 'None');

    console.log("\n--- Missing in ID ---");
    const missingId = usedKeys.filter(k => !idKeys.has(k));
    console.log(missingId.join('\n') || 'None');
};

main();
