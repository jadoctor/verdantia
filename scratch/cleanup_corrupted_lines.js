const fs = require('fs');
const path = 'src/components/admin/VariedadForm.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    const newLines = lines.filter(line => {
        if (line.includes('fico"') && line.includes('field="variedadesnombrecientifico"') && !line.includes('<FieldCompare')) {
            console.log(`Removing corrupted line: ${line.trim()}`);
            return false;
        }
        return true;
    });

    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log("Cleanup successful.");
} catch (e) {
    console.error(`Error: ${e.message}`);
}
