const fs = require('fs')
const { resolve } = require('path')
const path = require('path')

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

function addPost(postData) {
  return new Promise((resolve, reject) => {
    if (postData.published === undefined) {
      postData.published = false
    } else {
      postData.published = true
    }

    postData.id = posts.length + 1

    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    postData.postDate = formattedDate
    postData.categories = postData.categories || [1] // add categories field if not defined in postData

    posts.unshift(postData)

    resolve(postData)
  })
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    let CPosts = []
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].category == category) {
        CPosts.push(posts[i])
      }
    }
    if (CPosts.length === 0) {
      reject('no results returned')
    }
    resolve(CPosts)
  })
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    let CPosts = []
    for (let i = 0; i < posts.length; i++) {
      if (new Date(posts[i].postDate) >= new Date(minDateStr)) {
        CPosts.push(posts[i])
      }
    }
    if (CPosts.length === 0) {
      reject('no results returned')
    }
    resolve(CPosts)
  })
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    let found = false
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].id == id) {
        found = true
        resolve(posts[i])
      }
    }
    if (!found) {
      reject('no results returned')
    }
  })
}
async function getPublishedPostsByCategory(category) {
  const allPosts = await getAllPosts()
  return allPosts.filter((post) => post.published && post.category === category)
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  getPublishedPostsByCategory,
}
