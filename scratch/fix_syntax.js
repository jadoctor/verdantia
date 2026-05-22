const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// The end of the file currently looks like:
/*
        {activeTab === 'completadas' && (() => { ... })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
*/

// Let's use a regex to match the end of the completadas block and everything after it up to the end of the file, and replace it with just the correct closing tags.
// The good part ends at `        })()}`.
// The garbage is `              </div>\n            )}\n          </div>\n        )}\n`
// And the correct file ending is `\n      </div>\n    </div>\n  );\n}`

const fixRegex = /\}\)\(\)\}\s+<\/div>\s+\)\}\s+<\/div>\s+\)\}\s+<\/div>\s+<\/div>\s+\);\s+\}/;

if (fixRegex.test(content)) {
    content = content.replace(fixRegex, `})()}\n\n      </div>\n    </div>\n  );\n}`);
    fs.writeFileSync(pagePath, content);
    console.log("Syntax error fixed via regex!");
} else {
    console.log("Regex didn't match. Trying manual slicing...");
    const lastGoodIndex = content.lastIndexOf('})()}');
    if (lastGoodIndex !== -1) {
        content = content.substring(0, lastGoodIndex + 5) + '\n\n      </div>\n    </div>\n  );\n}\n';
        fs.writeFileSync(pagePath, content);
        console.log("Syntax error fixed via manual slicing!");
    } else {
        console.log("Failed to find the block!");
    }
}
