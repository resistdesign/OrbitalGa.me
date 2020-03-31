import {Manager, Pan, Pinch, Press, Swipe, Tap} from 'hammerjs';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {ClientGame, LivePlayerEntity} from './clientGame';
import {GameView} from './gameView';
import {assert, Utils} from '../../../common/src/utils/utils';
import {start} from 'repl';
import {EnemyShotEntity, ShotEntity, SwoopingEnemyEntity, WallEntity} from '../../../common/src/entities/entity';
import {INoise, noise} from '../utils/perlin';
import {unreachable} from '../../../common/src/utils/unreachable';
import {GameData} from './gameData';
import {AssetManager} from '../utils/assetManager';

export class ClientGameUI extends ClientGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(options: {onDied: () => void; onDisconnect: () => void}, socket: IClientSocket) {
    super(options, socket);
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    const manager = new Manager(this.canvas);
    manager.add(new Press({time: 0}));
    manager.add(new Tap({event: 'doubletap', taps: 2, interval: 500})).recognizeWith(manager.get('press'));
    manager
      .add(new Tap({taps: 1}))
      .requireFailure('doubletap')
      .recognizeWith(manager.get('press'));

    window.addEventListener(
      'resize',
      () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        GameData.instance.view.setBounds(window.innerWidth, window.innerHeight);
        this.draw();
      },
      true
    );

    let lastPress: Date = new Date();
    let doubleTap = false;
    manager.on('press', e => {
      doubleTap = +new Date() - +lastPress < 200;
      lastPress = new Date();
    });
    manager.on('pressup', e => {
      doubleTap = false;
    });

    const path: {x: number; y: number}[] = [];
    let startPoint: {x: number; y: number};
    manager.on('tap', e => {
      if (path.length === 0) {
        path.push({x: 0, y: 0});
        startPoint = e.center;
      } else {
        path.push({x: e.center.x - startPoint.x, y: e.center.y - startPoint.y});
      }
      console.log(JSON.stringify(path, null, 2));
    });

    manager.on('doubletap', e => {});
    document.onkeydown = e => {
      if (e.keyCode === 65) {
        this.liveEntity?.pressShoot();
      }
      if (e.keyCode === 38) {
        this.liveEntity?.pressUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.pressDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.pressLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.pressRight();
      }
      // e.preventDefault();
    };
    document.onkeyup = e => {
      if (e.keyCode === 65) {
        this.liveEntity?.releaseShoot();
      }

      if (e.keyCode === 38) {
        this.liveEntity?.releaseUp();
      } else if (e.keyCode === 40) {
        this.liveEntity?.releaseDown();
      } else if (e.keyCode === 37) {
        this.liveEntity?.releaseLeft();
      } else if (e.keyCode === 39) {
        this.liveEntity?.releaseRight();
      }
    };

    const requestNextFrame = () => {
      requestAnimationFrame(() => {
        this.draw();
        requestNextFrame();
      });
    };
    requestNextFrame();
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.liveEntity) {
      GameData.instance.view.setCenterPosition(
        GameData.instance.view.transformPoint(this.liveEntity.drawX),
        GameData.instance.view.viewHeight / 2 + this.liveEntity.drawY / 5
      );
    }

    if (!this.connectionId) {
      context.fillStyle = 'white';
      context.fillText('Connecting...', 100, 100);
      return;
    }
    context.save();

    const outerBox = GameData.instance.view.outerViewBox;
    const box = GameData.instance.view.viewBox;
    context.scale(GameData.instance.view.scale, GameData.instance.view.scale);
    context.translate(-box.x, -box.y);

    context.font = '25px bold';
    for (const entity of this.entities) {
      if (!GameData.instance.view.contains(entity)) {
        continue;
      }
      switch (entity.type) {
        case 'player':
          break;
        case 'enemyShot':
          assert(entity instanceof EnemyShotEntity);
          context.fillStyle = 'pink';
          // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 5, entity.y - 5, 10, 10);
          break;
        case 'wall':
          assert(entity instanceof WallEntity);
          context.fillStyle = 'white';
          context.fillRect(entity.x, entity.y, entity.width, entity.height);
          break;
        case 'shot':
          assert(entity instanceof ShotEntity);
          context.fillStyle = 'yellow';
          // context.fillText(`${entity.x.toFixed(1)},${entity.y.toFixed(1)}`, entity.x, entity.y - 25);
          context.fillRect(entity.x - 5, entity.y - 5, 10, 10);
          break;
        case 'swoopingEnemy':
          assert(entity instanceof SwoopingEnemyEntity);
          const ship = AssetManager.assets.ship2;
          context.save();
          context.translate(entity.x, entity.y);
          context.rotate(Math.PI);
          context.drawImage(ship.image, -ship.size.width / 2, -ship.size.height / 2);
          context.restore();
          break;
        default:
          unreachable(entity.type);
          break;
      }
    }

    for (const entity of this.entities) {
      switch (entity.type) {
        case 'player':
          if (entity instanceof LivePlayerEntity) {
            const ship = AssetManager.assets.ship1;
            context.drawImage(ship.image, entity.drawX - ship.size.width / 2, entity.drawY - ship.size.height / 2);
          } else {
            const ship = AssetManager.assets.ship1;
            context.drawImage(ship.image, entity.x - ship.size.width / 2, entity.y - ship.size.height / 2);
          }
          break;
      }
    }

    context.restore();
  }
}
