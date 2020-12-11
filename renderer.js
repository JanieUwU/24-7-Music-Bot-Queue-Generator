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
            // make remove button
            const removeButton = document.createElement('button')
            removeButton.style.height = '50px'
            removeButton.style.float = 'right'
            removeButton.style.marginRight = '0px'
            removeButton.style.marginLeft = 'auto'
            removeButton.innerText = 'Delete'
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