const { login } = require("../src/login");

async function main() {
  let failures = 0;
  for (const id of [1, 2, 3, 4, 5, 6]) {
    try {
      const result = await login(id);
      console.log(`ok   ${id} ${result.token}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${id} ${error.name}: ${error.message}`);
    }
  }
  process.exitCode = failures > 0 ? 1 : 0;
}

main();
