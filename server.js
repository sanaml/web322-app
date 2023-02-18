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
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const port = process.env.PORT || 8080
var blog = require('./blog-service.js')

cloudinary.config({
  cloud_name: 'duoemhboy',
  api_key: '739357112142456',
  api_secret: 'hR8Eo_uiJOtiRpSDzfTSekozkRU',
  secure: true,
})

const upload = multer()

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
  const category = req.query.category
  const minDateStr = req.query.minDate
  let posts

  if (category) {
    blog
      .getPostsByCategory(category)
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        res.json(error)
      })
  } else if (minDateStr) {
    blog
      .getPostsByMinDate(minDateStr)
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        res.json(error)
      })
  } else {
    posts = blog
      .getAllPosts()
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        res.json(error)
      })
  }
})

app.get('/posts/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addPost.html'))
})

app.post('/posts/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result)
          } else {
            reject(error)
          }
        })
        streamifier.createReadStream(req.file.buffer).pipe(stream)
      })
    }

    async function upload(req) {
      let result = await streamUpload(req)
      console.log(result)
      return result
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url)
    })
  } else {
    processPost('')
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl
    const postData = req.body
    blog
      .addPost(postData)
      .then(() => {
        res.redirect('/posts')
      })
      .catch((err) => {
        console.error(err)
        res.redirect('/posts')
      })
  }
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

app.get('/post/:id', (req, res) => {
  const id = req.params.id
  console.log(id)
  blog
    .getPostById(id)
    .then((posts) => {
      res.json(posts)
    })
    .catch((err) => {
      console.error(err)
      res.status(500).json('Post not found')
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
