import { CONST } from '../const/const'
import { Tile } from '../objects/tile'
import { GameScene } from '../scenes/game-scene'
import { CustomEmitter } from './CustomEmitter'
import { LevelupPopup } from './LevelupPopup'

export class TweenManager {
    private scene: Phaser.Scene
    private gameScene: GameScene | null
    public static instance: TweenManager | null = null
    private restartTween: Phaser.Tweens.Tween
    private firstSelectedTileTween: Phaser.Tweens.Tween
    private secondSelectedTileTween: Phaser.Tweens.Tween
    private gameObj: Tile[]
    private levelupPopup: LevelupPopup
    private customEmitter: CustomEmitter

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.gameScene = GameScene.getIntance()
        this.gameObj = [] as Tile[]
        this.levelupPopup = LevelupPopup.getInstance(this.scene)
        this.customEmitter = CustomEmitter.getInstance(this.scene)
    }

    static getInstance(scene: Phaser.Scene) {
        if (!TweenManager.instance) TweenManager.instance = new TweenManager(scene)
        return TweenManager.instance
    }

    restartTweenPlay(tileGrid: Tile[][]) {
        const size = this.gameObj.length
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                if (!size) this.gameObj.push(tileGrid[y][x])
                else this.gameObj[y * CONST.gridWidth + x] = tileGrid[y][x]
            }
        }

        ///shuffle array
        for (let i = this.gameObj.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[this.gameObj[i], this.gameObj[j]] = [this.gameObj[j], this.gameObj[i]]
        }

        const circle = new Phaser.Geom.Circle(
            this.scene.sys.canvas.width / 2,
            this.scene.sys.canvas.height / 2 + 144,
            200
        )

        Phaser.Actions.PlaceOnCircle(this.gameObj, circle)

        if (this.restartTween) this.restartTween.destroy()

        this.restartTween = this.scene.tweens.add({
            targets: circle,
            radius: 200,
            ease: 'Quintic.easeInOut',
            duration: 1000,
            yoyo: true,
            repeat: 0,
            onUpdate: () => {
                Phaser.Actions.RotateAroundDistance(
                    this.gameObj,
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
                                    onComplete: () => {
                                        this.gameScene?.checkMatches()
                                    },
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

    public selectedTileTweenPlay(tile: Tile, number: number) {
        if (number == 1) {
            this.selectedTileTweenDestroy(1)
            this.firstSelectedTileTween = this.scene.add.tween({
                targets: tile,
                scale: 1.2,
                yoyo: true,
                duration: 300,
                repeat: -1,
            })
        } else if (number == 2) {
            this.selectedTileTweenDestroy(2)
            this.secondSelectedTileTween = this.scene.add.tween({
                targets: tile,
                scale: 1.2,
                yoyo: true,
                duration: 300,
                repeat: -1,
            })
        }
    }

    public selectedTileTweenDestroy(number: number) {
        if (number == 1 && this.firstSelectedTileTween) {
            if (this.firstSelectedTileTween.targets) {
                const tile = this.firstSelectedTileTween.targets[0] as Tile
                tile.setScale(1)
            }
            this.firstSelectedTileTween.destroy()
        } else if (number == 2 && this.secondSelectedTileTween) {
            if (this.secondSelectedTileTween.targets) {
                const tile = this.secondSelectedTileTween.targets[0] as Tile
                tile.setScale(1)
            }
            this.secondSelectedTileTween.destroy()
        }
    }

    public resetTileTween(tile: Tile, y: number) {
        this.scene.add.tween({
            targets: tile,
            y: CONST.tileHeight * y + CONST.tileHeight / 2 + CONST.alignY,
            ease: 'bounce',
            duration: 300, //200 //700
            repeat: 0,
            yoyo: false,
            // onUpdate: () => {
            //     tile.updateTotalOverlayDisplay()
            // },
        })
    }

    public fillTileTween(tile: Tile, y: number) {
        this.scene.add.tween({
            targets: tile,
            y: CONST.tileHeight * y + CONST.tileHeight / 2 + CONST.alignY,
            duration: 300, //200 //700
            repeat: 0,
            yoyo: false,
            ease: 'bounce',
            onComplete: () => {
                // this.gameScene?.setIdle(true)
                this.gameScene?.checkMatches()
            },
            // onUpdate: () => {
            //     tile.updateTotalOverlayDisplay()
            // },
        })
    }

    public swapTileTween(firstSelectedTile: Tile, secondSelectedTile: Tile) {
        this.scene.add.tween({
            targets: firstSelectedTile,
            x: secondSelectedTile.x,
            y: secondSelectedTile.y,
            rotation: Math.PI * 2,
            ease: 'Quintic.easeInOut',
            duration: 300,
            repeat: 0,
            yoyo: false,
            // onUpdate: () => {
            //     firstSelectedTile.updateTotalOverlayDisplay()
            // },
        })

        this.scene.add.tween({
            targets: secondSelectedTile,
            x: firstSelectedTile.x,
            y: firstSelectedTile.y,
            rotation: Math.PI * 2,
            ease: 'Quintic.easeInOut',
            duration: 300,
            repeat: 0,
            yoyo: false,
            onComplete: () => {
                // this.gameScene?.setIdle(true)
                this.gameScene?.checkMatches()
            },
            // onUpdate: () => {
            //     secondSelectedTile.updateTotalOverlayDisplay()
            // },
        })
    }

    overlapTileTweenPlay(tiles: Tile[], x: number, y: number) {
        this.scene.add.tween({
            targets: tiles,
            x: x,
            y: y,
            duration: 300,
            onComplete: () => {
                for (const tile of tiles) {
                    tile.destroy()
                }
            },
        })
    }

    playHintTween(tile1: Tile, tile2: Tile) {
        const x1 = tile1.x
        const y1 = tile1.y
        const x2 = tile2.x
        const y2 = tile2.y

        this.gameScene?.setIdle(false)

        this.scene.add.tween({
            targets: tile1,
            x: x2,
            y: y2,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.gameScene?.setIdle(true),
        })

        this.scene.add.tween({
            targets: tile2,
            x: x1,
            y: y1,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.gameScene?.setIdle(true),
        })
    }

    playLevelUpEffect(level: number, score: number) {
        this.levelupPopup.resetPosition()
        this.levelupPopup.setContent(level, score)
        this.scene.add.tween({
            targets: this.levelupPopup,
            duration: 500,
            ease: 'back',
            x: { from: -100, to: this.scene.sys.canvas.width / 2 },
        })

        this.scene.add.tween({
            targets: this.levelupPopup,
            delay: 1500,
            alpha: 0,
            duration: 500,
            ease: 'back',
            y: -200,
        })
    }
}
