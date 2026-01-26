require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Log environment variables
console.log('Environment Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SERVICE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
console.log('---\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    console.log('Creating Admin User...\n');

    // Yaha kripya apni email daale
    const adminEmail = 'something@gmail.com';

    try {
        console.log('0. Testing service key permissions...');
        const { data: testData, error: testError } = await supabase.auth.admin.listUsers();

        if (testError) {
            console.error('Service key test failed:', testError);
            console.error('Full error:', JSON.stringify(testError, null, 2));
            throw new Error('Service role key is invalid or lacks permissions');
        }

        console.log('Service key works. Found', testData.users.length, 'existing users\n');

        // Check if user already exists
        const existingUser = testData.users.find(u => u.email === adminEmail);

        if (existingUser) {
            console.log('User already exists!');
            console.log('User ID:', existingUser.id);
            console.log('Email:', existingUser.email);
            console.log('Created:', existingUser.created_at);
            console.log('\nOptions:');
            console.log('1. Delete this user in Supabase Dashboard > Authentication > Users');
            console.log('2. Use a different email');
            console.log('3. Skip to step 2 (add to users table) with this ID\n');
            return;
        }

        // Create user with more detailed error handling
        console.log('1. Creating user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                created_by: 'seed_script'
            }
        });

        if (authError) {
            console.error('Auth Error Details:');
            console.error('Message:', authError.message);
            console.error('Status:', authError.status);
            console.error('Code:', authError.code);
            console.error('Full error:', JSON.stringify(authError, null, 2));
            throw authError;
        }

        console.log('Auth user created:', authData.user.id);

        // Add to users table
        console.log('\n2. Adding to users table...');
        const userId = authData.user.id;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: adminEmail,
                role: 'admin',
                entry_number: null,
                batch: null,
                department_id: null
            })
            .select()
            .single();

        if (userError) {
            console.error('Users table error:', userError);
            console.log('\n💡 User created in Auth but not in database.');
            console.log('Run this SQL manually in Supabase SQL Editor:');
            console.log(`
INSERT INTO users (id, email, role) 
VALUES ('${userId}', '${adminEmail}', 'admin');
            `);
        } else {
            console.log('User added to database:', userData);
        }

        console.log('\n ADMIN CREATED SUCCESSFULLY!');
        console.log('=============================');
        console.log(`Email: ${adminEmail}`);
        console.log(`User ID: ${userId}`);
        console.log('Password: Use magic link/OTP (check email)');

    } catch (error) {
        console.error('\n FATAL ERROR:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
    }
}

createAdmin();
