const express = require('express')
const router = express.Router()
const reelsController = require('../controllers/reelsController')

router.get('/:username', reelsController.getReels)

module.exports = router
