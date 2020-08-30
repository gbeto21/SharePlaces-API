const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')
const User = require('../models/user')
const { create } = require('../models/user')

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

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (error) {
        const err = new HttpError('Could not create user, please try again.', 500)
        return next(err)
    }

    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
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

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.SECRET_WORD,
            { expiresIn: '1h' }
        )
    } catch (error) {
        const err = new HttpError(
            'Signing up failed, please try again.',
            500
        )
        return next(err)
    }

    res
        .status(201)
        .json(
            {
                userId: createdUser.id,
                email: createdUser.email,
                token: token
            })
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

    if (!existingUser) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.',
            403
        )
        return next(error)
    }

    let isValidPassword = false
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (error) {
        const err = new HttpError('Could not log you in, please check your credentials and try again.', 500)
        return next(err)
    }

    if (!isValidPassword) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.',
            403
        )
        return next(error)
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            process.env.SECRET_WORD,
            { expiresIn: '1h' }
        )
    } catch (error) {
        const err = new HttpError(
            'Loggin in failed, please try again.',
            500
        )
        return next(err)
    }

    res.json(
        {
            userId: existingUser.id,
            email: existingUser.email,
            token: token
        })
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login