ipc = require('electron').ipcRenderer
ipc.on('message', (event, message) => console.log(message))
const shell = require('electron').shell;

const addSongButton = document.getElementById('addSongButton')
addSongButton.addEventListener('click', event => {
    document.querySelector('#errorTextBox').innerText = ''
    if (document.getElementById('ytUrl').value) {
        ipc.send('addSong', {
            url: document.getElementById('ytUrl').value
        })
        document.querySelector('#ytUrl').value = ''
        document.querySelector('#ytUrl').focus()
    }
})

// const updateButton = document.getElementById('checkUpdate')
// updateButton.addEventListener('click', event => {
//     ipc.send('checkUpdate')
// })

// const removeSongButton = document.getElementById('removeSongButton')
// removeSongButton.addEventListener('click', event => {
//     if (document.getElementById('ytUrl').value) {
//         ipc.send('addSong', {
//             url: document.getElementById('ytUrl').value
//         })
//         document.querySelector('#ytUrl').value = ''
//         document.querySelector('#ytUrl').focus()
//     }
// })

const generateQueue = document.getElementById('generateQueue')
generateQueue.addEventListener('click', event => {
    ipc.send('generateQueue')
})

const importQueue = document.getElementById('importQueue')
importQueue.addEventListener('click', event => {
    ipc.send('importQueue')
})

const clearQueue = document.getElementById('clearQueue')
clearQueue.addEventListener('click', event => {
    ipc.send('clearQueue')
})

const removeLast = document.getElementById('removeLast')
removeLast.addEventListener('click', event => {
    ipc.send('removeLast')
})

const listView = document.querySelector('#listView')

ipc.on('ListUpdate', (event, message) => {
    listView.innerHTML = ''

    const videos = message

    const list = document.createElement('ol')

    for (const key in videos) {
        if (videos.hasOwnProperty(key)) {
            const video = videos[key];
            // make containers
            const container = document.createElement('li')
            const innerContainer = document.createElement('div')
            innerContainer.style.display = 'flex'
            innerContainer.style.flexDirection = 'row'
            // make video title
            const videoElement = document.createElement('p')
            videoElement.innerText = video.title
            innerContainer.appendChild(videoElement)
            // make move song up button
            const upButton = document.createElement('button')
            upButton.style.height = '30px'
            upButton.style.width = '30px'
            upButton.style.float = 'right'
            upButton.style.marginRight = '0px'
            upButton.style.marginLeft = 'auto'
            upButton.style.backgroundImage = "url(./assets/buttons/up.png)"
            upButton.style.backgroundSize = "cover"
            upButton.onmouseover = function() {
                upButton.style.backgroundImage = "url(./assets/buttons/uphover.png)"
                upButton.style.backgroundSize = "cover"
            }
            upButton.onmouseout = function() {
                upButton.style.backgroundImage = "url(./assets/buttons/up.png)"
                upButton.style.backgroundSize = "cover"
            }
            innerContainer.appendChild(upButton)
            // make upButton click listener
            upButton.addEventListener('click', event => {
                ipc.send('moveUp', {
                    index: key,
                })
            })
            // make move song down button
            const downButton = document.createElement('button')
            downButton.style.height = '30px'
            downButton.style.width = '30px'
            downButton.style.float = 'right'
            downButton.style.marginRight = '0px'
            downButton.style.marginLeft = '2px'
            downButton.style.backgroundImage = "url(./assets/buttons/down.png)"
            downButton.style.backgroundSize = "cover"
            downButton.onmouseover = function() {
                downButton.style.backgroundImage = "url(./assets/buttons/downhover.png)"
                downButton.style.backgroundSize = "cover"
            }
            downButton.onmouseout = function() {
                downButton.style.backgroundImage = "url(./assets/buttons/down.png)"
                downButton.style.backgroundSize = "cover"
            }
            innerContainer.appendChild(downButton)
            // make downButton click listener
            downButton.addEventListener('click', event => {
                ipc.send('moveDown', {
                    index: key,
                })
            })
            // make remove button
            const removeButton = document.createElement('button')
            removeButton.style.height = '50px'
            removeButton.style.width = '80px'
            removeButton.style.float = 'right'
            removeButton.style.marginRight = '0px'
            removeButton.style.marginLeft = '2px'
            removeButton.innerText = 'Delete'
            removeButton.onmouseover = function() {
                removeButton.style.backgroundImage = "url(./assets/buttons/deletehover.png)"
                removeButton.style.backgroundSize = "cover"
                //removeButton.innerText = ''
                removeButton.style.color = 'transparent'
            }
            removeButton.onmouseout = function() {
                //removeButton.style.backgroundImage = "url(./assets/buttons/delete.png)"
                //removeButton.style.backgroundSize = "cover"
                //removeButton.innerText = 'Delete'
                removeButton.style.backgroundImage = null
                removeButton.style.color = 'black'
            }
            innerContainer.appendChild(removeButton)
            // make remove button click listener
            removeButton.addEventListener('click', event => {
                ipc.send('remove', {
                    index: key,
                })
            })
            // append containers to list
            container.appendChild(innerContainer)
            list.appendChild(container)
        }
    }

    listView.appendChild(list)
})
ipc.on('errorEvent', (event, message) => {
    document.querySelector('#errorTextBox').innerText = message
})