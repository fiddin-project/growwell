const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')

function loadTestEnvironment() {
  const envPath = path.resolve(__dirname, '..', '.env.test')
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing backend/.env.test. Copy backend/.env.test.example first.')
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath))
  const databaseUrl = parsed.DATABASE_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in backend/.env.test')
  }

  let databaseName
  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\//, '')
  } catch {
    throw new Error('DATABASE_URL in backend/.env.test is not a valid URL')
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing test database operation: database name must end in _test, received ${databaseName || '<empty>'}`)
  }

  return { ...process.env, ...parsed, NODE_ENV: 'test' }
}

module.exports = { loadTestEnvironment }
