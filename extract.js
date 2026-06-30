const fs = require('fs');
const code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

const regexes = [
  /const loadAttachments = async.*?^  };/ms,
  /const handleFileUpload = async.*?^  };/ms,
  /const handleGlobalPaste =.*?^  };/ms,
  /const handlePhotoReorder =.*?^  };/ms,
  /const savePhotoEdits = async.*?^  };/ms,
  /const deletePhoto = async.*?^  };/ms,
  /const savePdfEdits = async.*?^  };/ms,
  /const deletePdf = async.*?^  };/ms,
  /const handleRunPdfSearch = async.*?^  };/ms,
  /const handleGenerateBlog = async.*?^  };/ms
];

regexes.forEach(r => {
  const match = code.match(r);
  if (match) console.log(`\n\n--- MATCH ---\n${match[0]}`);
  else console.log(`\n\n--- NO MATCH for ${r} ---`);
});
