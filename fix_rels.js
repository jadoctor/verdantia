const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const benNames = selectedRels.ben;', 'const benNames = Array.isArray(selectedRels?.ben) ? selectedRels.ben : [];');
content = content.replace('const perNames = selectedRels.per;', 'const perNames = Array.isArray(selectedRels?.per) ? selectedRels.per : [];');
content = content.replace('const plaNames = selectedRels.pla;', 'const plaNames = Array.isArray(selectedRels?.pla) ? selectedRels.pla : [];');
content = content.replace('const normalize = (str: string) => str.toLowerCase().trim();', 'const normalize = (str: string) => (str || "").toLowerCase().trim();');

content = content.replace('for (const name of benNames) {\r\n        let sp = masterE.find', 'for (const name of benNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let sp = masterE.find');
content = content.replace('for (const name of benNames) {\n        let sp = masterE.find', 'for (const name of benNames) {\n        if (!name || typeof name !== "string") continue;\n        let sp = masterE.find');

content = content.replace('for (const name of perNames) {\r\n        let sp = masterE.find', 'for (const name of perNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let sp = masterE.find');
content = content.replace('for (const name of perNames) {\n        let sp = masterE.find', 'for (const name of perNames) {\n        if (!name || typeof name !== "string") continue;\n        let sp = masterE.find');

content = content.replace('for (const name of plaNames) {\r\n        let p = masterP.find', 'for (const name of plaNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let p = masterP.find');
content = content.replace('for (const name of plaNames) {\n        let p = masterP.find', 'for (const name of plaNames) {\n        if (!name || typeof name !== "string") continue;\n        let p = masterP.find');

fs.writeFileSync(file, content);
console.log('Fixed array protections.');
