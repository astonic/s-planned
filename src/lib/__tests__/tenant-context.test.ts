import { withTenant } from '../tenant-context'

const mockExecuteRaw = jest.fn().mockResolvedValue(undefined)
const mockTransaction = jest.fn()

jest.mock('../db', () => ({
  prisma: {
    $transaction: (fn: Function) => mockTransaction(fn),
  },
}))

describe('withTenant', () => {
  const orgId = '4305bb8d-6035-4166-8536-8ccdfe07c3e1'

  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation((fn: Function) => {
      const fakeTx = { $executeRaw: mockExecuteRaw }
      return fn(fakeTx)
    })
  })

  it('sets app.current_tenant_id before running the callback', async () => {
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
    const [templateStrings] = mockExecuteRaw.mock.calls[0]
    expect(templateStrings.join('')).toContain("set_config('app.current_tenant_id'")
  })

  it('passes the transaction client to the callback', async () => {
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ $executeRaw: mockExecuteRaw })
    )
  })

  it('returns the value from the callback', async () => {
    const callback = jest.fn().mockResolvedValue('expected-value')

    const result = await withTenant(orgId, callback)

    expect(result).toBe('expected-value')
  })

  it('rejects invalid organization ids before touching the database', async () => {
    const callback = jest.fn().mockResolvedValue('result')

    await expect(withTenant('org-id', callback)).rejects.toThrow('Invalid organizationId')

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })
})
