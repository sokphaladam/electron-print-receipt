const { PosPrinter } = require('electron-pos-printer')
const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const {WebSocket} = require('ws')

let mainWindow

async function mapPrinter(){
  const list = await BrowserWindow.getFocusedWindow().webContents.getPrintersAsync();
  console.log(list)
}

function printJob(data, printerName){
  const options = {
    preview: false,
    margin: '0 0 0 0',
    copies: 1,
    printerName,
    timeOutPerLine: 400,
    silent: true,
    pageSize: '80mm'
  }

  const content = [
    {
      type: 'text',
      value: `តុលេខ=​ ${data.table}`,
      style: {fontSize: '20px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    },
  ]

  if(data.delivery) {
    content.push({
      type: 'text',
      value: '--------------------------------',
      style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
    content.push({
      type: 'text',
      value: `ដឹកជញ្ជូន= ${data.delivery}`,
      style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
  }

  content.push({
    type: 'text',
    value: '--------------------------------',
    style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })

  content.push({
    type: "text",
    value: `កាលបរិច្ឆេទ= ${data.date}`,
    style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })

  content.push({
    type: 'text',
    value: '--------------------------------',
    style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })

  content.push({
    type: 'text',
    value: `ទំនិញ= ${data.title}`,
    style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })

  if(data.addon){
    content.push({
      type: 'text',
      value: '--------------------------------',
      style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
    content.push({
      type: 'text',
      value: `Addon= ${data.addon}`,
      style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
  }

  if(data.remark){
    content.push({
      type: 'text',
      value: '--------------------------------',
      style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
    content.push({
      type: 'text',
      value: `Remark= ${data.remark}`,
      style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
    })
  }

  content.push({
    type: 'text',
    value: '--------------------------------',
    style: {fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })
  
  content.push({
    type: 'text',
    value: `បញ្ជាទិញដោយ= ${data.by}`,
    style: {fontSize: '18px', fontWeight: 'bold', fontFamily: `Hanuman, 'Courier New', Courier, monospace`}
  })

  console.log(content, options)


  PosPrinter.print(content, options).then(() => console.log('Printer successfully')).catch((err)=>console.log('Failed to print', err))
}

// Create the WebSocket server in main process
const wss = new WebSocket.Server({ port: 8080 });  // WebSocket server on port 8080

function isJson(json){
  try{
    JSON.parse(json);
    return true
  }catch{
    return false
  }
}

wss.on('connection', (ws) => {
  console.log('A client connected');

  // Send a welcome message to the connected client
  ws.send('Hello from the WebSocket server!');

  // Listen for messages from the client
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    if(isJson(message)) {
      const data = JSON.parse(message);
      printJob(data, data.printerName);
    }
    ws.send(`Echo: ${message}`);  // Echo the message back to the client
  });

  ws.on('close', () => {
    console.log('A client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
        contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  })

  mainWindow.webContents.openDevTools();

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  mapPrinter()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
    if(wss) {
        wss.close()
    }
})