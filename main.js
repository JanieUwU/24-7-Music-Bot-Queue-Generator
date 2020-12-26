// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, ipcRenderer, remote, shell } = require('electron')
const fs = require("fs")
const fsPromises = fs.promises
const path = require("path")
var log = require('electron-log')
const ytdl = require('ytdl-core')
const ytpl = require ('ytpl')
const DurationTime = require('duration-time-format')
const { autoUpdater } = require("electron-updater")
autoUpdater.checkForUpdatesAndNotify();

// init log
log.transports.file.level = 'info'
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}'
log.transports.file.maxSize = 5 * 1024 * 1024
log.transports.file.file = __dirname + '/log.txt'
log.transports.file.streamConfig = { flags: 'w' }
log.transports.file.stream = fs.createWriteStream('log.txt')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let editWindow

let queue = []

// ipcMain.on('checkUpdate', async () => {
  
//   function checkForUpdates (menuItem, focusedWindow, event) {
//     updater = menuItem
//     updater.enabled = false
//     autoUpdater.checkForUpdates()
//   }
//   module.exports.checkForUpdates = checkForUpdates
//   require('child_process').fork('./updater.js');
// })

ipcMain.on('addSong', async (event, _songInfo) => {
  var inputLink = _songInfo.url
  function contains(str, text) {
    return (str.indexOf(text) >= 0)
 }
  const watchPlistcheck = inputLink.match(/(youtube.com|youtu.be|music.youtube.com)\/(playlist)(\?list=)(\S+)?/)
  if (watchPlistcheck) {
    //mainWindow.webContents.send('errorEvent', 'Playlist = True!')
      try {
      const playlistID = await ytpl.getPlaylistID(inputLink)
      const playlistInfo = await ytpl(playlistID, {limit: Infinity})
      var playlistInfoTitle = playlistInfo.title 
      

      let newPlaylistItems = playlistInfo.items.map((item) => {
        return {
            title: item.title,
            link: `https://youtube.com/watch?v=${item.id}`,
            time:  DurationTime.parse(item.duration),
            //isOriginal: item.author.name.includes('Topic')
        }
    })
    var importAmount = newPlaylistItems.length
    queue = queue.concat(newPlaylistItems)
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Imported ' + importAmount + ' songs from ' + playlistInfoTitle + '!')
    } catch (err) {
      log.error(err)
      mainWindow.webContents.send('errorEvent', err.message)
      shell.beep()
      return
    }
  }
  else {
    const watchCheck = inputLink.match(/(youtube\.com\/watch\?v=|youtu\.be\/|music.youtube.com\/watch\?v=)(\S+)?/)

    if (watchCheck) {
      try {
        const info = await ytdl.getBasicInfo(inputLink)
        //const isOriginalBool = info.videoDetails.shortDescription.includes('Provided to YouTube by')
  
        const songInfo = {
          title: info.videoDetails.title,
          link: _songInfo.url,
          time: parseInt(info.videoDetails.lengthSeconds),
          //isOriginal: isOriginalBool
        }
        queue.push(songInfo)
  
        mainWindow.webContents.send('ListUpdate', queue)
        mainWindow.webContents.send('errorEvent', 'Added: ' + songInfo.title)
      } catch (err) {
        log.error(err)
        mainWindow.webContents.send('errorEvent', err.message)
        shell.beep()
        return
      }
    } else {
      mainWindow.webContents.send('errorEvent', '"' + inputLink + '"' + ' is not a valid YouTube link!')
      shell.beep()
    }
  }  
})

// ipcMain.on('addSong', async (event, _songInfo) => {
//   if (_songInfo.url) {
//     try {
//       const info = await ytdl.getBasicInfo(_songInfo.url)

//       const songInfo = {
//         title: info.videoDetails.title,
//         link: _songInfo.url,
//         time: info.videoDetails.lengthSeconds
//       }
//       queue.push(songInfo)

//       mainWindow.webContents.send('ListUpdate', queue)
//       mainWindow.webContents.send('errorEvent', 'Added: ' + songInfo.title)
//     } catch (err) {
//       log.error(err)
//       mainWindow.webContents.send('errorEvent', err.message)
//       return
//     }
//   }
// })

ipcMain.on('generateQueue', async () => {
  const savePath = await dialog.showSaveDialog({
    title: 'Choose where to safe your queue',
    createDirectory: true,
    showOverwriteConfirmation: true,
    filters: [
      { name: '24-7queue file', extensions: ['24-7queue'] },
    ]
  })

  if (!savePath.filePath) {
    mainWindow.webContents.send('errorEvent', 'Queue not saved, no location selected. Please try again.')
    return
  }

  await fsPromises.writeFile(savePath.filePath, JSON.stringify(queue, null, 4)).catch((err) => {
    log.error(err)
    mainWindow.webContents.send('errorEvent', err.message)
    return
  })
  mainWindow.webContents.send('errorEvent', 'Successfully saved queue file!')
  

  // sent success response back to main window
})

ipcMain.on('clearQueue', async () => {
  queue = []
  mainWindow.webContents.send('ListUpdate', queue)
  mainWindow.webContents.send('errorEvent', 'Cleared the queue!')
})

ipcMain.on('removeLast', async () => {
  if (queue.length >= 1){
  var lastRemoved = queue.pop()
  var lastTitle = lastRemoved.title
  mainWindow.webContents.send('ListUpdate', queue)
  mainWindow.webContents.send('errorEvent', 'Deleted: ' + lastTitle)
  }
  else{
    mainWindow.webContents.send('errorEvent', 'No songs in queue to remove!')
    shell.beep()
  }
})

ipcMain.on('remove', async (event, _songInfo) => {
  // queue.pop()
  const { index } = _songInfo
  var removedTitle = queue[index].title
  queue.splice(index, 1)
  mainWindow.webContents.send('ListUpdate', queue)
  mainWindow.webContents.send('errorEvent', 'Deleted: ' + removedTitle)
})

ipcMain.on('moveUp', async (event, _songInfo) => {
  // queue.pop()
  const { index } = _songInfo
  const upTitle = queue[index].title
  const oldPosUp = index
  const newPosUp = index - 1
  

  function arrMove(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
      let i = newIndex - arr.length + 1
      while (i--) {
        arr.push(undefined)
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
    return arr;
  }
  if (newPosUp < 0) {
    const newPos2Up = queue.length - 1
    console.log(arrMove(queue, oldPosUp, newPos2Up))
    console.log(oldPosUp)
    console.log(newPosUp)
    console.log(newPos2Up)
    const pos2NumUp = newPos2Up + 1
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + upTitle + ' to #' + pos2NumUp)
  } else {
    console.log(arrMove(queue, oldPosUp, newPosUp))
    console.log(oldPosUp)
    console.log(newPosUp)
    const posNumUp = newPosUp + 1
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + upTitle + ' to #' + posNumUp)
  }
  //queue.splice(index, 1)
})
// Move Top Function
ipcMain.on('moveTop', async (event, _songInfo) => {
  // queue.pop()
  const { index } = _songInfo
  const topTitle = queue[index].title
  const oldPosTop = index
  const newPosTop = 0
  

  function arrMove(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
      let i = newIndex - arr.length + 1
      while (i--) {
        arr.push(undefined)
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
    return arr;
  }
  if (oldPosTop == newPosTop) {
    mainWindow.webContents.send('errorEvent', 'Song already at the top of the queue!')
    shell.beep()
  } else {
    console.log(arrMove(queue, oldPosTop, newPosTop))
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + topTitle + ' to top of the queue!')
  }
})
//Move Bottom Function
ipcMain.on('moveEnd', async (event, _songInfo) => {
  // queue.pop()
  const { index } = _songInfo
  const endTitle = queue[index].title
  const oldPosEnd = index
  const newPosEnd = parseInt(queue.length) - 1
  

  function arrMove(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
      let i = newIndex - arr.length + 1
      while (i--) {
        arr.push(undefined)
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
    return arr;
  }
  if (oldPosEnd == newPosEnd) {
    mainWindow.webContents.send('errorEvent', 'Song already at the end of the queue!')
    shell.beep()
  } else {
    console.log(arrMove(queue, oldPosEnd, newPosEnd))
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + endTitle + ' to end of the queue!')
  }
})

ipcMain.on('moveDown', async (event, _songInfo) => {
  // queue.pop()
  const { index } = _songInfo
  const downTitle = queue[index].title
  const oldPosDown = index
  const newPosDown = parseInt(index) + 1
  

  function arrMove(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
      let i = newIndex - arr.length + 1
      while (i--) {
        arr.push(undefined)
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
    return arr;
  }
  if (newPosDown > queue.length - 1) {
    const newPos2Down = 0
    console.log(arrMove(queue, oldPosDown, newPos2Down))
    console.log(oldPosDown)
    console.log(newPosDown)
    console.log(newPos2Down)
    const pos2NumDown = newPos2Down + 1
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + downTitle + ' to #' + pos2NumDown)
  } else {
    console.log(arrMove(queue, oldPosDown, newPosDown))
    console.log(oldPosDown)
    console.log(newPosDown)
    const posNumDown = parseInt(newPosDown) + 1
    mainWindow.webContents.send('ListUpdate', queue)
    mainWindow.webContents.send('errorEvent', 'Moved: ' + downTitle + ' to #' + posNumDown)
  }
  //queue.splice(index, 1)
})

let queueImport = []
ipcMain.on('importQueue', async () => {
  const filePath = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '24-7queue file', extensions: ['24-7queue', '24-7-queue', 'json'] },
    ]
  })
  if (filePath.canceled) {
    mainWindow.webContents.send('errorEvent', 'Queue import aborted!')
    return
  }

  const fileData = await fsPromises.readFile(filePath.filePaths[0]).catch(err => {
    console.log(err)
  })
  const jsonData = JSON.parse(fileData)
  if (Array.isArray(jsonData)) {
    for(var i = 0; i < jsonData.length; i++) {
      var obj = jsonData[i]
  
      console.log(obj.title)
      console.log(obj.link)
      console.log(parseInt(obj.time))
      const songImport = {
        title: obj.title,
        link: obj.link,
        time: parseInt(obj.time),
        //isOriginal: isOriginalBool
      }
      queueImport.push(songImport)
  }
    queue = queueImport
    queueImport = []

    mainWindow.webContents.send('ListUpdate', queue)
    var importAmount = queue.length
    mainWindow.webContents.send('errorEvent', 'Successfully imported ' + importAmount + ' songs!')
  }else {
    mainWindow.webContents.send('errorEvent', 'Error: File is corrupt or not in the correct format!')
    shell.beep()
  }
})

ipcMain.on('exitapp', () => {
  app.quit()
})

app.on('ready', () => {
  log.info('app started')

  mainWindow = new BrowserWindow({
    width: 850,
    height: 730,
    show: false,
    icon: __dirname + '/assets/logo.ico',
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.setMenuBarVisibility(false)

  mainWindow.loadFile(path.join(__dirname, './index.html'))
  mainWindow.show()
})

ipcMain.on('editSong', async (event, _songInfo) => {
  // queue.pop()
  let editWindow
  const { index } = _songInfo
  var songEditTitle = queue[index].title
  //queue.splice(index, 1)
  
  editWindow = new BrowserWindow({
    parent: mainWindow,
    width: 400,
    height: 300,
    show: false,
    icon: __dirname + '/assets/logo.ico',
    webPreferences: {
      nodeIntegration: true
    }
  })
  editWindow.setMenuBarVisibility(false)
  editWindow.closable = false
  editWindow.loadFile(path.join(__dirname, './edit.html'))
  editWindow.show()
  const songEditPos = index
  const songEditPosUser = parseInt(index) + 1
  editWindow.webContents.on('did-finish-load', () => {
    editWindow.webContents.send('positionEvent', songEditPosUser)
    editWindow.webContents.send('titleEvent', songEditTitle)
  })
  ipcMain.once('saveChanges', async (event, _songInfo) => {
    var editTitle = _songInfo.title
    var editPos = parseInt(_songInfo.position) - 1
    queue[songEditPos].title = editTitle


    function arrayMove(arr, oldIndex, newIndex) {
      while (oldIndex < 0) {
        oldIndex += arr.length
      }
      while (newIndex < 0) {
        newIndex += arr.length
      }
      if (newIndex >= arr.length) {
        let i = newIndex - arr.length + 1
        while (i--) {
          arr.push(undefined)
        }
      }
      arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
      return arr
    }
    if (editPos >= 0 && editPos < queue.length) {
      console.log(queue)
      console.log(arrayMove(queue, songEditPos, editPos))
      console.log(songEditPos)
      console.log(editPos)
      mainWindow.webContents.send('ListUpdate', queue)
      mainWindow.webContents.send('errorEvent', 'Moved: ' + editTitle + ' to #' + _songInfo.position)
    } else {
      mainWindow.webContents.send('errorEvent', 'Number not within acceptable range!')
      shell.beep()
    }
    // editWindow.webContents.send('editTitle', editTitle)
    // editWindow.webContents.send('editPos', editPos)
    
    editWindow.destroy()
  })
  //editWindow.webContents.send('positionEvent', songEditPos)
  //console.log(songEditPos)
  //mainWindow.webContents.send('ListUpdate', queue)
  //mainWindow.webContents.send('errorEvent', 'Deleted: ' + removedTitle)
})
// ipcMain.on('editTitle', (event, message) => {
//   console.log(message)
// })



ipcMain.on('saveChangesFail', async (event, _songInfo) => {
  mainWindow.webContents.send('errorEvent', 'Error saving song info, no value given.')
  shell.beep()
})

// ipcMain.on('saveChanges', async (event, _songInfo) => {
//   const { index } = _songInfo
  

//   //queue.splice(index, 1)
//   mainWindow.webContents.send('ListUpdate', queue)
//   mainWindow.webContents.send('errorEvent', 'Deleted: ' + removedTitle)
// })

app.on('window-all-closed', function () {
  log.info("all config windows closed")
  app.quit()
})


//when a "global" error occurs
process.on('unhandledRejection', err => {
  log.info('rejection', err)
})
//when a "global" error occurs
process.on('uncaughtException', (err) => {
  log.info('exception', err)
})