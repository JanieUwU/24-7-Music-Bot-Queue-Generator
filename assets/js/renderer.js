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
            upButton.style.backgroundImage = "url(../buttons/up.png)"
            upButton.style.backgroundSize = "cover"
            // if ctrl is held change image, if released (lags program if held for too long)
            const ctrlPressed = document.getElementById("body")
            const ctrlHeld = false
            ctrlPressed.addEventListener('keydown', event => {
                if (event.ctrlKey || event.metaKey && ctrlHeld == false) {
                    upButton.style.backgroundImage = "url(../buttons/movetop.png)"
                    downButton.style.backgroundImage = "url(../buttons/movebottom.png)"
                    ctrlHeld = true
                    ctrlPressed.removeEventListener('keydown', event)
                    return
                }
            }, { once: true })
            ctrlPressed.addEventListener('keyup', event => {
                if (!event.ctrlKey || !event.metaKey && ctrlHeld == true) {
                    upButton.style.backgroundImage = "url(../buttons/up.png)"
                    downButton.style.backgroundImage = "url(../buttons/down.png)"
                    ctrlHeld = false
                    ctrlPressed.removeEventListener('keydown', event)
                    return
                }
            }, { once: true })
            // upButton.onmouseover = function() {
            //     upButton.style.backgroundImage = "url(../buttons/uphover.png)"
            //     upButton.style.backgroundSize = "cover"
            // }
            // upButton.onmouseout = function() {
            //     upButton.style.backgroundImage = "url(../buttons/up.png)"
            //     upButton.style.backgroundSize = "cover"
            // }
            innerContainer.appendChild(upButton)
            
            
            // ipc.on('ctrlTrue', (event, message) => {
            //     upButton.style.backgroundImage = "url(../buttons/edit.png)"
            //     console.log(message)
            // })

            // make upButton click listener
            upButton.addEventListener('click', event => {
                if (event.ctrlKey || event.metaKey) {
                    ipc.send('moveTop', {
                        index: key,
                    })
                } else {
                    ipc.send('moveUp', {
                        index: key,
                    })
                }
                
            })
            // make move song down button
            const downButton = document.createElement('button')
            downButton.style.height = '30px'
            downButton.style.width = '30px'
            downButton.style.float = 'right'
            downButton.style.marginRight = '0px'
            downButton.style.marginLeft = '2px'
            downButton.style.backgroundImage = "url(../buttons/down.png)"
            downButton.style.backgroundSize = "cover"
            // downButton.onmouseover = function() {
            //     downButton.style.backgroundImage = "url(../buttons/downhover.png)"
            //     downButton.style.backgroundSize = "cover"
            // }
            // downButton.onmouseout = function() {
            //     downButton.style.backgroundImage = "url(../buttons/down.png)"
            //     downButton.style.backgroundSize = "cover"
            // }
            innerContainer.appendChild(downButton)
            // make downButton click listener
            downButton.addEventListener('click', event => {
                if (event.ctrlKey || event.metaKey) {
                    ipc.send('moveEnd', {
                        index: key,
                    })
                } else {
                    ipc.send('moveDown', {
                        index: key,
                    })
                }
            })
            // make edit button
            const editButton = document.createElement('button')
            editButton.style.height = '30px'
            editButton.style.width = '30px'
            editButton.style.float = 'right'
            editButton.style.marginRight = '0px'
            editButton.style.marginLeft = '2px'
            editButton.style.backgroundImage = "url(../buttons/edit.png)"
            editButton.style.backgroundSize = "cover"
            editButton.style.backgroundColor = 'transparent'
            editButton.onmouseover = function() {
                editButton.style.backgroundImage = "url(../buttons/edit.png)"
                editButton.style.backgroundSize = "cover"
                editButton.style.outlineStyle = 'solid'
                editButton.style.outlineColor = 'white'
            }
            editButton.onmouseout = function() {
                editButton.style.backgroundImage = "url(../buttons/edit.png)"
                editButton.style.backgroundSize = "cover"
                editButton.style.outlineStyle = 'none'
            }
            innerContainer.appendChild(editButton)
            // make downButton click listener
            editButton.addEventListener('click', event => {
                ipc.send('editSong', {
                    index: key,
                })
            })
            // make remove button
            const removeButton = document.createElement('button')
            removeButton.style.height = '50px'
            removeButton.style.width = '50px'
            removeButton.style.backgroundImage = "url(../buttons/trash.png)"
            removeButton.style.backgroundSize = "cover"
            removeButton.style.backgroundColor = 'transparent'
            removeButton.style.backgroundSize = "cover"
            removeButton.style.float = 'right'
            removeButton.style.marginRight = '0px'
            removeButton.style.marginLeft = '2px'
            removeButton.onmouseover = function() {
                removeButton.style.backgroundImage = "url(../buttons/trashhover.png)"
            }
            removeButton.onmouseout = function() {
                removeButton.style.backgroundImage = "url(../buttons/trash.png)"
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