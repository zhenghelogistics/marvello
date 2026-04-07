import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db'
import { campaigns } from '@/lib/db/schema'

describe('Database', () => {
  it('connects and queries campaigns table', async () => {
    const result = await db.select().from(campaigns).limit(1)
    expect(Array.isArray(result)).toBe(true)
  })
})
