ipcEdit = require('electron').ipcRenderer
ipcEdit.on('message', (event, message) => console.log(message))
const shell = require('electron').shell;

const saveChanges = document.getElementById('saveChanges')
saveChanges.addEventListener('click', event => {
    if (document.getElementById('Position').value) {
        ipcEdit.send('saveChanges', {
            title: document.getElementById('Title').value,
            position: document.getElementById('Position').value
        })
        ipcEdit.removeAllListeners('saveChanges')
        ipcEdit.removeAllListeners('editSong')
    } else {
        ipcEdit.send('saveChangesFail')
    }
})

// const cancelEdit = document.getElementById('cancelEdit')
// cancelEdit.addEventListener('click', event => {
//     ipcEdit.send('cancelEdit')
//     ipcEdit.removeAllListeners('editSong')
// })

ipcEdit.on('positionEvent', (event, message) => {
    document.querySelector('#Position').value = message
    console.log(message)
})

ipcEdit.on('titleEvent', (event, message) => {
    document.querySelector('#Title').value = message
    console.log(message)
})