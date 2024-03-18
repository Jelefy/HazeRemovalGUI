const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
var mainWin, exportWin

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
        properties: ['openDirectory']
    })
    if (canceled) {
        return
    } else {
        return filePaths[0]
    }
})

ipcMain.on('close-export-window', (event) => {
    exportWin.closable = true
    exportWin.close()
})

ipcMain.on('update-progress', (event, info) => {
    if (exportWin && exportWin.webContents) {
        exportWin.webContents.send('update-progress', info)
    }
})

ipcMain.on('export-video', (event, frameCount) => {
    exportWin = new BrowserWindow({
        width: 540,
        height: 190,
        modal: true,
        parent: mainWin,
        backgroundColor: '#181818',
        closable: false,
        minimizable: false,
        maximizable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'export_video', 'preload.js')
        }
    })
    exportWin.setMenuBarVisibility(false)
    exportWin.loadFile(path.join('export_video', 'export_video.html')).then(() => {
        exportWin.webContents.send('init-frame-count', frameCount)
    })
})

const createWindow = () => {
    mainWin = new BrowserWindow({
        width: 1600,
        height: 600,
        minWidth: 1600,
        minHeight: 620,
        backgroundColor: '#181818',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })
    mainWin.setMenuBarVisibility(false)
    mainWin.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})