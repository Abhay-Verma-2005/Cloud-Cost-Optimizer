const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  res.status(501).json({ success: false, message: 'Use main server /api/login for now.' });
});

module.exports = router;


// Routes are web addresses in an application that tell the 
// server what to do when a user visits or sends data, using 
// actions like GET, POST, or DELETE.
