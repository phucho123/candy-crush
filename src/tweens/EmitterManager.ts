import { CONST } from '../const/const'

export class EmitterManager {
    static instance: EmitterManager | null = null
    private scene: Phaser.Scene
    private conffetiEmitter: Phaser.GameObjects.Particles.ParticleEmitter
    private boardEmitter: Phaser.GameObjects.Particles.ParticleEmitter[][]
    private hintPosition: number[]

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.hintPosition = []
        this.conffetiEmitter = this.scene.add
            .particles(0, 0, 'flares', {
                frame: ['red', 'blue', 'yellow'],
                lifespan: 3000,
                // speedX: { min: 100, max: 250 },
                // speedX: 500,
                scale: { start: 0.3, end: 0.3 },
                rotate: { start: 0, end: 360 },
                angle: { min: 300, max: 330 },
                gravityY: 200,
                emitting: false,
            })
            .setDepth(-2)
        const tmp = this.conffetiEmitter
        if (tmp) {
            const tmp2 = tmp.body
            if (tmp2) tmp2.mass = 10
        }
        this.conffetiEmitter.speedX = 1000
        this.conffetiEmitter.speedY = -200
        this.createBoardEmitter()
    }

    static getInstance(scene: Phaser.Scene) {
        if (!EmitterManager.instance) EmitterManager.instance = new EmitterManager(scene)
        return EmitterManager.instance
    }

    playConffetiEffect(x: number, y: number) {
        this.conffetiEmitter.setPosition(x, y)
        this.conffetiEmitter.explode(100)
    }

    update() {
        const m = 10 as number
        const g = this.conffetiEmitter.gravityY as number
        const p = 0.0001
        const a = this.conffetiEmitter.scale as number
        const Cd = -0.00001
        const v_x = this.conffetiEmitter.speedX as number
        const v_y = this.conffetiEmitter.speedY as number
        const v_x_after = Math.sqrt(Math.pow(v_x, 2) + (2 * m * g) / (p * a * Cd))
        const v_y_after = Math.sqrt(Math.pow(v_y, 2) + (2 * m * g) / (p * a * Cd))
        this.conffetiEmitter.speedX = v_x_after
        this.conffetiEmitter.speedY = v_y_after
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
                            lifespan: 500,
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
        this.boardEmitter[y][x].explode(32)
    }

    public playHintEffect(x: number, y: number) {
        if (this.hintPosition.length >= 4) return
        this.boardEmitter[y][x].frequency = 0
        this.boardEmitter[y][x].start()
        this.hintPosition.push(x, y)
    }

    public stopHintEffect() {
        if (this.hintPosition.length <= 0) return
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                this.boardEmitter[y][x].stop()
            }
        }
        this.boardEmitter[this.hintPosition[1]][this.hintPosition[0]].stop()
        this.boardEmitter[this.hintPosition[3]][this.hintPosition[2]].stop()
        this.hintPosition.splice(0, 4)
    }

    public setColorEmitter(x: number, y: number, color: string) {
        this.boardEmitter[y][x].setConfig({
            frame: [color],
            lifespan: 500,
            speed: { min: 100, max: 150 },
            scale: { start: 0.8, end: 0 },
            gravityY: 0,
            blendMode: 'ADD',
            emitting: false,
        })
    }
}
