const express = require('express');
const router = express.Router();

router.post('/dashboard', async (req, res) => {
  res.status(501).json({ success: false, message: 'Use main server /api/dashboard for now.' });
});

module.exports = router;
