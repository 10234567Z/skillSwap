const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createMoreRequests() {
  console.log('Creating more swap requests for testing...')
  
  try {
    // Get Marc's user data
    const marc = await prisma.user.findFirst({
      where: { email: 'marc@demo.com' },
      include: {
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    })
    
    if (!marc) {
      console.log('Marc user not found')
      return
    }
    
    console.log(`Found Marc: ${marc.name} (${marc.id})`)
    
    // Get other users
    const otherUsers = await prisma.user.findMany({
      where: { 
        NOT: { id: marc.id }
      },
      include: {
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    })
    
    console.log(`Found ${otherUsers.length} other users`)
    
    // Create 3 more requests involving Marc
    const requests = []
    
    // Request 1: Someone sends to Marc (PENDING)
    if (otherUsers.length > 0 && marc.userSkills.length > 0 && otherUsers[0].userSkills.length > 0) {
      const sender = otherUsers[0]
      const senderSkill = sender.userSkills.find(us => us.type === 'OFFERED')
      const marcSkill = marc.userSkills.find(us => us.type === 'OFFERED')
      
      if (senderSkill && marcSkill) {
        requests.push({
          senderId: sender.id,
          receiverId: marc.id,
          senderSkillId: senderSkill.id,
          receiverSkillId: marcSkill.id,
          message: 'Hi Marc! I would love to learn from you. Are you interested in exchanging skills?',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    // Request 2: Marc sends to someone (PENDING)
    if (otherUsers.length > 1 && marc.userSkills.length > 0 && otherUsers[1].userSkills.length > 0) {
      const receiver = otherUsers[1]
      const marcSkill = marc.userSkills.find(us => us.type === 'OFFERED')
      const receiverSkill = receiver.userSkills.find(us => us.type === 'OFFERED')
      
      if (marcSkill && receiverSkill) {
        requests.push({
          senderId: marc.id,
          receiverId: receiver.id,
          senderSkillId: marcSkill.id,
          receiverSkillId: receiverSkill.id,
          message: 'I noticed your expertise and think we could help each other!',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    // Request 3: Someone sends to Marc (ACCEPTED)
    if (otherUsers.length > 2 && marc.userSkills.length > 0 && otherUsers[2].userSkills.length > 0) {
      const sender = otherUsers[2]
      const senderSkill = sender.userSkills.find(us => us.type === 'OFFERED')
      const marcSkill = marc.userSkills.find(us => us.type === 'OFFERED')
      
      if (senderSkill && marcSkill) {
        requests.push({
          senderId: sender.id,
          receiverId: marc.id,
          senderSkillId: senderSkill.id,
          receiverSkillId: marcSkill.id,
          message: 'Looking forward to our skill exchange!',
          status: 'ACCEPTED',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        })
      }
    }
    
    // Create the requests
    for (let i = 0; i < requests.length; i++) {
      try {
        const created = await prisma.swapRequest.create({
          data: requests[i]
        })
        console.log(`Created request ${i + 1}: ${requests[i].senderId === marc.id ? 'Marc sent' : 'Marc received'} (${requests[i].status})`)
      } catch (error) {
        console.log(`Error creating request ${i + 1}: ${error.message}`)
      }
    }
    
    console.log(`Successfully created ${requests.length} additional requests for Marc`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createMoreRequests()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
