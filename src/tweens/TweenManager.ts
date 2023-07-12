import { CONST } from '../const/const'
import { Tile } from '../objects/tile'
import { GameScene } from '../scenes/game-scene'

export class TweenManager {
    private scene: Phaser.Scene
    public static instance: TweenManager | null = null
    private restartTween: Phaser.Tweens.Tween
    private gameScene: GameScene | null
    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.gameScene = GameScene.getIntance()
    }

    static getInstance(scene: Phaser.Scene) {
        if (!TweenManager.instance) TweenManager.instance = new TweenManager(scene)
        return TweenManager.instance
    }

    restartTweenPlay(tileGrid: Tile[][]) {
        const gameObj = [] as Tile[]
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                gameObj.push(tileGrid[y][x])
            }
        }

        ///shuffle array
        for (let i = gameObj.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[gameObj[i], gameObj[j]] = [gameObj[j], gameObj[i]]
        }

        const circle = new Phaser.Geom.Circle(
            this.scene.sys.canvas.width / 2,
            this.scene.sys.canvas.height / 2 + 144,
            200
        )

        Phaser.Actions.PlaceOnCircle(gameObj, circle)

        if (this.restartTween) this.restartTween.destroy()

        this.restartTween = this.scene.tweens.add({
            targets: circle,
            radius: 200,
            ease: 'Quintic.easeInOut',
            duration: 1000,
            yoyo: true,
            repeat: 1,
            onUpdate: function () {
                Phaser.Actions.RotateAroundDistance(
                    gameObj,
                    { x: circle.x, y: circle.y },
                    0.02,
                    circle.radius
                )
            },
            onComplete: () => {
                if (tileGrid) {
                    for (let y = 0; y < CONST.gridHeight; y++) {
                        for (let x = 0; x < CONST.gridWidth; x++) {
                            if (y == CONST.gridHeight - 1 && x == CONST.gridWidth - 1) {
                                this.scene.add.tween({
                                    targets: tileGrid[y][x],
                                    x: (x + 0.5) * CONST.tileWidth,
                                    y: (y + 0.5) * CONST.tileHeight + CONST.alignY,
                                    repeat: 0,
                                    ease: 'quad.out',
                                    duration: 1000,
                                    onComplete: () => this.gameScene?.checkMatches(),
                                })
                            } else {
                                this.scene.add.tween({
                                    targets: tileGrid[y][x],
                                    x: (x + 0.5) * CONST.tileWidth,
                                    y: (y + 0.5) * CONST.tileHeight + CONST.alignY,
                                    repeat: 0,
                                    ease: 'quad.out',
                                    duration: 1000,
                                })
                            }
                        }
                    }
                }
            },
        })
    }
}
