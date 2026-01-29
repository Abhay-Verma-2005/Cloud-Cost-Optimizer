const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne(
      { username: req.user.username },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/profile/update', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { email, mobile, age, gender } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    // Only update fields that are provided and not empty
    if (email !== undefined && email !== null) updateData.email = email.trim();
    if (mobile !== undefined && mobile !== null) updateData.mobile = mobile.trim();
    if (age !== undefined && age !== null && age !== '') updateData.age = parseInt(age);
    if (gender !== undefined && gender !== null) updateData.gender = gender;
    
    const result = await usersCollection.updateOne(
      { username: req.user.username },
      { $set: updateData }
    );
    
    // Always return success if the operation completed without error
    res.json({ success: true, message: 'Profile updated successfully', updated: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.put('/profile/change-password', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current and new password are required' 
      });
    }
    
    const user = await usersCollection.findOne({ username: req.user.username });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await usersCollection.updateOne(
      { username: req.user.username },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete account
router.delete('/profile/delete', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const historyCollection = db.collection('history');
    const awsCredentialsCollection = db.collection('aws_credentials');
    const instanceLimitsCollection = db.collection('instance_limits');
    
    const userId = req.user.userId;
    const username = req.user.username;
    
    // Delete all user-related data
    await Promise.all([
      historyCollection.deleteMany({ userId }),
      awsCredentialsCollection.deleteMany({ userId }),
      instanceLimitsCollection.deleteMany({ userId })
    ]);
    
    // Delete user account
    const result = await usersCollection.deleteOne({ username });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log(`✅ Account deleted for user: ${username}`);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
