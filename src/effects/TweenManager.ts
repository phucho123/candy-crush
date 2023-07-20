import { CONST } from '../const/const'
import { Tile } from '../objects/Tile'
import { GameScene } from '../scenes/GameScene'
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
    private ellipse: Phaser.Geom.Ellipse
    private rect: Phaser.Geom.Rectangle

    private i = 0

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.gameScene = GameScene.getIntance()
        this.gameObj = [] as Tile[]
        this.levelupPopup = LevelupPopup.getInstance(this.scene)

        this.rect = new Phaser.Geom.Rectangle(
            this.scene.sys.canvas.width / 2 - 150,
            this.scene.sys.canvas.height / 2 + 100 - 150,
            300,
            300
        )

        this.ellipse = new Phaser.Geom.Ellipse(
            this.scene.sys.canvas.width / 2,
            this.scene.sys.canvas.height / 2 + 100,
            400,
            400
        )
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

        let shape

        const type = Phaser.Math.Between(0, 1)
        if (type == 0) {
            shape = this.rect
            Phaser.Actions.PlaceOnRectangle(this.gameObj, this.rect)
        } else {
            shape = this.ellipse
            Phaser.Actions.PlaceOnEllipse(this.gameObj, this.ellipse)
            const rand = Phaser.Math.Between(0, 1)
            if (rand == 0) this.ellipse.setSize(400, 300)
            else this.ellipse.setSize(400, 400)
        }

        if (this.restartTween) this.restartTween.destroy()

        this.restartTween = this.scene.tweens.add({
            targets: shape,
            x: shape.x,
            y: shape.y,
            ease: 'Quintic.easeInOut',
            duration: 1000,
            yoyo: true,
            repeat: 0,
            onUpdate: () => {
                if (type == 0) Phaser.Actions.PlaceOnRectangle(this.gameObj, this.rect, this.i)
                else Phaser.Actions.PlaceOnEllipse(this.gameObj, this.ellipse, this.i)

                this.i++
                if (this.i === this.gameObj.length) {
                    this.i = 0
                }
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
                                    ease: 'bounce.out',
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
                                    ease: 'bounce.out',
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
            duration: 300,
            repeat: 0,
            yoyo: false,
        })
    }

    public fillTileTween(tile: Tile, y: number) {
        this.scene.add.tween({
            targets: tile,
            y: CONST.tileHeight * y + CONST.tileHeight / 2 + CONST.alignY,
            duration: 300,
            repeat: 0,
            yoyo: false,
            ease: 'bounce',
            onComplete: () => {
                this.gameScene?.checkMatches()
            },
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
                this.gameScene?.checkMatches()
            },
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

    playLevelUpEffect(level: number) {
        this.levelupPopup.resetPosition()
        this.levelupPopup.setContent(level)
        this.scene.add.tween({
            targets: this.levelupPopup,
            duration: 500,
            ease: 'back',
            y: this.scene.sys.canvas.height / 2,
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

    playBoardIdleEffect(tiles: Tile[][]) {
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                if (tiles[y][x])
                    this.scene.tweens.add({
                        targets: tiles[y][x],
                        scale: 0.8,
                        alpha: 0.1,
                        ease: 'sine.inout',
                        duration: 300,
                        delay: x * 50,
                        repeat: 0,
                        yoyo: true,
                    })
            }
        }
    }
}
