import 'dotenv/config'
import bcrypt from 'bcryptjs'
import connectMongoDB from '../config/mongoDb.js'
import User from '../models/User.js'

async function main() {
  try {
    await connectMongoDB()

    const name = process.env.ADMIN_NAME || 'Admin'
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim()
    const password = process.env.ADMIN_PASSWORD || 'admin123'

    let user = await User.findOne({ email })
    if (user) {
      if (user.role !== 'admin') {
        user.role = 'admin'
        await user.save()
        console.log(`Updated existing user to admin: ${email}`)
      } else {
        console.log(`Admin already exists: ${email}`)
      }
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    user = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      mustChangePassword: false
    })

    console.log('Admin created:')
    console.log(`  Name: ${name}`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    process.exit(0)
  } catch (err) {
    console.error('Failed to seed admin:', err)
    process.exit(1)
  }
}

main()