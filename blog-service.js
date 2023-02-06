const fs = require('fs')

var posts = []
var categories = []

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/posts.json', 'utf8', (err, data) => {
      if (err) {
        reject('unable to read file')
      } else {
        posts = JSON.parse(data)
        fs.readFile('./data/categories.json', 'utf8', (err, data) => {
          if (err) {
            reject('unable to read file')
          } else {
            categories = JSON.parse(data)
            resolve()
          }
        })
      }
    })
  })
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (posts.length == 0) {
      reject('no results returned')
    } else {
      resolve(posts)
    }
  })
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    let publishedPosts = posts.filter((post) => post.published === true)
    if (publishedPosts.length == 0) {
      reject('no results returned')
    } else {
      resolve(publishedPosts)
    }
  })
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length == 0) {
      reject('no results returned')
    } else {
      resolve(categories)
    }
  })
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
}
