import { Confetti } from './Confetti'

export class CustomEmitter {
    static instance: CustomEmitter | null = null
    private scene: Phaser.Scene
    private pool: Phaser.GameObjects.Group

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.init()
        // this.scene.input.on('pointerdown', () => this.playConfettiEffect())
    }

    static getInstance(scene: Phaser.Scene) {
        if (!CustomEmitter.instance) {
            CustomEmitter.instance = new CustomEmitter(scene)
        }
        return CustomEmitter.instance
    }

    public init() {
        this.pool = this.scene.add.group({
            classType: Confetti,
            maxSize: 200,
            runChildUpdate: true,
        })
    }

    public playConfettiEffect() {
        let tmp = this.pool.get()
        let a = 0
        while (tmp) {
            if (a % 2 == 0) tmp.fire(1)
            else tmp.fire(-1)
            a++
            tmp = this.pool.get() as Confetti
        }
    }
}
