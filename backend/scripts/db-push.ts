import { config } from 'dotenv'
import { execSync } from 'child_process'
import path from 'path'

config({ path: path.join(__dirname, '..', '.env') })

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

execSync(`npx prisma db push --url="${url}"`, { stdio: 'inherit' })
