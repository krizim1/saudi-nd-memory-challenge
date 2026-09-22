import { describe, expect, it } from 'vitest'

import { DEFAULT_CLIENT, parseClientId } from './clientId'

describe('parseClientId', () => {
  it('reads the client slug from the query string', () => {
    expect(parseClientId('?client=byd')).toBe('byd')
    expect(parseClientId('?x=1&client=Riyadh-Season')).toBe('riyadh-season')
  })

  it('falls back to the default client', () => {
    expect(parseClientId('')).toBe(DEFAULT_CLIENT)
    expect(parseClientId('?client=')).toBe(DEFAULT_CLIENT)
  })

  it('refuses anything that is not a plain slug', () => {
    expect(parseClientId('?client=byd%26score%3Dgt.0')).toBe(DEFAULT_CLIENT)
    expect(parseClientId('?client=' + 'a'.repeat(41))).toBe(DEFAULT_CLIENT)
    expect(parseClientId('?client=عميل')).toBe(DEFAULT_CLIENT)
  })
})
