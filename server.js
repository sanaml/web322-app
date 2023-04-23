/*********************************************************************************
 * WEB322 – Assignment 05
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
 * of this assignment has been copied manually or electronically from any other source
 * (including 3rd party web sites) or distributed to other students.
 *
 * Name: Sanam lakhotra Student ID: 151835212 Date:2023/02/05
 *
 * Cyclic Web App URL:https://itchy-boa-swimsuit.cyclic.app/blog
 *
 * GitHub Repository URL: https://github.com/sanaml/web322-app
 *
 ********************************************************************************/

const express = require('express')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const exphbs = require('express-handlebars')
const path = require('path')
const stripJs = require('strip-js')
const blogData = require('./blog-service.js')
const authData = require('./auth-service.js')
const clientSessions = require('client-sessions')
const {
  initialize,
  getAllPosts,
  getCategories,
  addPost,
  getPostById,
  getPublishedPostsByCategory,
  getPostsByMinDate,
  addCategory,
  deleteCategoryById,
  deletePostById,
} = require('./blog-service.js')
const { resolve } = require('path')
const { redirect } = require('express/lib/response.js')

const app = express()

app.use(express.static('public'))

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'web322blogapplication', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  }),
)

app.use(function (req, res, next) {
  res.locals.session = req.session
  next()
})

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login')
  } else {
    next()
  }
}

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

app.use(express.urlencoded({ extended: true }))

app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    // Handlebars custom helper to create active navigation links
    // Usage: {{#navLink "/about"}}About{{/navLink}}
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
      // Handlebars custom helper to check for equality
      // Usage: {{#equal value1 value2}}...{{/equal}}
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
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear()
        let month = (dateObj.getMonth() + 1).toString()
        let day = dateObj.getDate().toString()
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      },
    },
  }),
)
app.set('view engine', '.hbs')

// Configuring Cloudinary
cloudinary.config({
  cloud_name: 'duoemhboy',
  api_key: '739357112142456',
  api_secret: 'hR8Eo_uiJOtiRpSDzfTSekozkRU',
  secure: true,
})

const upload = multer()

// Configuring the port
const HTTP_PORT = process.env.PORT || 8080

// ========== Home Page Route ==========
app.get('/', (req, res) => {
  res.redirect('/blog')
})

// ========== About Page Route ==========
app.get('/about', (req, res) => {
  res.render('about')
})

// ========== Blog Page Route ==========
app.get('/blog', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {}
  try {
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
    let categories = await blogData.getCategories()
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories
  } catch (err) {
    viewData.categoriesMessage = 'no results'
  }

  // render the "blog" view with all of the data (viewData)
  if (viewData.posts.length > 0) {
    res.render('blog', { data: viewData })
  } else {
    res.render('blog', {
      data: viewData,
      message: 'Please try another post / category',
    })
  }
})

// ========== Posts Page Route ==========
app.get('/posts', ensureLogin, (req, res) => {
  // Checking if a category was provided
  if (req.query.category) {
    getPublishedPostsByCategory(req.query.category)
      .then((data) => {
        data.length > 0
          ? res.render('posts', { posts: data })
          : res.render('posts', { message: 'No Results' })
      })
      // Error Handling
      .catch((err) => {
        res.render('posts', { message: 'no results' })
      })
  }

  // Checking if a minimum date is provided
  else if (req.query.minDate) {
    getPostsByMinDate(req.query.minDate)
      .then((data) => {
        data.length > 0
          ? res.render('posts', { posts: data })
          : res.render('posts', { message: 'No Results' })
      })
      // Error Handling
      .catch((err) => {
        res.render('posts', { message: 'no results' })
      })
  }

  // Checking whether no specification queries were provided
  else {
    getAllPosts()
      .then((data) => {
        data.length > 0
          ? res.render('posts', { posts: data })
          : res.render('posts', { message: 'No Results' })
      })
      // Error Handling
      .catch((err) => {
        res.render('posts', { message: 'no results' })
      })
  }
})

app.get('/posts/add', ensureLogin, (req, res) => {
  getCategories()
    .then((categories) => {
      res.render('addPost', { categories: categories })
    })
    .catch(() => {
      res.render('addPost', { categories: [] })
    })
})

app.post(
  '/posts/add',
  ensureLogin,
  upload.single('featureImage'),
  (req, res) => {
    // Configuring cloudinary image uploading
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
      return result
    }

    // Once the upload is completed, we store the other form data in the object
    upload(req)
      .then((uploaded) => {
        req.body.featureImage = uploaded.url
        let postObject = {}

        postObject.body = req.body.body
        postObject.title = req.body.title
        postObject.postDate = new Date().toISOString().slice(0, 10)
        postObject.category = req.body.category
        postObject.featureImage = req.body.featureImage
        postObject.published = req.body.published

        if (postObject.title) {
          addPost(postObject).then(() => {
            res.redirect('/posts')
          })
        }
      })
      // Error Handling
      .catch((err) => {
        res.send(err)
      })
  },
)

app.get('/post/:value', (req, res) => {
  getPostById(req.params.value)
    .then((data) => {
      res.send(data)
    })
    // Error Handling
    .catch((err) => {
      res.send(err)
    })
})

app.get('/categories', ensureLogin, (req, res) => {
  getCategories()
    .then((data) => {
      data.length > 0
        ? res.render('categories', { categories: data })
        : res.render('categories', { message: 'No Results' })
    })
    // Error Handling
    .catch(() => {
      res.render('categories', { message: 'no results' })
    })
})

app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory')
})

app.post('/categories/add', ensureLogin, (req, res) => {
  let catObject = {}
  // Add it Category before redirecting to /categories
  catObject.category = req.body.category
  if (req.body.category != '') {
    addCategory(catObject)
      .then(() => {
        res.redirect('/categories')
      })
      .catch(() => {
        console.log('Some error occured')
      })
  }
})

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect('/categories')
    })
    .catch(() => {
      console.log('Unable to remove category / Category not found')
    })
})

app.get('/posts/delete/:id', ensureLogin, (req, res) => {
  deletePostById(req.params.id)
    .then(() => {
      res.redirect('/posts')
    })
    .catch(() => {
      console.log('Unable to remove category / Category not found')
    })
})

app.get('/blog/:id', ensureLogin, async (req, res) => {
  let viewData = {}
  try {
    let posts = []

    if (req.query.category) {
      posts = await blogData.getPublishedPostsByCategory(req.query.category)
    } else {
      posts = await blogData.getPublishedPosts()
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate))

    viewData.posts = posts
  } catch (err) {
    viewData.message = 'no results'
  }
  try {
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

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent')
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      }
      res.redirect('/posts')
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName })
    })
})

app.post('/register', (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: 'User created' })
    })
    .catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName })
    })
})

app.get('/logout', (req, res) => {
  req.session.reset()
  res.redirect('/')
})

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory')
})

app.use((req, res) => {
  res.status(404).render('404')
})

blogData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, function () {
      console.log('app listening on: ' + HTTP_PORT)
    })
  })
  .catch((err) => {
    console.log('unable to start server: ' + err)
  })
