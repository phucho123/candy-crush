import { CONST } from '../const/const'
import { CustomEmitter } from './CustomEmitter'

export class EmitterManager {
    static instance: EmitterManager | null = null
    private scene: Phaser.Scene
    private boardEmitter: Phaser.GameObjects.Particles.ParticleEmitter[][]
    private customEmitter: CustomEmitter

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.createBoardEmitter()
        this.customEmitter = CustomEmitter.getInstance(this.scene)
    }

    static getInstance(scene: Phaser.Scene) {
        if (!EmitterManager.instance) EmitterManager.instance = new EmitterManager(scene)
        return EmitterManager.instance
    }

    update() {
        ///
    }

    createBoardEmitter() {
        this.boardEmitter = []
        for (let y = 0; y < CONST.gridHeight; y++) {
            this.boardEmitter[y] = []
            for (let x = 0; x < CONST.gridWidth; x++) {
                const emitter = this.scene.add
                    .particles(
                        x * CONST.tileWidth + CONST.tileWidth / 2,
                        y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY,
                        'flares',
                        {
                            frame: ['white'],
                            lifespan: 300,
                            speed: { min: 100, max: 150 },
                            scale: { start: 0.8, end: 0 },
                            gravityY: 0,
                            blendMode: 'ADD',
                            emitting: false,
                        }
                    )
                    .setDepth(-2)
                this.boardEmitter[y].push(emitter)
            }
        }
    }

    explodeBoardEmitter(x: number, y: number) {
        this.boardEmitter[y][x].explode(5)
    }

    public setColorEmitter(x: number, y: number, color: string) {
        this.boardEmitter[y][x].setConfig({
            frame: [color],
            lifespan: 300,
            speed: { min: 100, max: 150 },
            scale: { start: 0.8, end: 0 },
            gravityY: 0,
            blendMode: 'ADD',
            emitting: false,
        })
    }

    playConfettiEffect() {
        this.customEmitter.playConfettiEffect()
    }
}
