import { buildApp } from '../src/app'

describe('API Gateway v1', () => {
  test('POST /api/v1/proposals proxies to governance and returns 201', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ json: async () => ({ id: 'p-1', title: 'T' }) }))
    const app = buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals',
      payload: { title: 'T', description: 'D', initiator_id: 'm1', stakeholder_cooperatives: ['c1'] }
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).id).toBe('p-1')
  })

  test('POST /api/v1/events maps event-store response to id', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ json: async () => ({ ok: true, event_id: 'e-1' }) }))
    const app = buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/events',
      payload: { event_type: 't', aggregate_id: 'a', initiator_id: 'm', participants: [], event_data: {} }
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).id).toBe('e-1')
  })
})


