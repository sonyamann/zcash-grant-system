const build = require('./build-utils');

async function runNow() {
  await build();
  const app = require('../build/server/server');
}
