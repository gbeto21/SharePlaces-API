const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/user-routes')
const HttpError = require('./models/http-error')
const app = express()
const config = require('./config')

app.use(bodyParser.json())
app.use('/api/places', placesRoutes)
app.use('/api/users', usersRoutes)

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404)
    throw error
})
app.use((error, req, res, next) => {
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500)
    res.json({ messaje: error.message || 'An unknow error occurred!' })
})

mongoose
    .connect(`mongodb+srv://${config.db.user}:${config.db.password}@${config.db.cluster}.xuzor.mongodb.net/${config.db.database}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(5000)
    })
    .catch(err => {
        console.log(err);
    })
