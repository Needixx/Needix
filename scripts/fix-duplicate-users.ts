// scripts/fix-duplicate-users.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'devannaastad@gmail.com'
  
  // Find all users with this email
  const users = await prisma.user.findMany({
    where: { email },
    include: {
      accounts: true,
      sessions: true,
      subscriptions: true,
    }
  })

  console.log(`Found ${users.length} users with email ${email}:`)
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Has password: ${!!user.password}`)
    console.log(`  Accounts: ${user.accounts.map(a => a.provider).join(', ') || 'none'}`)
    console.log(`  Sessions: ${user.sessions.length}`)
    console.log(`  Subscriptions: ${user.subscriptions.length}`)
  })

  // Find user WITHOUT Google account
  const userToDelete = users.find(u => 
    !u.accounts.some(a => a.provider === 'google')
  )

  if (userToDelete && users.length > 1) {
    console.log(`\n⚠️  Will delete user: ${userToDelete.id} (no Google account)`)
    console.log('Deleting in 3 seconds... Press Ctrl+C to cancel')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Delete all related data
    await prisma.account.deleteMany({ where: { userId: userToDelete.id } })
    await prisma.session.deleteMany({ where: { userId: userToDelete.id } })
    await prisma.subscription.deleteMany({ where: { userId: userToDelete.id } })
    await prisma.verificationCode.deleteMany({ where: { userId: userToDelete.id } })
    
    // Delete the user
    await prisma.user.delete({ where: { id: userToDelete.id } })
    
    console.log('✅ Duplicate user deleted successfully!')
  } else {
    console.log('\n✅ No duplicate users found or nothing to delete')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())