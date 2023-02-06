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
