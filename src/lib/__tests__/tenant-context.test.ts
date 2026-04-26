import { withTenant } from '../tenant-context'

const mockExecuteRaw = jest.fn().mockResolvedValue(undefined)
const mockTransaction = jest.fn()

jest.mock('../db', () => ({
  prisma: {
    $transaction: (fn: Function) => mockTransaction(fn),
  },
}))

describe('withTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation((fn: Function) => {
      const fakeTx = { $executeRaw: mockExecuteRaw }
      return fn(fakeTx)
    })
  })

  it('calls SET LOCAL app.current_tenant_id before running the callback', async () => {
    const orgId = 'test-org-uuid'
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
    const [templateStrings] = mockExecuteRaw.mock.calls[0]
    expect(templateStrings.join('')).toContain('SET LOCAL app.current_tenant_id')
  })

  it('passes the transaction client to the callback', async () => {
    const orgId = 'test-org-uuid'
    const callback = jest.fn().mockResolvedValue('result')

    await withTenant(orgId, callback)

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ $executeRaw: mockExecuteRaw })
    )
  })

  it('returns the value from the callback', async () => {
    const callback = jest.fn().mockResolvedValue('expected-value')

    const result = await withTenant('org-id', callback)

    expect(result).toBe('expected-value')
  })
})
