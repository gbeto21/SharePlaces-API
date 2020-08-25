const express = require('express')

const router = express.Router()

router.get('/', (req, res, nex) => {
    console.log('Get Request in places');
    res.json({ message: 'It works!' })
})

module.exports = router