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
  tabelogUrl?: string
  researchCache?: string
  createdAt: string
  latestFlRatio?: number
  latestFlMonth?: string
}

export interface StaffRow {
  id: string
  name: string
  type: 'hourly' | 'salary'
  hourlyWage: number
  hours: number
  monthlySalary: number
}

export interface FLMonthlyRecord {
  id: string
  shop_id: string
  year: number
  month: number
  revenue: number
  food_cost: number
  beverage_cost: number
  labor_cost: number
  fl_ratio: number | null
  food_ratio: number | null
  beverage_ratio: number | null
  labor_ratio: number | null
  ai_comment: string | null
  staff_details: StaffRow[]
  created_at: string
  updated_at: string
}

export interface MenuCostItem {
  id: string
  shop_id: string
  menu_name: string
  sell_price: number
  cost_price: number
  category: 'food' | 'beverage'
  sort_order: number
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
