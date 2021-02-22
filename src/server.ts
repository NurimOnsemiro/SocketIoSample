import express from 'express';
import http from 'http';
import path from 'path';
import { Socket } from 'socket.io';

let app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

let server = http.createServer(app);

let io = require('socket.io')(server);

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}

interface IServerForm {
    idx?: number;
    serverState?: number;
    serverType?: number;
    osType?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
}

let serverMap = new Map<number, IServerForm>();
for(let i=0;i<100;i++){
    serverMap.set(i, {
        idx: i,
        serverState: getRandomInt(0, 3),
        serverType: getRandomInt(0, 5),
        osType: getRandomInt(0, 1),
        cpuUsage: Math.random(),
        memoryUsage: Math.random(),
        diskUsage: Math.random(),
    });
}

interface IUpdateForm {
    seq: number;
    items: IServerForm[];
}
// let updateStore: IUpdateForm = {
//     seq: 0,
//     items: []
// }

let updateSeq: number = 0;

setInterval(()=>{
    console.log('Update servers');
    //updateStore.items = [];
    let newItems: IServerForm[] = []
    for(let i=0;i<100;i++){
        if(Math.random() > 0.2) continue;

        let newData: IServerForm = {};

        let serverInfo = serverMap.get(i);
        if(Math.random() < 0.3){
            serverInfo.cpuUsage = Math.random();
            newData.cpuUsage = serverInfo.cpuUsage;
        }

        if(Math.random() < 0.3){
            serverInfo.memoryUsage = Math.random();
            newData.memoryUsage = serverInfo.memoryUsage;
        }

        if(Math.random() < 0.3){
            serverInfo.diskUsage = Math.random();
            newData.diskUsage = serverInfo.diskUsage;
        }

        if(Math.random() < 0.1){
            serverInfo.serverState = getRandomInt(0, 4);
            newData.serverState = serverInfo.serverState;
        }

        if(Object.keys(newData).length == 0){
            continue;
        }

        newData.idx = serverInfo.idx;

        //updateStore.items.push(newData);
        newItems.push(newData);
    }

    if(newItems.length !== 0){
        let newSeq = updateSeq++;
        let ret = {
            cmd: 101,
            body: {
                seq: newSeq,
                items: newItems
            }
        };

        console.log(JSON.stringify(ret));

        for(let idx of serverSubscribers){
            let sock = socketMap.get(idx);
            sock.emit('message', ret);
        }
    }
}, 10000);


let userIdx: number = 1;

interface IWsPacketForm {
    cmd: number;
    body?: object;
    res?: object;
}

let socketMap = new Map<number, Socket>();
let serverSubscribers = new Set<number>();

io.on('connection', (socket: Socket) => {
    const idx: number = userIdx++;
    socketMap.set(idx, socket);
    console.log('a user connected; userIdx : ' + idx);

    socket.on('connect', () => {
        console.log(idx + ' connect');
    })
    
    socket.on('message', (data: IWsPacketForm) => {
        console.log(data);

        const cmd: number = data.cmd;
        switch(cmd){
            case 100: {
                socket.emit('message', {
                    cmd: 101,
                    body: {
                        seq: updateSeq,
                        items: Array.from(serverMap.values())
                    }
                });
                serverSubscribers.add(idx);
                break;
            }
        }
    })
    
    socket.on('disconnect', () => {
        console.log(idx + ' disconnect');
        serverSubscribers.delete(idx);
        socketMap.delete(idx);
    })
    
})

server.listen(3000, () => {
    console.log('Listening on *:3000');
});