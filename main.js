// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require("fs")
const fsPromises = fs.promises
const path = require("path")
var log = require('electron-log')
const ytdl = require('ytdl-core')
const ytpl = require ('ytpl')
const DurationTime = require('duration-time-format')
const { autoUpdater } = require("electron-updater")
autoUpdater.checkForUpdatesAndNotify()

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

let queue = []

ipcMain.on('addSong', async (event, _songInfo) => {
  var inputLink = _songInfo.url
  function contains(str, text) {
    return (str.indexOf(text) >= 0)
 }
  const watchPlistcheck = inputLink.match(/(youtube.com|youtu.be)\/(playlist)(\?list=)(\S+)?/)
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
      return
    }
  }
  else {
    const watchCheck = inputLink.match(/(youtube\.com\/watch\?v=|youtu\.be)(\S+)?/)

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
        return
      }
    } else {
      mainWindow.webContents.send('errorEvent', '"' + inputLink + '"' + ' is not a valid YouTube link!')
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

    queue = jsonData

    mainWindow.webContents.send('ListUpdate', queue)
    var importAmount = queue.length
    mainWindow.webContents.send('errorEvent', 'Successfully imported ' + importAmount + ' songs!')
  }else {
    mainWindow.webContents.send('errorEvent', 'Error: File is corrupt or not in the correct format!')
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

  mainWindow.loadFile(path.join(__dirname, '/index.html'))
  mainWindow.show()
})

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