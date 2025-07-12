const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const initialSkills = [
  // Technology Skills
  { name: 'JavaScript', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'React', category: 'Programming' },
  { name: 'Node.js', category: 'Programming' },
  { name: 'HTML/CSS', category: 'Programming' },
  { name: 'Database Design', category: 'Programming' },
  
  // Design Skills
  { name: 'Photoshop', category: 'Design' },
  { name: 'Illustrator', category: 'Design' },
  { name: 'Figma', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Logo Design', category: 'Design' },
  
  // Office Skills
  { name: 'Excel', category: 'Office' },
  { name: 'PowerPoint', category: 'Office' },
  { name: 'Word', category: 'Office' },
  { name: 'Data Analysis', category: 'Office' },
  
  // Languages
  { name: 'English', category: 'Language' },
  { name: 'Spanish', category: 'Language' },
  { name: 'French', category: 'Language' },
  { name: 'German', category: 'Language' },
  
  // Creative Skills
  { name: 'Photography', category: 'Creative' },
  { name: 'Video Editing', category: 'Creative' },
  { name: 'Music Production', category: 'Creative' },
  { name: 'Writing', category: 'Creative' },
  
  // Business Skills
  { name: 'Project Management', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Sales', category: 'Business' },
  { name: 'Accounting', category: 'Business' },
]

async function main() {
  console.log('Seeding database...')
  
  // Create skills
  for (const skill of initialSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
  }
  
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
