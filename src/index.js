const express = require('express')
const cors = require('cors')
const { v4: uuidv4, validate } = require('uuid')

const app = express()

app.use(cors())
app.use(express.json())

const users = []

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find(
    user => user.username === username
  )

  if(!user){
    return response.status(404).json({
      'error': 'User not found'
    })
  }
  
  request.user = user

  return next()
}

function checksCreateTodosUserAvailability(request, response, next){
  const { user } = request

  if(!user.pro && user.todos.length >= 10){
    return response.status(403).json({
      'error': 'creation of todo not available'
    })
  }

  return next()
}

function checksTodoExists(request, response, next){
  const { username } = request.headers
  const { id } = request.params

  if(!validate(id)){
    return response.status(400).json({
      'error': 'id does not have a valid format'
    })
  }

  const user = users.find(
    user => user.username === username
  )

  if(!user){
    return response.status(404).json({
      'error': 'User not found'
    })
  }

  const todo = user.todos.find(
    todo => todo.id === id
  )

  if(!todo){
    return response.status(404).json({
      'error': 'Todo not found!'
    })
  }

  request.todo = todo
  request.user = user
  
  return next()
}

function findUserById(request, response, next){
  const { id } = request.params

  const user = users.find(
    user => user.id === id
  )

  if(!user){
    return response.status(404).json({
      'error': 'User not found'
    })
  }
  
  request.user = user

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userAlreadyExists = users.some(
    (user) => user.username === username
  )

  if(userAlreadyExists){
    return response.status(400).json({
      'error': 'User already exists'
    })
  }

  const user = {
    'id': uuidv4(),
    'name': name,
    'pro': false,
    'username': username,
    'todos': []
  }

  users.push(user)

  return response.status(201).json(user)
})

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request

  return response.json(user)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.json(user.todos)
})

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body
  const { user } = request

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo)

  return response.status(201).json(todo)
})

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { title, deadline } = request.body
  const { id } = request.params
  const { user, todo } = request

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  user.todos[todoIndex] = {
    ...todo,
    title: title,
    deadline: new Date(deadline)
  }
  
  return response.status(201).json(user.todos[todoIndex])
})

app.patch('/todos/:id/done', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { id } = request.params
  const { user, todo } = request

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  user.todos[todoIndex] = {
    ...todo,
    'done': true
  }

  return response.status(201).json(user.todos[todoIndex])
})

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { id } = request.params
  const { user } = request

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  user.todos.splice(todoIndex, 1)

  return response.status(204).send()
})

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
}