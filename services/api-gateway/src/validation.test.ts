import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const EconomicEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string().min(1),
  aggregate_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  participants: z.array(z.string()).min(1),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3)
})

describe('EconomicEventSchema', () => {
  it('accepts a valid event', () => {
    const ok = EconomicEventSchema.safeParse({
      event_id: '00000000-0000-4000-8000-000000000001',
      event_type: 'resource_exchange_proposed',
      aggregate_id: '00000000-0000-4000-8000-0000000000aa',
      timestamp: '2025-08-21T00:00:00Z',
      participants: ['a','b'],
      amount_cents: 1,
      currency: 'USD'
    })
    expect(ok.success).toBe(true)
  })

  it('rejects empty participants', () => {
    const bad = EconomicEventSchema.safeParse({
      event_id: '00000000-0000-4000-8000-000000000001',
      event_type: 'x',
      aggregate_id: '00000000-0000-4000-8000-0000000000aa',
      timestamp: '2025-08-21T00:00:00Z',
      participants: [],
      amount_cents: 1,
      currency: 'USD'
    })
    expect(bad.success).toBe(false)
  })
})


