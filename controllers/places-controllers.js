const fs = require('fs')
const { v4: uuidv4 } = require('uuid');

const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error')
const Place = require('../models/place')
const User = require('../models/user');
const mongoose = require('mongoose')

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid
    let place

    try {
        place = await Place.findById(placeId)

    } catch (error) {
        const err = new HttpError(
            'Something went wrong, could not find a place.',
            500)
        return next(error)
    }

    if (!place) {
        const error = new HttpError('Could not find a place for the provided id.', 404)
        return next(error)
    }

    res.json({ place: place.toObject({ getters: true }) })
}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid
    let userWithPlaces

    try {

        userWithPlaces = await User.findById(userId).populate('places')

    } catch (error) {
        const err = new HttpError(
            'Fetching places failed, pleace try again later.',
            500)
        return next(err)
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(new HttpError('Could not find places for the provided user id.', 404))
    }

    res.json({
        places: userWithPlaces
            .places
            .map(
                place => place.toObject({ getters: true })
            )
    })
}

const createPlace = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid input passed, please check your data.', 422)
    }

    const { title, description, lat, lng, address } = req.body
    const createdPlace = new Place({
        title,
        description,
        address,
        location: { lat, lng },
        image: req.protocol + '://' + req.get('host') + "/" + req.file.path.replace('\\','/').replace('\\','/'),
        creator: req.userData.userId
    })

    let user
    try {
        user = await User.findById(req.userData.userId)
    } catch (error) {
        const err = new HttpError(
            'Could not find user for provided id.',
            500
        )
        return next(err)
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404)
        return next(error)
    }

    try {
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await createdPlace.save({ session: sess })
        user.places.push(createdPlace)
        await user.save({ session: sess })
        await sess.commitTransaction()

    } catch (error) {
        const err = new HttpError('Creating place failed, please try again.', 500)
        return next(err)
    }

    res.status(201).json({ place: createdPlace })
}

const updatePlace = async (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid input passed, please check your data.', 422)
        )
    }

    const { title, description } = req.body
    const placeId = req.params.pid

    let place
    try {
        place = await Place.findById(placeId)

    } catch (error) {
        const err = new HttpError(
            'Something went wrong could not update place.',
            500)
        return next(err)
    }

    if (place.creator.toString() !== req.userData.userId) {

        const err = new HttpError(
            'You are not allowed to edit this place.',
            401)
        return next(err)
    }

    place.title = title
    place.description = description

    try {
        await place.save()
    } catch (error) {
        const err = new HttpError(
            'Something went wrong could not update place.',
            500)
        return next(err)
    }

    res.status(200).json({ place: place.toObject({ getters: true }) })
}

const deletePlace = async (req, res, next) => {

    const placeId = req.params.pid

    let place
    try {
        place = await Place.findById(placeId).populate('creator')
    } catch (error) {
        const err = new HttpError(
            'Something went wrong finding the place, could not delete place',
            500
        )
        return next(err)
    }

    if (!place) {
        const error = new HttpError('Could not find place for this id.', 404)
        return next(error)
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError('You are not allowed to delete this place.', 401)
        return next(error)
    }

    const imagePath = place.image

    try {
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await place.remove({ session: sess })
        place.creator.places.pull(place)
        await place.creator.save({ session: sess })
        await sess.commitTransaction()
    } catch (error) {
        const err = new HttpError(
            'Something went wrong deleting the place, could not delete place',
            500
        )
        return next(err)
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    })

    res.status(200).json({ message: 'Deleted place.' })

}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace