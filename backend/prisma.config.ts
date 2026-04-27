import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Load .env trước khi defineConfig đọc process.env
config({ path: path.join(__dirname, '.env') })

const DATABASE_URL = process.env.DATABASE_URL!

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    url: DATABASE_URL,
    async adapter() {
      const pool = new Pool({ connectionString: DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
})
