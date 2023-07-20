import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Candy crush',
    url: 'https://github.com/digitsensitive/phaser3-typescript',
    version: '2.0',
    width: 520,
    height: 720,
    type: Phaser.AUTO,
    parent: 'game',
    scene: [BootScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 400 },
            debug: false,
        },
    },
    backgroundColor: '#de3412',
    render: { pixelArt: false, antialias: true },
}
