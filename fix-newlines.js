const fs = require('fs');
let c = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf-8');
c = c.replace('<PremiumHeroCarousel\\r\\n          photos={photos}\\r\\n          activePhotoId={activeFotoId}', '<PremiumHeroCarousel\n          photos={photos}\n          activePhotoId={activeFotoId}');
fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', c);
