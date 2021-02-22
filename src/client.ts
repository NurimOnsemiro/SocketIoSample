import io from 'socket.io-client';

const socket = io('ws://127.0.0.1:3000', {
    reconnectionDelayMax: 10000,
});

interface IServerForm {
    idx?: number;
    serverState?: number;
    serverType?: number;
    osType?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
}

interface IUpdateForm {
    seq: number;
    items: IServerForm[];
}

let updateSeq: number = -1;
let serverMap = new Map<number, IServerForm>();

socket.on('connect', () => {
    console.log(socket.id + ' connect');
    socket.emit('message', {
        cmd: 100,
        body: {}
    });
})

socket.on('message', (data: any) => {
    if(data.cmd === 101){
        if(updateSeq === -1){
            updateSeq = data.body.seq;
        } else if(data.body.seq - updateSeq !== 1){
            //INFO: 누락된 데이터가 있으므로 다시 받아야 함
            return;
        } else {
            updateSeq = data.body.seq;
        }

        console.log(data.body.items.length);
        let items: IServerForm[] = data.body.items;
        for(let item of items){
            let serverIdx: number = item.idx;
            if(serverMap.has(serverIdx) === false){
                console.log('New server - ' + serverIdx);
                //INFO: 새로운 서버 등록
                serverMap.set(serverIdx, item);
            } else {
                console.log('Update server - ' + serverIdx);
                //INFO: 기존 값 갱신
                let serverInfo = serverMap.get(serverIdx);
                for(let key in item){
                    serverInfo[key] = item[key];
                }
            }
        }
        console.log('Update server done');
    }
    
    //console.log(JSON.stringify(data));
})

socket.on('disconnect', () => {
    console.log('disconnect');
    serverMap.clear();
    process.exit(0);
})

