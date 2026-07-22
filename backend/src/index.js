require('dotenv').config()

const { buildApp } = require('./app')

async function start() {
  try {
    const app = await buildApp()
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
  } catch (error) {
    console.error('FATAL: Failed to start GrowWell backend.', error)
    process.exit(1)
  }
}

start()
