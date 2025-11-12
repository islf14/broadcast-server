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
    socket.emit('user:vflogin', window.performance.navigation.type)
  } else {
    modelogin()
    if (socket.auth.username) {
      socket.auth.username = null
      socket.emit('user:clean')
    }
  }
})

socket.on('server:message', (message) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    const date = new Date(message.date)
    const localeTime = date.toLocaleTimeString('en-GB').split(':')
    const ulchat = $('#chat ul')
    const li = document.createElement('li')
    const span = document.createElement('span')
    const p = document.createElement('p')
    const small = document.createElement('small')
    span.textContent = message.username
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
})

socket.on('server:login_messages', (messages) => {
  const ulchat = $('#chat ul')
  messages.forEach((message) => {
    const date = new Date(message.date)
    const localeTime = date.toLocaleTimeString('en-GB').split(':')
    const ulchat = $('#chat ul')
    const li = document.createElement('li')
    const span = document.createElement('span')
    const p = document.createElement('p')
    const small = document.createElement('small')
    span.textContent = message.username
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
  })
})

socket.on('server:login_active_users', (users) => {
  socket.auth.username = localStorage.getItem(u_bc)
  $('#name').value = ''
  modechat()
  const username = localStorage.getItem(u_bc)
  const ulusers = $('#divusers ul')
  ulusers.innerHTML = ''

  users.forEach((element) => {
    if (element.name === username) {
      const li = document.createElement('li')
      const span = document.createElement('span')
      const button = document.createElement('button')
      span.textContent = username
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
      const li = document.createElement('li')
      const span = document.createElement('span')
      span.textContent = element.name
      li.appendChild(span)
      ulusers.insertAdjacentElement('beforeend', li)
    }
  })
})

socket.on('server:user_connected', (user) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    const ulusers = $('#divusers ul')
    const liUsers = document.querySelectorAll('#divusers ul li')
    let add = true
    liUsers.forEach((item) => {
      if (item.children[0].textContent === user.name) {
        add = false
      }
    })
    if (add) {
      const li = document.createElement('li')
      const span = document.createElement('span')
      span.textContent = user.name
      li.appendChild(span)
      ulusers.insertAdjacentElement('beforeend', li)
    }
  }
})

socket.on('server:user_disconnected', (user) => {
  if (
    localStorage.getItem(u_bc) !== null &&
    localStorage.getItem(u_bc) === socket.auth.username
  ) {
    const ulusers = $('#divusers ul')
    const liUsers = document.querySelectorAll('#divusers ul li')
    liUsers.forEach((item) => {
      if (item.children[0].textContent === user.name) {
        ulusers.removeChild(item)
      }
    })
  }
})

socket.on('server:login_error', (msg) => {
  localStorage.removeItem(u_bc)
  modelogin()
  const sp = $('#formlogin span')
  sp.innerText = msg
  sp.style.color = 'red'
})

//  L O G I N
$('#formlogin').addEventListener('submit', (e) => {
  e.preventDefault()
  const name = $('#name').value.trim()
  $('#name').value = name
  if (name.length < 2 || name.length > 30) {
    e.target.children[1].innerText = 'invalid name'
    e.target.children[1].style.color = 'red'
    return
  }
  e.target.children[1].innerText = ''
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
  $('#divlogin').style.display = 'block'
  $('#divusers').style.display = 'none'
  $('#chat').style.display = 'none'
}

function modechat() {
  $('#divlogin').style.display = 'none'
  $('#divusers').style.display = 'block'
  $('#chat').style.display = 'block'
}

//
