import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/admin/EspecieForm.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/especiestiposiembra: '',/g, "especiestiposiembra: [],");

const selectRegex = /<select name="especiestiposiembra"[\s\S]*?<\/select>/;
const replacementCheckboxes = \`
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {[
                              { val: 'directa', label: 'Semilla: Siembra Directa' },
                              { val: 'semillero', label: 'Semilla: Semillero / Almácigo' },
                              { val: 'esqueje', label: 'Esqueje / Chupón / Estolón' },
                              { val: 'bulbo', label: 'Tubérculo / Bulbo / Rizoma' },
                              { val: 'division', label: 'División de Mata' }
                            ].map(t => (
                              <label key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer', color: '#475569' }}>
                                <input
                                  type="checkbox"
                                  name="especiestiposiembra"
                                  value={t.val}
                                  checked={formData.especiestiposiembra?.includes(t.val)}
                                  onChange={handleChange}
                                />
                                {t.label}
                              </label>
                            ))}
                          </div>
\`.trim();

content = content.replace(selectRegex, replacementCheckboxes);

// Update save payload logic
const saveRegex = /if \\(Array\\.isArray\\(submitData\\.especiestipo\\)\\) submitData\\.especiestipo = submitData\\.especiestipo\\.join\\(',',\\);\\s*if \\(Array\\.isArray\\(submitData\\.especiesciclo\\)\\) submitData\\.especiesciclo = submitData\\.especiesciclo\\.join\\(',',\\);/g;
if (content.includes('submitData.especiestiposiembra = submitData.especiestiposiembra.join')) {
    // already updated
} else {
    content = content.replace(/if \(Array.isArray\(submitData.especiesciclo\)\) submitData.especiesciclo = submitData.especiesciclo.join\(',');/, "if (Array.isArray(submitData.especiesciclo)) submitData.especiesciclo = submitData.especiesciclo.join(',');\\n      if (Array.isArray(submitData.especiestiposiembra)) submitData.especiestiposiembra = submitData.especiestiposiembra.join(',');");
}

fs.writeFileSync(file, content, 'utf8');

// VARIANTES
const varFile = path.join(process.cwd(), 'src/components/admin/VariedadForm.tsx');
let varContent = fs.readFileSync(varFile, 'utf8');

varContent = varContent.replace(/variedadestiposiembra: '',/g, "variedadestiposiembra: [],");

// Add field to options parsing
if (!varContent.includes('name === \\'variedadestiposiembra\\'')) {
    varContent = varContent.replace(/if \\(name === 'variedadestipo' \\|\\| name === 'variedadesciclo'\\)/g, "if (name === 'variedadestipo' || name === 'variedadesciclo' || name === 'variedadestiposiembra')");
}

// Map the FieldCompare options
const fieldCompareRegex = /<FieldCompare\\s+label="Tipo de Siembra Principal"\\s+field="variedadestiposiembra"\\s+options=\\{\\[[\\s\\S]*?\\]\\}\\s+\\/>/;
const fieldCompareReplacement = \`
                        <FieldCompare 
                          label="Tipo de Propagación / Siembra" 
                          field="variedadestiposiembra" 
                          isCheckboxGroup
                          options={[
                            { value: 'directa', label: 'Semilla: Siembra Directa' },
                            { value: 'semillero', label: 'Semilla: Semillero / Almácigo' },
                            { value: 'esqueje', label: 'Esqueje / Chupón / Estolón' },
                            { value: 'bulbo', label: 'Tubérculo / Bulbo / Rizoma' },
                            { value: 'division', label: 'División de Mata' }
                          ]} 
                        />
\`.trim();

varContent = varContent.replace(fieldCompareRegex, fieldCompareReplacement);

// Update save payload logic
if (varContent.includes('submitData.variedadestiposiembra = submitData.variedadestiposiembra.join')) {
    // already updated
} else {
    varContent = varContent.replace(/if \\(Array\\.isArray\\(submitData\\.variedadesciclo\\)\\) submitData\\.variedadesciclo = submitData\\.variedadesciclo\\.join\\(',',\\);/, "if (Array.isArray(submitData.variedadesciclo)) submitData.variedadesciclo = submitData.variedadesciclo.join(',');\\n      if (Array.isArray(submitData.variedadestiposiembra)) submitData.variedadestiposiembra = submitData.variedadestiposiembra.join(',');");
}

fs.writeFileSync(varFile, varContent, 'utf8');

console.log('Fixed React component forms');
