const fs = require('fs');

const file = 'c:\\billing_pro\\billing-app\\src\\screens\\CustomerDetailScreen.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

let acsStartIndex = -1;
let acsEndIndex = -1;
let infoSectionIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("<Text style={styles.sectionTitle}>{t('users.deviceInfoAcs')}</Text>")) {
        // The View starts one line before
        acsStartIndex = i - 1;
    }
    
    // Find the end of the ACS block. We know it ends before usageBox
    if (lines[i].includes("         <View style={styles.usageBox}>")) {
        acsEndIndex = i - 2;
    }

    if (lines[i].includes("        <View style={styles.infoSection}>")) {
        infoSectionIndex = i;
    }
}

console.log("ACS Start:", acsStartIndex);
console.log("ACS End:", acsEndIndex);
console.log("Info Start:", infoSectionIndex);

if (acsStartIndex > -1 && acsEndIndex > -1 && infoSectionIndex > -1) {
    // Extract the ACS block + Payment History MenuItem which is right before it
    // Wait, the user said "pengaturan router letakkan ke bagian atas dibawah status tagihan".
    // So ONLY the router settings block (ACS) moves up.
    
    const acsBlock = lines.splice(acsStartIndex, acsEndIndex - acsStartIndex + 1);
    
    // After splicing, the infoSectionIndex will be the same because it was BEFORE the ACS block.
    // Insert ACS block right before infoSectionIndex
    lines.splice(infoSectionIndex, 0, ...acsBlock);
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find indices");
}
