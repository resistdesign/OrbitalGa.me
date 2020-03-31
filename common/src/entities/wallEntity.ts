import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {Entity} from './entity';

export class WallEntity extends Entity {
  boundingBox = {width: this.width, height: this.height};

  createPolygon(): void {
    this.polygon = new Polygon(this.x, this.y, [
      [0, 0],
      [this.width, 0],
      [this.width, this.height],
      [0, this.height],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  tick(): void {}

  constructor(game: Game, entityId: number, public width: number, public height: number) {
    super(game, entityId, 'wall');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
}
