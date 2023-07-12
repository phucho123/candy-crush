export class EmitterManager {
    static instance: EmitterManager | null = null
    private scene: Phaser.Scene
    private conffetiEmitter: Phaser.GameObjects.Particles.ParticleEmitter

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.conffetiEmitter = this.scene.add
            .particles(0, 0, 'flares', {
                frame: ['red', 'blue', 'yellow'],
                lifespan: 3000,
                speed: { min: 200, max: 250 },
                // speedX: 500,
                scale: { start: 0.5, end: 0 },
                rotate: { start: 0, end: 360 },
                gravityY: 200,
                emitting: false,
            })
            .setDepth(-2)
        const tmp = this.conffetiEmitter
        if (tmp) {
            const tmp2 = tmp.body
            if (tmp2) tmp2.mass = 10
        }
    }

    static getInstance(scene: Phaser.Scene) {
        if (!EmitterManager.instance) EmitterManager.instance = new EmitterManager(scene)
        return EmitterManager.instance
    }

    playConffetiEffect(x: number, y: number) {
        this.conffetiEmitter.setPosition(x, y)
        this.conffetiEmitter.explode(32)
    }

    update() {
        const tmp = this.conffetiEmitter.accelerationX as number
        this.conffetiEmitter.accelerationX =
            tmp + (-3 * Math.pow(this.conffetiEmitter.speedX as number, 2)) / 10
    }
}
