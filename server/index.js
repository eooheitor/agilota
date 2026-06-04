import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { authRouter } from './routes/auth.js'
import { consortiumsRouter } from './routes/consortiums.js'
import { paymentsRouter } from './routes/payments.js'
import { initDb } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

initDb()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/consortiums', consortiumsRouter)
app.use('/api/payments', paymentsRouter)

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server em http://localhost:${PORT}`))
