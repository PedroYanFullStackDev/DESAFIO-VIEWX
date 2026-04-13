require('dotenv').config()
const express = require('express')
const cors = require('cors')
const reelsRouter = require('./routes/reels')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  methods: ['GET'],
}))

app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/reels', reelsRouter)

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message || 'Erro interno do servidor' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Rodando na porta ${PORT}`)
})
