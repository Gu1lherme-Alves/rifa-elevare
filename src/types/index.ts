export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'seller'
  active: boolean
  created_at: string
  updated_at: string
}

export interface Buyer {
  id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RaffleNumber {
  number: number
  status: 'available' | 'reserved' | 'sold'
  buyer_id: string | null
  seller_id: string | null
  amount_charged: number | null
  discount: number | null
  payment_status: 'paid' | 'pending' | null
  reserved_at: string | null
  sold_at: string | null
  observation: string | null
  buyer?: Buyer
  seller?: Profile
}

export interface Sale {
  id: string
  buyer_id: string
  seller_id: string | null
  numbers: number[]
  total_amount: number
  amount_charged: number
  discount: number
  payment_status: 'paid' | 'pending'
  observation: string | null
  created_at: string
  updated_at: string
  buyer?: Buyer
  seller?: Profile
}

export interface Settings {
  id: string
  price_per_number: number
  total_numbers: number
  pix_key: string
  prize_description: string
  instagram_url: string
  website_url: string
  whatsapp_number: string
  reservation_expiry_hours: number
  raffle_drawn: boolean
  raffle_winner_number: number | null
  raffle_drawn_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  details: Record<string, any>
  created_at: string
  user?: Profile
}

export type FilterType = 'all' | 'available' | 'reserved' | 'sold'
