import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {DropEntity, DropModel} from '@common/entities/dropEntity';
import {GameConstants} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';
import {unreachable} from '@common/utils/unreachable';
import {CanvasUtils} from '../../utils/canvasUtils';

export class ClientDropEntity extends DropEntity implements ClientEntity {
  zIndex = DrawZIndex.Scenery;

  constructor(game: ClientGame, messageModel: DropModel) {
    super(game, messageModel.entityId, messageModel.drop);
    this.x = messageModel.x;
    this.y = messageModel.y;
    if (messageModel.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: this.y,
      });
    }
  }

  get asset() {
    switch (this.drop.type) {
      case 'health':
        return OrbitalAssets.assets['Power_ups.pill_blue'];
      case 'weapon':
        switch (this.drop.weapon) {
          case 'rocket':
            return OrbitalAssets.assets['Missiles.spaceMissiles_001'];
          case 'laser':
            return OrbitalAssets.assets['Lasers.laserBlue02'];
          case 'torpedo':
            return OrbitalAssets.assets['Missiles.spaceMissiles_004'];
          default:
            throw unreachable(this.drop.weapon);
        }
      default:
        throw unreachable(this.drop);
    }
  }
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }

  draw(context: CanvasRenderingContext2D): void {
    const circleSize = 50;
    const size = 30;
    context.save();
    context.translate(this.drawX, this.drawY);
    const asset = this.asset;
    CanvasUtils.circle(context, 0, 0, circleSize / 2);
    context.fillStyle = 'white';
    context.strokeStyle = 'red';
    context.lineWidth = 4;
    context.fill();
    context.stroke();
    context.drawImage(asset.image, -size / 2, -size / 2, size, size);
    context.restore();
  }

  tick() {}
}