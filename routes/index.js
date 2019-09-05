const express = require('express');
const router = express.Router(); 

// setup a friendly greeting for the root route
router.get('/', (req, res) => {
    res.status(200).json({
      "Message": "Welcome back to school, students! Here you can find a list of courses."
    });
  });

module.exports = router;