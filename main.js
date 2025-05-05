const { PosPrinter } = require("electron-pos-printer");
const { app, BrowserWindow } = require("electron/main");
const path = require("path");
const { WebSocket } = require("ws");
const redis = require("redis");
const { ipcMain } = require("electron");
const { faker } = require("@faker-js/faker");

let mainWindow;

function mapPrinter() {
  const win = BrowserWindow.getFocusedWindow();
  win.webContents.once("did-finish-load", async () => {
    const list = await win.webContents.getPrintersAsync();
    win.webContents.send(
      "printers",
      list
        .map((x, idx) => `${idx + 1}-${x.displayName}`)
        .join("\n")
        .trim()
    );
  });
}

function printJob(data, printerName) {
  const options = {
    preview: false,
    margin: "0 0 0 0",
    copies: 1,
    printerName,
    timeOutPerLine: 400,
    silent: true,
    pageSize: "80mm",
  };

  const content = [
    {
      type: "text",
      value: `តុលេខ=​ ${data.table}`,
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
      },
    },
  ];

  if (data.delivery) {
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
    });
    content.push({
      type: "text",
      value: `ដឹកជញ្ជូន= ${data.delivery}`,
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
      },
    });
  }

  content.push({
    type: "text",
    value: "--------------------------------",
    style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
  });

  content.push({
    type: "text",
    value: `កាលបរិច្ឆេទ= ${data.date}`,
    style: {
      fontSize: "18px",
      fontWeight: "bold",
      fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
    },
  });

  content.push({
    type: "text",
    value: "--------------------------------",
    style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
  });

  content.push({
    type: "text",
    value: `ទំនិញ= ${data.title}`,
    style: {
      fontSize: "18px",
      fontWeight: "bold",
      fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
    },
  });

  if (data.addon) {
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
    });
    content.push({
      type: "text",
      value: `Addon= ${data.addon}`,
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
      },
    });
  }

  if (data.remark) {
    content.push({
      type: "text",
      value: "--------------------------------",
      style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
    });
    content.push({
      type: "text",
      value: `Remark= ${data.remark}`,
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
      },
    });
  }

  content.push({
    type: "text",
    value: "--------------------------------",
    style: { fontFamily: `Hanuman, 'Courier New', Courier, monospace` },
  });

  content.push({
    type: "text",
    value: `បញ្ជាទិញដោយ= ${data.by}`,
    style: {
      fontSize: "18px",
      fontWeight: "bold",
      fontFamily: `Hanuman, 'Courier New', Courier, monospace`,
    },
  });

  PosPrinter.print(content, options)
    .then(() => {
      console.log("Printer successfully");
      mainWindow.webContents.send(
        "print-job",
        JSON.stringify({
          success: true,
          message:
            "Printer successfully -------------------------------------------------",
        })
      );
    })
    .catch((err) => {
      console.log("Failed to print", err);
      JSON.stringify({
        success: true,
        message:
          "Failed to print -------------------------------------------------",
      });
    });
}

// Create the WebSocket server in main process
// const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server on port 8080

function isJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      imageAnimationPolicy: "animate",
      allowRunningInsecureContent: true,
      javascript: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadFile("index.html");
}

const client = redis.createClient({
  username: "default",
  password: "PIViYStQYFPiyFrK5WXLO4zEVYcOlgDJ",
  socket: {
    host: "redis-18190.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com",
    port: 18190,
  },
});

async function redisConnection() {
  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();

  await client.subscribe("realtime", (message) => {
    console.log("Received:", message);
    mainWindow.webContents.send(`realtime`, message);
    if (isJson(message)) {
      const data = JSON.parse(message);
      printJob(data, data.printerName);
    }
  });
}

app.whenReady().then(() => {
  redisConnection().then().catch().finally();

  createWindow();

  mapPrinter();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (client.isOpen) {
    client.quit();
  }
});

ipcMain.on("print-on-receipt", (event, agr) => {
  console.log(agr);
  const data = JSON.parse(agr);
  printJob(
    {
      table: faker.number.int(100),
      delivery: faker.company.name(),
      date: "2024-05-01 12:20:39",
      title: faker.commerce.productName(),
      addon: faker.food.ingredient(),
      remark: faker.commerce.productMaterial(),
      by: faker.person.fullName(),
    },
    data.printerName
  );
});
