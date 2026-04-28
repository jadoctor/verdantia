const { uploadToStorage } = require('./src/lib/firebase/storage');

async function test() {
  try {
    console.log("Testing upload...");
    const url = await uploadToStorage(Buffer.from("test"), "uploads/test.txt", "text/plain");
    console.log("Success! URL:", url);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
