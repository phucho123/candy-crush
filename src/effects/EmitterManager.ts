import { CONST } from '../const/const'
import { CustomEmitter } from './CustomEmitter'

export class EmitterManager {
    static instance: EmitterManager | null = null
    private scene: Phaser.Scene
    private boardEmitter: Phaser.GameObjects.Particles.ParticleEmitter[][]
    private customEmitter: CustomEmitter
    // private confettiEmitter: Phaser.GameObjects.Particles.ParticleEmitter

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.createBoardEmitter()
        this.customEmitter = CustomEmitter.getInstance(this.scene)
        // this.scene.input.on('pointerdown', () => this.playConfettiEffect())
        // this.confettiEmitter = this.scene.add
        //     .particles(0, 200, 'red', {
        //         lifespan: 5000, //300
        //         x: { min: -100, max: 0 },
        //         speed: { min: 500, max: 900 },
        //         // scaleX: { start: 0.8, end: 0 },
        //         gravityY: 500,
        //         gravityX: 200,
        //         emitting: false,
        //     })
        //     .setDepth(10)
    }

    static getInstance(scene: Phaser.Scene): EmitterManager {
        if (!EmitterManager.instance) EmitterManager.instance = new EmitterManager(scene)
        return EmitterManager.instance
    }

    public update(): void {
        ///
    }

    public createBoardEmitter(): void {
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
                            lifespan: 300, //300
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

    public explodeBoardEmitter(x: number, y: number): void {
        this.boardEmitter[y][x].explode(5)
    }

    public setColorEmitter(x: number, y: number, color: string): void {
        this.boardEmitter[y][x].setConfig({
            frame: [color],
            lifespan: 300, //300
            speed: { min: 100, max: 150 },
            scale: { start: 0.8, end: 0 },
            gravityY: 0,
            blendMode: 'ADD',
            emitting: false,
        })
    }

    public playConfettiEffect(): void {
        this.customEmitter.playConfettiEffect()
        // this.confettiEmitter.emitting = true
        // this.scene.add.tween({
        //     targets: this.confettiEmitter,
        //     gravityY: 300,
        //     gravityX: 200,
        //     duration: 1000,
        //     // acceleration: -100,
        //     onComplete: () => {
        //         this.confettiEmitter.emitting = false
        //     },
        // })
    }
}
