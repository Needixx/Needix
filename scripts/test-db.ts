// scripts/test-db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    const result = await prisma.user.count()
    console.log('✅ Database connected successfully!')
    console.log(`Found ${result} users in database`)
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error(error)
  }
}

main()
  .finally(() => prisma.$disconnect())