import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/admin/EspecieForm.tsx');
let content = fs.readFileSync(file, 'utf-8');

// The problematic block is around line 3585:
//               </div><div className="form-footer">
//             {hasChanges && (
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="btn-save"
//               >
//                 {loading ? 'Guardando...' : 'Guardar Especie'}
//               </button>
//             )}
//           </div>
//         </form>
//       </div>

// Let's replace the segment starting from '              </div><div className="form-footer">'
// to '        </form>\r?\n      </div>' (with any whitespace/newline endings).

const targetRegex = /([ \t]*)<\/div><div className="form-footer">\s*\{hasChanges && \(\s*<button[\s\S]*?<\/button>\s*\)\}\s*<\/div>\s*<\/form>\s*<\/div>/;

const match = content.match(targetRegex);
if (match) {
  console.log('Found match:', match[0]);
  const spaces = match[1] || '';
  const replacement = `</div>

              <div className="form-footer">
                {hasChanges && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-save"
                  >
                    {loading ? 'Guardando...' : 'Guardar Especie'}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>`;
  
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Replacement successful!');
} else {
  console.error('Target block not found via regex!');
}
