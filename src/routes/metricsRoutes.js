const express = require('express');
const { register } = require('../middlewares/metricsMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
