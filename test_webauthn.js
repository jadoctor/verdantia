const firebaseAuth = require('firebase/auth');
console.log('Firebase Auth Exports:');
console.log(Object.keys(firebaseAuth).filter(k => k.toLowerCase().includes('webauthn')));
