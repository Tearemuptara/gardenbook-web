require('dotenv').config({ path: './gardenbook-db-api/.env' });
const userModel = require('./gardenbook-db-api/src/models/user');

async function testUserAuthentication() {
  try {
    console.log('Testing user authentication functions...');
    
    // Test 1: Test authenticateUser with correct credentials
    console.log('\nTEST 1: Authenticating with correct credentials');
    const authResult = await userModel.authenticateUser('test@example.com', 'securepassword123');
    console.log('Authentication result:', authResult ? 'Success' : 'Failed');
    console.log('User data returned:', authResult);
    
    // Test 2: Test authenticateUser with wrong password
    console.log('\nTEST 2: Authenticating with wrong password');
    const wrongPasswordResult = await userModel.authenticateUser('test@example.com', 'wrongpassword');
    console.log('Authentication result with wrong password:', wrongPasswordResult ? 'Success (this is incorrect)' : 'Failed (good - authentication should fail)');
    
    // Test 3: Test email verification token generation and verification
    console.log('\nTEST 3: Testing email verification');
    const userId = authResult.id;
    console.log('Generating verification token for user:', userId);
    const verificationToken = await userModel.generateVerificationToken(userId);
    console.log('Verification token generated:', verificationToken);
    
    // Verify email with the token
    console.log('Verifying email with token');
    const verificationResult = await userModel.verifyEmail(verificationToken);
    console.log('Email verification result:', verificationResult);
    
    // Confirm user is now verified
    const verifiedUser = await userModel.getUserById(userId);
    console.log('User verified status:', verifiedUser.isVerified);
    
    // Test 4: Test password reset
    console.log('\nTEST 4: Testing password reset');
    console.log('Generating password reset token');
    const resetTokenData = await userModel.generatePasswordResetToken('test@example.com');
    console.log('Reset token data:', resetTokenData);
    
    // Use token to reset password
    console.log('Resetting password with token');
    const resetResult = await userModel.resetPassword(resetTokenData.resetToken, 'newSecurePassword456');
    console.log('Password reset result:', resetResult);
    
    // Verify new password works
    console.log('Authenticating with new password');
    const newPasswordAuth = await userModel.authenticateUser('test@example.com', 'newSecurePassword456');
    console.log('Authentication with new password:', newPasswordAuth ? 'Success' : 'Failed');
    
    // Test 5: Test email validation
    console.log('\nTEST 5: Testing email validation');
    
    try {
      console.log('Creating user with invalid email');
      const invalidUser = await userModel.createUser({
        username: 'invalidemail',
        email: 'notanemail',
        password: 'password123',
        displayName: 'Invalid Email User'
      });
      console.log('User created:', invalidUser);
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    
    console.log('\nAll tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error in tests:', error);
    process.exit(1);
  }
}

testUserAuthentication(); 