import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const paymentsRouter = Router()
paymentsRouter.use(requireAuth)

paymentsRouter.put('/:id/confirm', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' })

  const consortium = db.prepare('SELECT created_by FROM consortiums WHERE id = ?').get(payment.consortium_id)
  if (!consortium || req.user.role !== 'recebedor' || consortium.created_by !== req.user.id) {
    return res.status(403).json({ message: 'Apenas o recebedor pode confirmar pagamentos' })
  }
  if (payment.status !== 'pending') {
    return res.status(400).json({ message: 'Pagamento já foi processado' })
  }

  db.prepare(`
    UPDATE payments SET status = 'confirmed', confirmed_by = ?, confirmed_at = datetime('now')
    WHERE id = ?
  `).run(req.user.id, req.params.id)

  res.json(
    db
      .prepare(`
        SELECT p.*, u.name as user_name, cu.name as confirmed_by_name
        FROM payments p
        JOIN users u ON p.created_by = u.id
        LEFT JOIN users cu ON p.confirmed_by = cu.id
        WHERE p.id = ?
      `)
      .get(req.params.id)
  )
})

paymentsRouter.put('/:id/reject', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' })

  const consortium = db.prepare('SELECT created_by FROM consortiums WHERE id = ?').get(payment.consortium_id)
  if (!consortium || req.user.role !== 'recebedor' || consortium.created_by !== req.user.id) {
    return res.status(403).json({ message: 'Apenas o recebedor pode rejeitar pagamentos' })
  }
  if (payment.status !== 'pending') {
    return res.status(400).json({ message: 'Pagamento já foi processado' })
  }

  db.prepare("UPDATE payments SET status = 'rejected' WHERE id = ?").run(req.params.id)

  res.json(
    db
      .prepare(`
        SELECT p.*, u.name as user_name
        FROM payments p JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `)
      .get(req.params.id)
  )
})

paymentsRouter.delete('/:id', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' })

  const consortium = db
    .prepare('SELECT created_by FROM consortiums WHERE id = ?')
    .get(payment.consortium_id)

  const isRecebedor = req.user.role === 'recebedor' && consortium?.created_by === req.user.id
  const isCreatorPending = payment.created_by === req.user.id && payment.status === 'pending'

  if (!isRecebedor && !isCreatorPending) {
    return res.status(403).json({ message: 'Sem permissão para remover este pagamento' })
  }

  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})
