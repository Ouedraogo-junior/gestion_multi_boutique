type Props = {
  label: string
  value: string | number
  sub?: string
  color?: 'default' | 'green' | 'red' | 'blue'
}

const COLOR_MAP = {
  default: 'text-[#1C1C1C]',
  green:   'text-[#1A7A4A]',
  red:     'text-[#E8314A]',
  blue:    'text-[#29ABE2]',
}

export default function KpiCard({ label, value, sub, color = 'default' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${COLOR_MAP[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}