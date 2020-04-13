import glamorous from 'glamorous';
import {ClientLivePlayerEntity} from '../game/entities/clientLivePlayerEntity';
import {AvailablePlayerWeapon} from '@common/entities/playerEntity';
export const boxSize = '10vh';
export const boxMargin = 20;

export const SelectWeaponBox = glamorous.div<{liveEntity: ClientLivePlayerEntity; weapon: AvailablePlayerWeapon}>(
  ({weapon, liveEntity}) => ({
    width: boxSize,
    height: `calc(${boxSize}*1.5px)`,
    backgroundColor: liveEntity.selectedWeapon === weapon.weapon ? '#beae8d' : 'white',
    margin: boxMargin,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  })
);
