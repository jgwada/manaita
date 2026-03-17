'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
}

export default function PageHeader({ title, description, backHref }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <button
        onClick={() => backHref ? router.push(backHref) : router.back()}
        className="flex items-center gap-1 text-[#9A8880] text-sm mb-3 hover:text-[#111008] transition-colors"
      >
        <ArrowLeft size={16} /> 戻る
      </button>
      <h1 className="text-2xl font-bold text-[#111008]">{title}</h1>
      {description && <p className="text-sm text-[#9A8880] mt-1">{description}</p>}
    </div>
  )
}
