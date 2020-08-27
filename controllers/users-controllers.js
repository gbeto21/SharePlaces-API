const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const User = require('../models/user')

const getUsers = async (req, res, next) => {
    let users
    try {
        users = await User.find({}, '-password')

    } catch (error) {
        const err = new HttpError('Fetching user failed, pleace try again later.', 500)
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) })
}

const signup = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid input passed, please check your data.', 422)
        )
    }

    const { name, email, password } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })

    } catch (error) {
        const err = new HttpError('Signing up failed, please try again later.', 500)
        return next(err)
    }

    if (existingUser) {
        const error = new HttpError('User exists already, please login instead.',
            422)
        return next(error)
    }

    const createdUser = new User({
        name,
        email,
        image: 'https://www.computerhope.com/jargon/g/guest-user.jpg',
        password,
        places: []
    })

    try {
        await createdUser.save()
    } catch (error) {
        const err = new HttpError(
            'Signing up failed, please try again.',
            500
        )
        return next(err)
    }

    res.status(201).json({ user: createdUser.toObject({ getters: true }) })
}

const login = async (req, res, next) => {

    const { email, password } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })

    } catch (error) {
        const err = new HttpError('Login up failed, please try again later.', 500)
        return next(err)
    }

    if (!existingUser || existingUser.password !== password) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.',
            401
        )
        return next(error)
    }

    res.json({ mesage: 'Logged in' })
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login