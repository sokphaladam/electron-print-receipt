// let socket = null;

// function connectToServer() {
//   try {
//     socket = new WebSocket(`ws://localhost:8080`);

//     socket.onopen = () => {
//       console.log("Connected to WebSocket server");
//     };
//   } catch (err) {
//     console.log(err);
//   }
// }

// let btnConnect = document.getElementById("btn_connect");

// btnConnect.addEventListener("click", () => {
//   if (socket) {
//     socket.close();
//   } else {
//     connectToServer();
//   }
// });

let printers = null;

window.electron.ipcRenderer.on("printers", (args) => {
  printers = args;
});

window.electron.ipcRenderer.on("print-job", (args) => {
  const element = document.getElementById("pre-code");
  const x = JSON.parse(args);
  let div = document.createElement("div");
  div.innerHTML = x.message;
  if (x.success === true) {
    div.className = "text-emerald-600";
  } else {
    div.className = "text-rose-600";
  }
  element.innerHTML = x.message + "\n\n" + element.innerHTML;
});

window.electron.ipcRenderer.on("realtime", (args) => {
  const element = document.getElementById("pre-code");
  const x = JSON.parse(args);
  element.innerHTML =
    x.device + " : " + JSON.stringify(x, null, 2) + "\n\n" + element.innerHTML;
});

let btnPrinter = document.getElementById("btn_print");

btnPrinter.addEventListener("click", () => {
  const element = document.getElementById("pre-code");
  element.innerHTML = printers + "\n\n" + element.innerHTML;
  const s = document.getElementById("bottom_pre");
  s.scrollTop = s.scrollHeight;
});

let btn_test = document.getElementById("btn_test");

btn_test.addEventListener("click", () => {
  const input = document.getElementById("input_print");
  window.electron.ipcRenderer.send(
    "print-on-receipt",
    JSON.stringify({
      printerName: input.value,
      data: "send",
    })
  );
});
