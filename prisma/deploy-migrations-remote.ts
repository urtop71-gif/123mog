// One-off helper: applies prisma/migrations/*/migration.sql directly against
// a remote libsql:// database (e.g. Turso) via @libsql/client, bypassing
// Prisma's schema engine (which does not understand the libsql:// scheme for
// `prisma migrate deploy`). Records each applied migration into
// _prisma_migrations the same way Prisma itself would, so migration state
// stays consistent with what a local `file:` deploy would show.
//
// Usage: DATABASE_URL="libsql://...?authToken=..." npx tsx prisma/deploy-migrations-remote.ts
// (or just set DATABASE_URL in .env - this script loads it automatically)
import 'dotenv/config'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url || url.startsWith('file:')) {
    throw new Error('Set DATABASE_URL to a remote libsql:// URL before running this script.')
  }
  const client = createClient({ url })

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                    TEXT PRIMARY KEY NOT NULL,
        "checksum"              TEXT NOT NULL,
        "finished_at"           DATETIME,
        "migration_name"        TEXT NOT NULL,
        "logs"                  TEXT,
        "rolled_back_at"        DATETIME,
        "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
        "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
    )
  `)

  const migrationsDir = path.join(__dirname, 'migrations')
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort()

  for (const folder of folders) {
    const existing = await client.execute({
      sql: 'SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ?',
      args: [folder],
    })
    if (existing.rows.length > 0) {
      console.log(`Skipping ${folder} (already applied)`)
      continue
    }

    const sqlPath = path.join(migrationsDir, folder, 'migration.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    const checksum = crypto.createHash('sha256').update(sql).digest('hex')

    console.log(`Applying ${folder}...`)
    await client.executeMultiple(sql)

    await client.execute({
      sql: `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, ?, ?, current_timestamp, 1)`,
      args: [crypto.randomUUID(), checksum, folder],
    })
    console.log(`Applied ${folder}`)
  }

  client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
