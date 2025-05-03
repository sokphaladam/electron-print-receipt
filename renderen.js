let socket = null;

function connectToServer(){
    try {
        socket = new WebSocket(`ws://localhost:8080`);

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        }
    }catch(err){
        console.log(err)
    }
}

let btnConnect = document.getElementById('btn_connect');

btnConnect.addEventListener('click', () =>{
    if(socket){
        socket.close()
    }else {
        connectToServer()
    }
})