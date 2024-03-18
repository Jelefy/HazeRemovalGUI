const os = require('os')
const path = require('path')
const { ipcRenderer } = require('electron');
const ChildProcess = require('child_process')
const dehazeProc = ChildProcess.spawn('HazeRemovalProcessor')
const endStr = 'END' + os.EOL

function fixZero(num, n) {
  num = num.toString()
  if (num.length < n)
    num = '0'.repeat(n - num.length) + num
  return num
}

function toFormatTime(second) {
  second = parseInt(second)
  return fixZero(parseInt(second / 3600), 2) + ':' + fixZero(parseInt(second / 60) % 60, 2) + ':' + fixZero(second % 60, 2)
}

var frameCount, duration
var buf = '', funcToDo = null
var tarIndex, nxtIndex = null
var filename

dehazeProc.stdout.on('data', (data) => {
  if (funcToDo === null)
    return
  buf += data
  if (buf.endsWith(endStr)) {
    funcToDo(buf.split(os.EOL))
    buf = ''
  }
})

const output = (filepath) => {
  ipcRenderer.send('export-video', frameCount)
  funcToDo = (data) => {
    ipcRenderer.send('update-progress', data)
  }
  dehazeProc.stdin.write('output\n' + filepath + '\n')
}

const swchIndex = () => {
  tarIndex = nxtIndex
  funcToDo = (data) => {
    document.getElementById('raw-img').src = data[0]
    document.getElementById('processed-img').src = data[1]
    if (tarIndex == nxtIndex) {
      nxtIndex = null
    }
    else {
      swchIndex()
    }
  }
  dehazeProc.stdin.write('preview\n' + tarIndex + '\n')
}

const preview = (index) => {
  document.getElementById('cur-time-text').innerText = toFormatTime(duration / frameCount * index)
  if (nxtIndex === null) {
    nxtIndex = index
    swchIndex()
  }
  else {
    nxtIndex = index
  }
}

const media = (filepath) => {
  funcToDo = (data) => {
    if (data[0] == 'success') {
      frameCount = parseInt(data[1])
      duration = parseFloat(data[2])
      filename = path.basename(filepath)
      pos = filename.lastIndexOf('.')
      filename = filename.substring(0, pos) + '_dehazed' + filename.substring(pos)
      filepath = path.join(path.dirname(filepath), filename)
      document.getElementById('directory-selector').value = filepath
      document.getElementById('preview-slider').max = frameCount - 2
      document.getElementById('tot-time-text').innerText = toFormatTime(duration)
      document.getElementById('waiting').style.display = 'none'
      document.getElementById('container').style.display = 'flex'
      preview(0)
    }
    else if (data[0] == 'error') {

    }
  }
  dehazeProc.stdin.write('media\n' + filepath + '\n')
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('container').style.display = 'none'
  document.getElementById('waiting').addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files.length > 1)
      return;
    media(event.dataTransfer.files[0].path);
  });
  document.getElementById('waiting').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  document.getElementById('preview-slider').addEventListener('input', (event) => {
    preview(event.target.value)
  })
  document.getElementById('selector-button').addEventListener('click', () => {
    ipcRenderer.invoke('dialog:openDirectory').then(result => {
      document.getElementById('directory-selector').value = path.join(result, filename)
    })
  })
  document.getElementById('export-button').addEventListener('click', () => {
    output(document.getElementById('directory-selector').value)
  })
})