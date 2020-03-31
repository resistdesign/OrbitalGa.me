import React, {useEffect, useRef, useState} from 'react';
import './index.css';
import {ClientGameUI} from '../../game/clientGameUI';
import {ClientSocket} from '../../clientSocket';
import {observer} from 'mobx-react';

export const GameScreen: React.FC = observer(props => {
  const client = useRef<ClientGameUI>(null);
  const [died, setDied] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  useEffect(() => {
    connect();
  }, []);

  function connect() {
    (client as React.MutableRefObject<ClientGameUI>).current = new ClientGameUI(
      {
        onDied: () => {
          setDied(true);
        },
        onDisconnect: () => {
          setDisconnected(true);
        },
      },
      new ClientSocket()
    );
  }

  return (
    <div className="App">
      <canvas id={'game'} width={window.innerWidth} height={window.innerHeight} />
      {disconnected && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            top: 0,
            color: 'white',
          }}
        >
          <span style={{fontSize: '3rem'}}>DISCONNECTED</span>
          <button
            onClick={() => {
              connect();
              setDisconnected(false);
            }}
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
});