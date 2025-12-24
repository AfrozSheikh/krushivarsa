// seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/database');

// Connect to database
connectDB();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@krishivarsa.com' });
        
        if (adminExists) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email:', adminExists.email);
            console.log('Role:', adminExists.role);
            console.log('Status:', adminExists.status);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(', salt);

        // Create admin user
        const adminUser = await User.create({
            name: 'System Administrator',
            email: 'admin@krishivarsa.com',
            password: "Admin@123",
            contactNumber: '+911234567890',
            role: 'admin',
            userType: 'farmer',
            location: {
                village: 'System',
                district: 'Admin District',
                state: 'Admin State'
            },
            isApproved: true,
            status: 'approved'
        });

        console.log('✅ Admin user created successfully!');
        console.log('================================');
        console.log('Email: admin@krishivarsa.com');
        console.log('Password: Admin@123');
        console.log('Role: admin');
        console.log('Status: approved');
        console.log('================================');
        console.log('⚠️  IMPORTANT: Change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

// Run the seeding function
seedAdmin();