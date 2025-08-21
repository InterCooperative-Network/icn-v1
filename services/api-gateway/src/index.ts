import { buildApp } from './app'

const app = buildApp()
const port = parseInt(process.env.PORT || '3000', 10)
app.listen({ host: '0.0.0.0', port }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})

export default app


