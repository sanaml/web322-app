/*********************************************************************************
 * WEB322 – Assignment 02
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: sanam lakhotra Student ID: 151835212 Date:2023/02/05
 *
 * Cyclic Web App URL:https://itchy-boa-swimsuit.cyclic.app/about
 *
 * GitHub Repository URL: https://github.com/sanaml/web322-app
 *
 ********************************************************************************/

const express = require('express')
const path = require('path')
const app = express()
const port = process.env.PORT || 8080
var blog = require('./blog-service.js')

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect('./about')
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, './views/about.html'))
})

app.get('/blog', (req, res) => {
  blog
    .getPublishedPosts()
    .then((posts) => {
      res.json(posts)
    })
    .catch((err) => {
      res.json({ message: err })
    })
})

app.get('/posts', (req, res) => {
  blog
    .getAllPosts()
    .then((posts) => {
      res.json(posts)
    })
    .catch((err) => {
      res.json({ message: err })
    })
})

app.get('/categories', (req, res) => {
  blog
    .getCategories()
    .then((data) => {
      res.json(data)
    })
    .catch((err) => {
      res.json({ message: err })
    })
})

app.use((req, res) => {
  res.status(404).send('Page Not Found')
})

blog
  .initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`)
    })
  })
  .catch((err) => {
    console.error('Server failed to start:', err)
  })
