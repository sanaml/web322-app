const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

// Creating  schema for database
const userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
})

// to be defined on new connection (see initialize)
let user

function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      'mongodb+srv://lakhotrasanam01:mnask2517@senecaweb.bokpb62.mongodb.net/?retryWrites=true&w=majority',
    )
    db.on('error', (err) => {
      reject(err) // reject the promise with the provided error
    })
    db.once('open', () => {
      User = db.model('users', userSchema)
      resolve()
    })
  })
}
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject('Passwords do not match')
    } else {
      // Hashing the password before storing it
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash
          // Saving the user data
          let newUser = new User(userData)
          newUser
            .save()
            .then(() => {
              resolve()
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject('User Name is already taken')
              } else {
                reject(`There was an error creating the user: ${err}`)
              }
            })
        })
        .catch((err) => {
          console.log(err)
          reject('There was an error while encrypting the password')
        })
    }
  })
}
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`)
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (result === true) {
                resolve(users[0])
              } else {
                reject(`Incorrect Password for user: ${userData.userName}`)
              }
            })

          users[0].loginHistory.push({
            dateTime: new Date().toString(),
            userAgent: userData.userAgent,
          })

          User.updateOne(
            { userName: users[0].userName },
            { $set: { loginHistory: users[0].loginHistory } },
            { multi: false },
          )
            .exec()
            .then(() => {
              resolve(users[0])
            })
            .catch((err) => {
              reject(`There was an error verifying the user: ${err}`)
            })
        }
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`)
      })
  })
}
module.exports = {
  initialize,
  registerUser,
  checkUser,
}
