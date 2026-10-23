// Runs the admin tests against your REAL MongoDB (the one in backend/.env).
//   npm run test:db
// It uses its own database, "babylon_admin_test", and wipes only that one.
import 'dotenv/config'
import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  ['--experimental-test-module-mocks', '--test', 'tests/admin.routes.test.js'],
  { stdio: 'inherit', env: { ...process.env, USE_DB: '1' } },
)
process.exit(result.status ?? 1)
