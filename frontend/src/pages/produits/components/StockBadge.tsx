interface Props {
  stock: number
  seuil: number
}

export default function StockBadge({ stock, seuil }: Props) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[#E8314A]">
        Rupture
      </span>
    )
  }
  if (stock <= seuil) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-[#F5A623]">
        Stock bas
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D4F0E2] text-[#145C38]">
      En stock
    </span>
  )
}