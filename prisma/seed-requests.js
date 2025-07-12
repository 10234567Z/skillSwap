const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSwapRequests() {
  console.log('Seeding swap requests...')
  
  try {
    // Get all users and their skills
    const users = await prisma.user.findMany({
      include: {
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    })
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create swap requests')
      return
    }
    
    console.log(`Found ${users.length} users`)
    
    // Create some sample swap requests between users
    const sampleRequests = []
    
    // Generate requests between different users
    for (let i = 0; i < users.length - 1; i++) {
      const sender = users[i]
      const receiver = users[i + 1]
      
      // Find offered skills for sender and wanted skills for receiver
      const senderOfferedSkills = sender.userSkills.filter(us => us.type === 'OFFERED')
      const receiverOfferedSkills = receiver.userSkills.filter(us => us.type === 'OFFERED')
      
      if (senderOfferedSkills.length > 0 && receiverOfferedSkills.length > 0) {
        const senderSkill = senderOfferedSkills[0]
        const receiverSkill = receiverOfferedSkills[0]
        
        // Create different types of requests
        const statuses = ['PENDING', 'ACCEPTED', 'REJECTED']
        const status = statuses[i % statuses.length]
        
        const messages = [
          'Hi! I\'d love to learn from you. Are you interested in a skill exchange?',
          'I think we could really help each other out with our skills!',
          'Your expertise would be really valuable to me. Let\'s swap skills!',
          'I noticed you offer the skill I want to learn. Interested in trading?',
          null // Some requests without messages
        ]
        
        sampleRequests.push({
          senderId: sender.id,
          receiverId: receiver.id,
          senderSkillId: senderSkill.id,
          receiverSkillId: receiverSkill.id,
          message: messages[i % messages.length],
          status: status,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread over days
          updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          completedAt: status === 'ACCEPTED' ? new Date(Date.now() - (i * 12 * 60 * 60 * 1000)) : null
        })
      }
      
      // Create reverse request too for some variety
      if (i % 2 === 0 && receiverOfferedSkills.length > 0 && senderOfferedSkills.length > 0) {
        const senderSkill = receiverOfferedSkills[0]
        const receiverSkill = senderOfferedSkills[0]
        
        sampleRequests.push({
          senderId: receiver.id,
          receiverId: sender.id,
          senderSkillId: senderSkill.id,
          receiverSkillId: receiverSkill.id,
          message: 'I saw your profile and think we\'d be a great match for skill exchange!',
          status: 'PENDING',
          createdAt: new Date(Date.now() - ((i + 10) * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - ((i + 10) * 24 * 60 * 60 * 1000)),
          completedAt: null
        })
      }
    }
    
    // Insert the requests
    for (const request of sampleRequests) {
      try {
        await prisma.swapRequest.create({
          data: request
        })
        console.log(`Created swap request: ${request.senderId} -> ${request.receiverId} (${request.status})`)
      } catch (error) {
        console.log(`Skipping duplicate or invalid request: ${error.message}`)
      }
    }
    
    console.log(`Created ${sampleRequests.length} swap requests`)
    
  } catch (error) {
    console.error('Error seeding swap requests:', error)
  }
}

seedSwapRequests()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
