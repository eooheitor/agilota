import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const consortiumsRouter = Router()
consortiumsRouter.use(requireAuth)

consortiumsRouter.get('/', (req, res) => {
  let consortiums
  if (req.user.role === 'recebedor') {
    consortiums = db
      .prepare('SELECT * FROM consortiums WHERE created_by = ? ORDER BY created_at DESC')
      .all(req.user.id)
  } else {
    consortiums = db
      .prepare(`
        SELECT c.* FROM consortiums c
        JOIN consortium_members cm ON cm.consortium_id = c.id
        WHERE cm.user_id = ? AND cm.status = 'accepted'
        ORDER BY c.created_at DESC
      `)
      .all(req.user.id)
  }
  res.json(consortiums)
})

consortiumsRouter.post('/', (req, res) => {
  if (req.user.role !== 'recebedor') {
    return res.status(403).json({ message: 'Apenas o recebedor pode criar consórcios' })
  }
  const { name, total_value, installment_value, start_date, total_installments, description, interest_rate } = req.body
  if (!name || !total_value || !installment_value || !start_date || !total_installments) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando' })
  }
  const result = db
    .prepare(`
      INSERT INTO consortiums (name, total_value, installment_value, start_date, total_installments, description, interest_rate, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(name, total_value, installment_value, start_date, total_installments, description ?? null, interest_rate ?? 0, req.user.id)
  res.json(db.prepare('SELECT * FROM consortiums WHERE id = ?').get(result.lastInsertRowid))
})

// Convites pendentes para o pagador
consortiumsRouter.get('/invites', (req, res) => {
  if (req.user.role !== 'pagador') return res.json([])
  const invites = db
    .prepare(`
      SELECT c.*, cm.status as invite_status, u.name as recebedor_name
      FROM consortium_members cm
      JOIN consortiums c ON c.id = cm.consortium_id
      JOIN users u ON u.id = c.created_by
      WHERE cm.user_id = ? AND cm.status = 'pending'
      ORDER BY cm.created_at DESC
    `)
    .all(req.user.id)
  res.json(invites)
})

consortiumsRouter.post('/:id/invite/accept', (req, res) => {
  const member = db
    .prepare('SELECT * FROM consortium_members WHERE consortium_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)
  if (!member) return res.status(404).json({ message: 'Convite não encontrado' })
  if (member.status !== 'pending') return res.status(400).json({ message: 'Convite já processado' })
  db.prepare("UPDATE consortium_members SET status = 'accepted' WHERE consortium_id = ? AND user_id = ?")
    .run(req.params.id, req.user.id)
  res.json({ success: true })
})

consortiumsRouter.post('/:id/invite/reject', (req, res) => {
  const member = db
    .prepare('SELECT * FROM consortium_members WHERE consortium_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)
  if (!member) return res.status(404).json({ message: 'Convite não encontrado' })
  if (member.status !== 'pending') return res.status(400).json({ message: 'Convite já processado' })
  db.prepare("UPDATE consortium_members SET status = 'rejected' WHERE consortium_id = ? AND user_id = ?")
    .run(req.params.id, req.user.id)
  res.json({ success: true })
})

// Gestão de membros (recebedor dono do consórcio)

consortiumsRouter.get('/:id/members', (req, res) => {
  const consortium = db.prepare('SELECT * FROM consortiums WHERE id = ?').get(req.params.id)
  if (!consortium) return res.status(404).json({ message: 'Consórcio não encontrado' })
  if (req.user.role !== 'recebedor' || consortium.created_by !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' })
  }
  const members = db
    .prepare(`
      SELECT u.id, u.name, u.email, u.role as user_role, cm.role as member_role, cm.status
      FROM consortium_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.consortium_id = ?
      ORDER BY u.name
    `)
    .all(req.params.id)
  res.json(members)
})

consortiumsRouter.post('/:id/members', (req, res) => {
  const consortium = db.prepare('SELECT * FROM consortiums WHERE id = ?').get(req.params.id)
  if (!consortium) return res.status(404).json({ message: 'Consórcio não encontrado' })
  if (req.user.role !== 'recebedor' || consortium.created_by !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' })
  }
  const { user_id } = req.body
  const role = 'pagador'
  if (!user_id) {
    return res.status(400).json({ message: 'Dados inválidos' })
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' })

  db.prepare(`
    INSERT INTO consortium_members (consortium_id, user_id, role, status) VALUES (?, ?, ?, 'pending')
    ON CONFLICT(consortium_id, user_id) DO UPDATE SET role = excluded.role, status = 'pending'
  `).run(req.params.id, user_id, role)

  const member = db
    .prepare(`
      SELECT u.id, u.name, u.email, u.role as user_role, cm.role as member_role, cm.status
      FROM consortium_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.consortium_id = ? AND cm.user_id = ?
    `)
    .get(req.params.id, user_id)
  res.json(member)
})

consortiumsRouter.delete('/:id/members/:userId', (req, res) => {
  const consortium = db.prepare('SELECT * FROM consortiums WHERE id = ?').get(req.params.id)
  if (!consortium) return res.status(404).json({ message: 'Consórcio não encontrado' })
  if (req.user.role !== 'recebedor' || consortium.created_by !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' })
  }
  db.prepare('DELETE FROM consortium_members WHERE consortium_id = ? AND user_id = ?')
    .run(req.params.id, req.params.userId)
  res.json({ success: true })
})

// Pagamentos

consortiumsRouter.get('/:id/payments', (req, res) => {
  res.json(
    db
      .prepare(`
        SELECT p.*, u.name as user_name, cu.name as confirmed_by_name
        FROM payments p
        JOIN users u ON p.created_by = u.id
        LEFT JOIN users cu ON p.confirmed_by = cu.id
        WHERE p.consortium_id = ?
        ORDER BY p.payment_date DESC, p.created_at DESC
      `)
      .all(req.params.id)
  )
})

consortiumsRouter.post('/:id/payments', (req, res) => {
  const member = db
    .prepare('SELECT role, status FROM consortium_members WHERE consortium_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id)

  if (!member || member.role !== 'pagador' || member.status !== 'accepted') {
    return res.status(403).json({ message: 'Apenas pagadores aceitos podem registrar pagamentos' })
  }

  const { payment_date, installment_amount, extra_amount, note } = req.body
  if (!payment_date || installment_amount == null) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando' })
  }

  const result = db
    .prepare(`
      INSERT INTO payments (consortium_id, payment_date, installment_amount, extra_amount, note, status, created_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `)
    .run(req.params.id, payment_date, installment_amount, extra_amount ?? 0, note ?? null, req.user.id)

  res.json(
    db
      .prepare(`
        SELECT p.*, u.name as user_name
        FROM payments p JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `)
      .get(result.lastInsertRowid)
  )
})
