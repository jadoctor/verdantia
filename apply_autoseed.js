const fs = require('fs');
const path = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');
let changes = 0;

// 1. Add useSearchParams import
if (!content.includes('useSearchParams')) {
  content = content.replace(
    "import { useRouter } from 'next/navigation';",
    "import { useRouter, useSearchParams } from 'next/navigation';"
  );
  console.log('✅ Import useSearchParams');
  changes++;
}

// 2. Add searchParams and auto-open effect after "const router = useRouter();"
if (!content.includes('searchParams')) {
  content = content.replace(
    'const router = useRouter();',
    `const router = useRouter();
  const searchParams = useSearchParams();`
  );
  console.log('✅ Added searchParams');
  changes++;
}

// 3. Add useEffect to auto-open wizard when ?addSeed=true
// Find a good place - after the last useEffect that sets loading to false
if (!content.includes('addSeed')) {
  // Add after the openSeedModal function definition
  const marker = 'const openSeedModal = async () => {';
  const markerIdx = content.indexOf(marker);
  if (markerIdx === -1) {
    console.log('❌ No encontré openSeedModal');
  } else {
    // Find the end of the function by looking for the closing brace
    // Instead, insert a useEffect before openSeedModal
    content = content.replace(
      marker,
      `// Auto-abrir wizard si viene de ?addSeed=true
  useEffect(() => {
    if (searchParams.get('addSeed') === 'true' && !showSeedModal) {
      openSeedModal();
      // Limpiar el parámetro de la URL
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams]);

  ${marker}`
    );
    console.log('✅ Added auto-open useEffect');
    changes++;
  }
}

if (changes > 0) {
  fs.writeFileSync(path, content);
  console.log(`\n✅ ${changes} cambios aplicados`);
} else {
  console.log('\n⚠️ Sin cambios');
}
