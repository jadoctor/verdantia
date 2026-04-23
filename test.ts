import { getUserByEmail } from './src/lib/auth';

async function main() {
  try {
    const user = await getUserByEmail('jaillueca@gmail.com');
    console.log(user);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
