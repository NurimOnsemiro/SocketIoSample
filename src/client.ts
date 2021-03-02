import io from 'socket.io-client';
import { EWsNotiCmd, EWsReqCmd } from './const_common';

const socket = io('ws://127.0.0.1:3100', {
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
    //INFO: 서버에게 서버 정보 스트리밍 시작 요청
    socket.emit('message', {
        cmd: EWsReqCmd.StartServerStreaming
    });
})

const updateServerInfo = (ret: any) => {
    let items: IServerForm[] = ret.data.items;
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
}

/** INFO: 서버로부터 메시지를 수신 */
socket.on('message', (ret: any) => {
    console.log(JSON.stringify(ret));

    if(ret.cmd === EWsReqCmd.StartServerStreaming) {
        //INFO: 서버 조회 스트리밍 시작 응답
        //INFO: 처음 응답받은 후에 전체 서버 목록을 전달 받음
        console.log('Start Server Register');
        serverMap.clear();
        updateServerInfo(ret);
        updateSeq = ret.data.seq;
        console.log('Finish Server Register');
    }
    else if(ret.cmd === EWsNotiCmd.ServerStream){
        //INFO: 업데이트 서버 목록
        console.log('Receive Noti server stream');

        if(ret.data.seq - updateSeq !== 1){
            //INFO: 현재 갖고 있는 순번과 서버로부터 받은 순번의 값 차이가 1보다 크면 누락된 데이터가 있다.

            updateSeq = ret.data.seq;

            console.log('Request start server stream');
            //INFO: 누락된 데이터가 있으므로 다시 받아야 함 (재요청)
            socket.emit('message', {
                cmd: EWsReqCmd.StartServerStreaming
            });
            return;
        } 

        //INFO: 데이터를 정상적으로 수신하였다.
        console.log('Update seq number');

        updateSeq = ret.data.seq;

        console.log(ret.data.items.length);

        //INFO: 새로 받은 데이터를 갱신해 주어야 함
        updateServerInfo(ret);
        
        console.log('Update server done');
    }
    
    //console.log(JSON.stringify(data));
})

socket.on('disconnect', () => {
    console.log('disconnect');
    serverMap.clear();
    process.exit(0);
})

