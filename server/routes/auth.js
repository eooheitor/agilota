import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { requireAuth, createToken } from '../middleware/auth.js'

export const authRouter = Router()

const VALID_ROLES = ['recebedor', 'pagador']

authRouter.post('/register', async (req, res) => {
  const { name, email, password, role = 'pagador' } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando' })
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Role inválida' })
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ message: 'Email já cadastrado' })
  }
  const password_hash = await bcrypt.hash(password, 10)
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, password_hash, role)
  const user = { id: result.lastInsertRowid, name, email, role }
  res.json({ token: createToken(user), user })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Email ou senha incorretos' })
  }
  const { password_hash: _, ...safe } = user
  res.json({ token: createToken(safe), user: safe })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(req.user.id)
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })
  res.json(user)
})

authRouter.put('/profile', requireAuth, async (req, res) => {
  const { name, current_password, new_password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })

  const updates = {}

  if (name && name.trim()) {
    updates.name = name.trim()
  }

  if (new_password) {
    if (!current_password) {
      return res.status(400).json({ message: 'Informe a senha atual para alterar a senha' })
    }
    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) return res.status(400).json({ message: 'Senha atual incorreta' })
    if (new_password.length < 6) return res.status(400).json({ message: 'Nova senha deve ter ao menos 6 caracteres' })
    updates.password_hash = await bcrypt.hash(new_password, 10)
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Nenhum dado para atualizar' })
  }

  const fields = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
  db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...Object.values(updates), req.user.id)

  const updated = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id)
  const { createToken } = await import('../middleware/auth.js')
  res.json({ user: updated, token: createToken(updated) })
})

authRouter.get('/users', requireAuth, (req, res) => {
  if (req.user.role !== 'recebedor') {
    return res.status(403).json({ message: 'Acesso negado' })
  }
  const users = db
    .prepare('SELECT id, name, email, role FROM users WHERE id != ? ORDER BY name')
    .all(req.user.id)
  res.json(users)
})
