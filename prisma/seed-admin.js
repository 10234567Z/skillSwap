const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@skillswap.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!@#', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@skillswap.com',
        password: hashedPassword,
        name: 'System Administrator',
        location: 'System',
        role: 'ADMIN',
        isPublic: false,
        availability: []
      }
    })

    console.log('Admin user created successfully:')
    console.log('Email: admin@skillswap.com')
    console.log('Password: Admin123!@#')
    console.log('Admin ID:', admin.id)

  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
