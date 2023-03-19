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
const app = express()
const exphbs = require('express-handlebars')
const path = require('path')
const multer = require('multer')
const upload = multer()
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const port = process.env.PORT || 8082
var blog = require('./blog-service.js')

cloudinary.config({
  cloud_name: 'duoemhboy',
  api_key: '739357112142456',
  api_secret: 'hR8Eo_uiJOtiRpSDzfTSekozkRU',
  secure: true,
})
const stripJs = require('strip-js')
app.engine(
  'hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
      navLink: function (url, options) {
        return (
          '<li' +
          (url == app.locals.activeRoute ? ' class="active" ' : '') +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
        )
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error('Handlebars Helper equal needs 2 parameters')
        if (lvalue != rvalue) {
          return options.inverse(this)
        } else {
          return options.fn(this)
        }
      },
      safeHTML: function (context) {
        return stripJs(context)
      },
    },
  }),
)

app.use(express.static('public'))

app.use(function (req, res, next) {
  let route = req.path.substring(1)
  app.locals.activeRoute =
    '/' +
    (isNaN(route.split('/')[1])
      ? route.replace(/\/(?!.*)/, '')
      : route.replace(/\/(.*)/, ''))
  app.locals.viewingCategory = req.query.category
  next()
})
app.set('view engine', 'hbs')

app.get('/', (req, res) => {
  res.redirect('./blog')
})

app.get('/about', (req, res) => {
  res.render('about')
})

app.get('/blog', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {}

  try {
    // declare empty array to hold "post" objects
    let posts = []

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blog.getPublishedPostsByCategory(req.query.category)
    } else {
      // Obtain the published "posts"
      posts = await blog.getPublishedPosts()
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))

    // get the latest post from the front of the list (element 0)
    let post = posts[0]

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts
    viewData.post = post
  } catch (err) {
    viewData.message = 'no results'
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blog.getCategories()

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories
  } catch (err) {
    viewData.categoriesMessage = 'no results'
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', { data: viewData })
})

app.get('/posts', (req, res) => {
  const category = req.query.category
  const minDateStr = req.query.minDate
  let posts

  if (category) {
    blog
      .getPostsByCategory(category)
      .then((data) => {
        res.render('posts', { posts: data })
      })
      .catch((error) => {
        res.render('posts', { message: 'no results' })
      })
  } else if (minDateStr) {
    blog
      .getPostsByMinDate(minDateStr)
      .then((data) => {
        res.render('posts', { posts: data })
      })
      .catch((error) => {
        res.render('posts', { message: 'no results' })
      })
  } else {
    posts = blog
      .getAllPosts()
      .then((data) => {
        res.render('posts', { posts: data })
      })
      .catch((error) => {
        res.render('posts', { message: 'no results' })
      })
  }
})

app.get('/posts/add', (req, res) => {
  res.render('addPost')
})

app.post('/posts/add', upload.single('featureImage'), async (req, res) => {
  try {
    let featureImageUrl = ''
    if (req.file) {
      // upload image to cloudinary
      const stream = cloudinary.uploader.upload_stream({}, (error, result) => {
        if (result) {
          featureImageUrl = result.secure_url
          processPost()
        } else {
          console.error(error)
          processPost()
        }
      })
      streamifier.createReadStream(req.file.buffer).pipe(stream)
    } else {
      processPost()
    }

    async function processPost() {
      // create new post data
      const postData = {
        title: req.body.title,
        content: req.body.content,
        featureImage: featureImageUrl,
      }

      // add post to database
      try {
        await blog.addPost(postData)
        res.redirect('/posts')
      } catch (error) {
        console.error(error)
        res.redirect('/posts')
      }
    }
  } catch (error) {
    console.error(error)
    res.redirect('/posts')
  }
})

app.get('/categories', (req, res) => {
  blog
    .getCategories()
    .then((data) => {
      res.render('categories', { categories: data })
    })
    .catch((err) => {
      res.render('categories', { message: 'no results' })
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
  res.status(404).render('404')
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
app.get('/blog/:id', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {}

  try {
    // declare empty array to hold "post" objects
    let posts = []

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category)
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts()
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts
  } catch (err) {
    viewData.message = 'no results'
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id)
  } catch (err) {
    viewData.message = 'no results'
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories()

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories
  } catch (err) {
    viewData.categoriesMessage = 'no results'
  }

  // render the "blog" view with all of the data (viewData)
  res.render('blog', { data: viewData })
})
// add middleware for handling 404 errors
