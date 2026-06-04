interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'indigo' | 'green' | 'amber' | 'purple'
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
}

export function StatCard({ label, value, sub, color = 'indigo' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}
