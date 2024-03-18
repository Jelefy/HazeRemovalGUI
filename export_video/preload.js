const { ipcRenderer } = require('electron')
var frameCount, queue = []


ipcRenderer.on('init-frame-count', (event, _frameCount) => {
    frameCount = _frameCount
})

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('update-progress', (event, data) => {
        if (data[0] == 'error') {
            
        }
        else if (data[0] == 'success') {
            document.getElementById('frame-progress').innerText = frameCount.toString() + '/' + frameCount.toString()
            document.getElementById('percentage-progress').innerText = '已完成'
            document.getElementById('progress-bar-elem').style.width = '100%'
            document.getElementById('remaining-time-minute').innerText = '0'
            document.getElementById('remaining-time-second').innerText = '0'
            document.getElementById('exit-button').disabled = false
        }
        else {
            queue.push(Date.now())
            index = parseInt(data[0])
            document.getElementById('frame-progress').innerText = index.toString() + '/' + frameCount.toString()
            percentage = (index / frameCount * 100).toFixed(1) + '%'
            document.getElementById('percentage-progress').innerText = percentage
            document.getElementById('progress-bar-elem').style.width = percentage
            if (queue.length > 1) {
                latestDuration = (queue.at(queue.length - 1) - queue.at(0)) / (queue.length - 1) * (frameCount - index) / 1000
                document.getElementById('remaining-time-minute').innerText = parseInt(latestDuration / 60)
                document.getElementById('remaining-time-second').innerText = parseInt(latestDuration) % 60
            }
        }
    })
    document.getElementById('exit-button').addEventListener('click', () => {
        ipcRenderer.send('close-export-window')
    })
})