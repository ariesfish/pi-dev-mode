class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

const users = new Map([
  [1, { id: 1, name: "ada" }],
  [2, { id: 2, name: "grace" }],
  [3, { id: 3, name: "linus" }],
  [4, { id: 4, name: "margaret" }],
  [5, { id: 5, name: "alan" }],
  [6, { id: 6, name: "barbara" }],
]);

async function login(userId) {
  const started = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 5));

  if (!users.has(Number(userId))) {
    throw new Error(`unknown user ${userId}`);
  }

  if (Number(userId) % 3 === 0) {
    throw new TimeoutError(`upstream timeout after ${Date.now() - started}ms`);
  }

  return { token: `tok_${userId}`, userId: Number(userId) };
}

module.exports = { login, TimeoutError };

if (require.main === module) {
  login(process.argv[2] || 1)
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(`${error.name}: ${error.message}`);
      process.exit(1);
    });
}
