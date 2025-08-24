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

  test('POST /api/v1/proposals/:id/vote proxies to governance /votes', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async (url, init) => ({ json: async () => ({ ok: true, via: '/votes' }) }))
    const app = buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals/p-123/vote',
      payload: { voter_id: 'm-1', vote_type: 'yes' }
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.ok).toBe(true)
  })

  test('GET /api/resources proxies to resource discovery', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ json: async () => ({ resources: [], total_count: 0 }) }))
    const app = buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/resources' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toEqual({ resources: [], total_count: 0 })
  })

  test('POST /api/resources proxies to resource discovery', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ json: async () => ({ id: 'r-1', name: 'X' }) }))
    const app = buildApp()
    const res = await app.inject({ method: 'POST', url: '/api/resources', payload: { name: 'X' } })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.id).toBe('r-1')
  })
})


