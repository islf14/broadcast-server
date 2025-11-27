const $ = (e) => document.querySelector(e)
const u_bc = 'user_broadcast'
// S O C K E T //
const socket = io({
  auth: {
    username: localStorage.getItem(u_bc) ?? null,
    countMessages: 0
  }
})

// V E R I F Y  L O G I N
socket.on('connect', () => {
  const username = localStorage.getItem(u_bc)
  if (username) {
    // new url, reload, redirect
    socket.emit('user:vflogin')
  } else {
    modelogin()
    if (socket.auth.username) {
      socket.auth.username = null
      socket.auth.countMessages = 0
      // clean all old messages
      const ulchat = $('#chat ul')
      ulchat.innerHTML = ''
      // socket reset
      socket.emit('user:clean')
    }
  }
})

// All receive the new message
socket.on('server_everyone:message', (message) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    showMessage(message)
  }
})

// The user receives all messages (or missing messages)
// in the current chat
socket.on('server_user:necessary_messages', (messages) => {
  messages.forEach((message) => {
    showMessage(message)
  })
})

// Show message in the list
function showMessage(message) {
  const date = new Date(message.date)
  const localeTime = date.toLocaleTimeString('en-GB').split(':')
  const ulchat = $('#chat ul')
  const li = document.createElement('li')
  const span = document.createElement('span')
  const p = document.createElement('p')
  const small = document.createElement('small')
  span.textContent = showUsername(message.username)
  p.textContent = message.message
  small.textContent = localeTime[0] + ':' + localeTime[1]
  li.classList.add('message')
  if (message.username === socket.auth.username) {
    li.classList.add('out')
  } else {
    li.classList.add('in')
  }
  li.appendChild(span)
  li.appendChild(p)
  li.appendChild(small)
  ulchat.insertAdjacentElement('beforeend', li)
  ulchat.scrollTop = ulchat.scrollHeight
  if (message.ord > socket.auth.countMessages) {
    socket.auth.countMessages = message.ord
  }
}

// The user receives the active users
socket.on('server_user:active_users', (users) => {
  socket.auth.username = localStorage.getItem(u_bc)
  $('#name').value = ''
  modechat()
  const username = localStorage.getItem(u_bc)
  const ulusers = $('#users ul')
  // clean all old users
  ulusers.innerHTML = ''

  users.forEach((user) => {
    if (user.name === username) {
      // Add the user to the begining of the list
      const li = document.createElement('li')
      const span = document.createElement('span')
      const button = document.createElement('button')
      span.textContent = showUsername(username)
      button.textContent = 'Logout'
      button.classList.add('btn-logout')
      li.appendChild(span)
      li.appendChild(button)
      ulusers.insertAdjacentElement('afterbegin', li)
      button.addEventListener('click', (e) => {
        e.preventDefault()
        logout()
      })
    } else {
      addUser(user) // Add other users
    }
  })
})

// Receive a connection notification from another user
socket.on('server_other:user_connected', (user) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    const liUsers = document.querySelectorAll('#users ul li')
    let add = true
    liUsers.forEach((item) => {
      if (item.children[0].textContent === showUsername(user.name)) {
        add = false
      }
    })
    if (add) {
      addUser(user)
    }
  }
})

// Add other users
function addUser(user) {
  const li = document.createElement('li')
  const span = document.createElement('span')
  span.textContent = showUsername(user.name)
  li.appendChild(span)
  $('#users ul').insertAdjacentElement('beforeend', li)
}

// Receive a disconnection notification from another user
socket.on('server_other:user_disconnected', (user) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    const liUsers = document.querySelectorAll('#users ul li')
    liUsers.forEach((item) => {
      if (item.children[0].textContent === showUsername(user.name)) {
        $('#users ul').removeChild(item)
      }
    })
  }
})

// The user receive a login error notification
socket.on('server_user:login_error', (msg) => {
  localStorage.removeItem(u_bc)
  modelogin()
  loginSpan(msg, 'red')
})

socket.on('server_user:rate_error', (msg) => {
  $('#chatError').style.display = 'block'
  $('#chatError div span').innerText = msg
  setTimeout(() => {
    $('#chatError').style.display = 'none'
    $('#chatError div span').innerText = ''
  }, 4000)
})

// end of SOCKET

let login = false // used in loggingIn

//  L O G I N
$('#formlogin').addEventListener('submit', (e) => {
  e.preventDefault()
  const name = $('#name').value.trim().toLowerCase()
  $('#name').value = name
  if (name.length < 2 || name.length > 30) {
    loginSpan('Invalid name', 'red')
    return
  }
  if (login) {
    loginSpan('Logging in', 'green')
    return
  }
  loggingIn(true)
  loginSpan('', 'green')
  localStorage.setItem(u_bc, name)
  socket.emit('user:login', name)
})

// M E S S A G E
$('#formchat').addEventListener('submit', (e) => {
  e.preventDefault()
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    if (e.target.children[0].value !== '') {
      const message = e.target.children[0].value
      e.target.children[0].value = ''
      socket.emit('user:message', message)
    }
  }
})

// Sendig login form to server
function loggingIn(status) {
  login = status
  $('#formlogin button').disabled = status
  $('#name').disabled = status
}

// Notify message in login error
function loginSpan(msg, color) {
  $('#formlogin span').innerText = msg
  $('#formlogin span').style.color = color
}

// Capitalize the first letter
function showUsername(name) {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// It is used in the logout button
function logout() {
  localStorage.removeItem(u_bc)
  socket.auth.countMessages = 0
  socket.auth.username = null
  const ulchat = $('#chat ul')
  ulchat.innerHTML = ''
  socket.emit('user:logout')
  modelogin()
}

function modelogin() {
  $('#loading').style.display = 'none'
  $('#login').style.display = 'block'
  $('#users').style.display = 'none'
  $('#chat').style.display = 'none'
  $('#name').focus()
  $('#floatList').classList.add('hidden-menu')
  loggingIn(false)
  loginSpan('', 'green')
}

function modechat() {
  $('#loading').style.display = 'none'
  $('#login').style.display = 'none'
  $('#users').style.display = 'block'
  $('#chat').style.display = 'block'
  $('#newmessage').focus()
  loggingIn(false)
  loginSpan('', 'green')
}

// Button users
$('#btnUsers').addEventListener('click', (e) => {
  e.preventDefault()
  const classes = Object.values($('#floatList').classList)
  if (!classes.includes('hidden-menu')) {
    // shown
    $('#floatList').classList.add('hidden-menu')
    document.removeEventListener('mousedown', handleListener)
  } else {
    // hidden
    $('#floatList').classList.remove('hidden-menu')
    // add listener to close the menu
    document.addEventListener('mousedown', handleListener)
  }
})

function handleListener(e) {
  // if the click is made outside of list
  if (
    !$('#listUsers').contains(e.target) &&
    !$('#btnUsers').contains(e.target)
  ) {
    $('#floatList').classList.add('hidden-menu')
    document.removeEventListener('mousedown', handleListener)
  }
}

//
