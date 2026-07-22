const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { loadTestEnvironment } = require('./test-database-env')

const command = process.argv[2]
const env = loadTestEnvironment()
const backendRoot = path.resolve(__dirname, '..')
const prismaCli = path.resolve(backendRoot, 'node_modules', 'prisma', 'build', 'index.js')
const seedScript = path.resolve(backendRoot, 'prisma', 'seed.js')
const vitestCli = path.resolve(backendRoot, 'node_modules', 'vitest', 'vitest.mjs')

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (command === 'prepare') {
  run([prismaCli, 'migrate', 'reset', '--force', '--skip-seed'])
} else if (command === 'seed') {
  run([seedScript])
} else if (command === 'integration') {
  // Every integration run starts from deterministic IDs and fixtures.
  // The database-name guard above makes this destructive reset test-only.
  run([prismaCli, 'migrate', 'reset', '--force', '--skip-seed'])
  run([seedScript])
  run([vitestCli, 'run', 'src/routes', '--no-file-parallelism'])
} else {
  throw new Error('Usage: node tests/run-with-test-database.js <prepare|seed|integration>')
}
