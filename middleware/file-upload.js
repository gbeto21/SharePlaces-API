const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

// const fileUpload = multer({
//     limits: 500000,
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             cb(null, 'uploads/images')
//         },
//         filename: (req, file, cb) => {
//             const ext = MIME_TYPE_MAP[file.mimetype]
//             cb(null, uuidv4() + '.' + ext)
//         }
//     }),
//     fileFilter: (req, file, cb) => {
//         const isValid = !!MIME_TYPE_MAP[file.mimetype]
//         let error = isValid ? null : new Error('Invalid mime type!')
//         cb(error, isValid)
//     }
// })

// module.exports = fileUpload

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype]
        let error = new Error("Invalid mime type")
        if (isValid) {
            error = null
        }
        cb(error, "images")
    },
    filename: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype]
        cb(null, uuidv4() + '.' + ext)
    }
})

module.exports = multer({ storage: storage }).single("image")