export const enum EWsReqCmd {
    StartServerStreaming = 100,
    StopServerStreaming = 102,
}

export const enum EWsNotiCmd {
    ServerStream = 10000,
}

export const serverPort: number = 3100;

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}