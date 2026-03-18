export interface ShopProfile {
  id: string
  name: string
  area: string
  industry: string
  priceRange: string
  seats: number
  googleReviewUrl: string
  placeId?: string
  lineOfficialUrl?: string
  researchCache?: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'shop'
  shopId: string
  isActive: boolean
  createdAt: string
}

export interface UsageLog {
  id: string
  shopId: string
  toolName: string
  createdAt: string
  inputSummary: string
}

export interface Survey {
  id: string
  shopId: string
  publicToken: string
  rating: number
  comment: string
  redirectedToGoogle: boolean
  createdAt: string
}

export interface Customer {
  id: string
  shopId: string
  customerName: string
  visitDates: string[]
  memo: string
  createdAt: string
}

export interface GenerateRequest {
  toolName: string
  shopProfile: ShopProfile
  inputs: Record<string, string>
  tone?: string
}

export interface GenerateResponse {
  success: boolean
  data?: { result: string }
  error?: string
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  shopProfile: ShopProfile
  mode: 'advisor' | 'general'
}

export interface ChatResponse {
  success: boolean
  data?: { reply: string }
  error?: string
}
