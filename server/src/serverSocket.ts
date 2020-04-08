///<reference path="./types/ws.d.ts"/>
import * as WebServer from 'ws';
import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {GameConstants} from '@common/game/gameConstants';
import {uuid} from '@common/utils/uuid';
import {ClientToServerMessageParser} from '@common/parsers/clientToServerMessageParser';
import {ServerToClientMessageParser} from '@common/parsers/serverToClientMessageParser';
import {createServer} from 'http';

export class ServerSocket implements IServerSocket {
  connections: {connectionId: string; socket: WebServer.WebSocket}[] = [];

  time = +new Date();

  totalBytesReceived = 0;
  totalBytesSent = 0;
  wss?: WebServer.Server;
  get totalBytesSentPerSecond() {
    return Math.round(this.totalBytesSent / ((+new Date() - this.time) / 1000));
  }
  sendMessage(connectionId: string, messages: ServerToClientMessage[]) {
    const client = this.connections.find((a) => a.connectionId === connectionId);
    if (!client) {
      return;
    }
    if (GameConstants.binaryTransport) {
      const body = ServerToClientMessageParser.fromServerToClientMessages(messages);
      this.totalBytesSent += body.byteLength;
      client.socket.send(body);
    } else {
      const body = JSON.stringify(messages);
      this.totalBytesSent += body.length * 2 + 1;
      client.socket.send(body);
    }
  }

  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ) {
    const port = parseInt('8081');
    console.log('port', port);
    const server = createServer((req, res) => {
      if (req.method === 'GET') {
        res.writeHead(200);
        res.end();
      }
    });
    this.wss = new WebServer.Server({server, perMessageDeflate: false});
    this.wss.on('error', (a: any, b: any) => {
      console.error('error', a, b);
    });

    this.wss.on('connection', (ws) => {
      ws.binaryType = 'arraybuffer';
      const me = {socket: ws, connectionId: uuid()};
      this.connections.push(me);
      console.log('opened: connections', this.connections.length);
      ws.on('error', (a: any, b: any) => {
        console.error('ws error', a, b);
      });
      ws.on('message', (message) => {
        if (GameConstants.binaryTransport) {
          // console.log('got message', (message as ArrayBuffer).byteLength);
          this.totalBytesReceived += (message as ArrayBuffer).byteLength;
          if (!(message instanceof ArrayBuffer)) {
            console.log('bad connection');
            ws.close();
            return;
          }
          const messageData = ClientToServerMessageParser.toClientToServerMessage(message as ArrayBuffer);
          if (messageData === null) {
            ws.close();
            return;
          }
          onMessage(me.connectionId, messageData);
        } else {
          onMessage(me.connectionId, JSON.parse(message as string));
        }
      });
      ws.on('error', (e) => console.log('errored', e));

      ws.onclose = () => {
        const ind = this.connections.findIndex((a) => a.connectionId === me.connectionId);
        if (ind === -1) {
          return;
        }
        this.connections.splice(ind, 1);
        console.log('closed: connections', this.connections.length);
        onLeave(me.connectionId);
      };
      onJoin(me.connectionId);
    });
    server.listen(port);
  }
}

export interface IServerSocket {
  totalBytesReceived: number;
  totalBytesSent: number;
  totalBytesSentPerSecond: number;

  sendMessage(connectionId: string, messages: ServerToClientMessage[]): void;
  start(
    onJoin: (connectionId: string) => void,
    onLeave: (connectionId: string) => void,
    onMessage: (connectionId: string, message: ClientToServerMessage) => void
  ): void;
}
