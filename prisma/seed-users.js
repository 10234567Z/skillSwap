const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const demoUsers = [
  {
    name: 'Marc Demo',
    email: 'marc@demo.com',
    password: 'password123',
    location: 'New York, NY',
    isPublic: true,
    availability: ['weekends', 'evenings'],
    skillsOffered: [
      { skillName: 'JavaScript', level: 'ADVANCED' },
      { skillName: 'Python', level: 'INTERMEDIATE' }
    ],
    skillsWanted: [
      { skillName: 'Photoshop', level: 'BEGINNER' },
      { skillName: 'UI/UX Design', level: 'INTERMEDIATE' }
    ]
  },
  {
    name: 'Michell',
    email: 'michell@demo.com',
    password: 'password123',
    location: 'San Francisco, CA',
    isPublic: true,
    availability: ['weekdays', 'mornings'],
    skillsOffered: [
      { skillName: 'UI/UX Design', level: 'EXPERT' },
      { skillName: 'Figma', level: 'ADVANCED' }
    ],
    skillsWanted: [
      { skillName: 'React', level: 'INTERMEDIATE' },
      { skillName: 'JavaScript', level: 'ADVANCED' }
    ]
  },
  {
    name: 'Joe Wills',
    email: 'joe@demo.com',
    password: 'password123',
    location: 'Austin, TX',
    isPublic: true,
    availability: ['flexible'],
    skillsOffered: [
      { skillName: 'Photography', level: 'EXPERT' },
      { skillName: 'Video Editing', level: 'ADVANCED' }
    ],
    skillsWanted: [
      { skillName: 'Marketing', level: 'BEGINNER' },
      { skillName: 'Social Media', level: 'INTERMEDIATE' }
    ]
  },
  {
    name: 'Sarah Chen',
    email: 'sarah@demo.com',
    password: 'password123',
    location: 'Seattle, WA',
    isPublic: true,
    availability: ['evenings', 'weekends'],
    skillsOffered: [
      { skillName: 'Data Analysis', level: 'EXPERT' },
      { skillName: 'Excel', level: 'ADVANCED' },
      { skillName: 'Python', level: 'ADVANCED' }
    ],
    skillsWanted: [
      { skillName: 'Machine Learning', level: 'INTERMEDIATE' },
      { skillName: 'Tableau', level: 'BEGINNER' }
    ]
  },
  {
    name: 'Alex Rodriguez',
    email: 'alex@demo.com',
    password: 'password123',
    location: 'Miami, FL',
    isPublic: true,
    availability: ['mornings', 'afternoons'],
    skillsOffered: [
      { skillName: 'Spanish', level: 'EXPERT' },
      { skillName: 'English', level: 'EXPERT' },
      { skillName: 'Writing', level: 'ADVANCED' }
    ],
    skillsWanted: [
      { skillName: 'French', level: 'BEGINNER' },
      { skillName: 'German', level: 'BEGINNER' }
    ]
  }
]

async function seedUsers() {
  console.log('Seeding demo users...')
  
  for (const userData of demoUsers) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          location: userData.location,
          isPublic: userData.isPublic,
          availability: userData.availability,
        }
      })
      
      // Add skills offered
      for (const skillData of userData.skillsOffered) {
        const skill = await prisma.skill.findFirst({
          where: { name: skillData.skillName }
        })
        
        if (skill) {
          await prisma.userSkill.create({
            data: {
              userId: user.id,
              skillId: skill.id,
              type: 'OFFERED',
              level: skillData.level,
            }
          })
        }
      }
      
      // Add skills wanted
      for (const skillData of userData.skillsWanted) {
        const skill = await prisma.skill.findFirst({
          where: { name: skillData.skillName }
        })
        
        if (skill) {
          await prisma.userSkill.create({
            data: {
              userId: user.id,
              skillId: skill.id,
              type: 'WANTED',
              level: skillData.level,
            }
          })
        }
      }
      
      console.log(`Created user: ${userData.name}`)
      
    } catch (error) {
      console.log(`Skipping ${userData.name} - already exists or error occurred`)
    }
  }
  
  console.log('Demo users seeded successfully!')
}

seedUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
