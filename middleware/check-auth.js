const jwt = require('jsonwebtoken')

const HttpError = require("../models/http-error")
const config = require('../config')
module.exports = (req, res, next) => {

    if (req.method === 'OPTIONS') {
        return next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            throw new Error('Authentication failed!')
        }

        const decodedToken = jwt.verify(token, config.token.secretword)
        req.userData = { userId: decodedToken.userId }
        next()

    } catch (error) {
        const err = new HttpError('Authentication failed!', 403)
        return next(err)
    }


}