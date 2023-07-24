import { CONST } from '../const/const'
import { Tile } from '../objects/Tile'
import { GameScene } from '../scenes/GameScene'
import { LevelupPopup } from './LevelupPopup'

export class TweenManager {
    public static instance: TweenManager | null = null
    private scene: Phaser.Scene
    private gameScene: GameScene | null
    private restartTween: Phaser.Tweens.Tween
    private firstSelectedTileTween: Phaser.Tweens.Tween
    private secondSelectedTileTween: Phaser.Tweens.Tween
    private gameObj: Tile[]
    private levelupPopup: LevelupPopup
    private ellipse: Phaser.Geom.Ellipse
    private rect: Phaser.Geom.Rectangle
    private triangle: Phaser.Geom.Triangle
    private lines: Phaser.Geom.Line[]
    private i = 1
    private timeArround = 5
    private grids: Phaser.GameObjects.Rectangle[][]

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

        this.triangle = new Phaser.Geom.Triangle(260, 200, 50, 500, 470, 500)
        this.lines = []

        this.lines.push(new Phaser.Geom.Line(260, 180, 200, 350))
        this.lines.push(new Phaser.Geom.Line(200, 350, 50, 350))
        this.lines.push(new Phaser.Geom.Line(50, 350, 200, 450))
        this.lines.push(new Phaser.Geom.Line(200, 450, 150, 650))
        this.lines.push(new Phaser.Geom.Line(150, 650, 280, 480))
        this.lines.push(new Phaser.Geom.Line(280, 480, 400, 650))
        this.lines.push(new Phaser.Geom.Line(400, 650, 350, 450))
        this.lines.push(new Phaser.Geom.Line(350, 450, 470, 350))
        this.lines.push(new Phaser.Geom.Line(470, 350, 320, 350))
        this.lines.push(new Phaser.Geom.Line(260, 180, 320, 350))

        this.grids = []

        for (let y = 0; y < CONST.gridHeight; y++) {
            this.grids[y] = []
            for (let x = 0; x < CONST.gridWidth; x++) {
                this.grids[y].push(
                    this.scene.add
                        .rectangle(
                            x * CONST.tileWidth + CONST.tileWidth / 2,
                            y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY,
                            CONST.tileWidth - 5,
                            CONST.tileHeight - 5,
                            0xffffff
                        )
                        .setDepth(-10)
                        .setAlpha(0)
                )
            }
        }
    }

    static getInstance(scene: Phaser.Scene): TweenManager {
        if (!TweenManager.instance) TweenManager.instance = new TweenManager(scene)
        return TweenManager.instance
    }

    public restartTweenPlay(tileGrid: Tile[][]): void {
        const size = this.gameObj.length
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                if (!size) this.gameObj.push(tileGrid[y][x])
                else this.gameObj[y * CONST.gridWidth + x] = tileGrid[y][x]
            }
        }

        let shape

        const type = Phaser.Math.Between(0, 3)

        if (type == 0) {
            shape = this.rect
            Phaser.Actions.PlaceOnRectangle(this.gameObj, this.rect)
        } else if (type == 1) {
            shape = this.ellipse
            Phaser.Actions.PlaceOnEllipse(this.gameObj, this.ellipse)
            this.scene.tweens.add({
                targets: shape,
                width: 500,
                height: 200,
                duration: 1000,
                ease: 'Sine.easeInOut',
                repeat: 1,
                yoyo: true,
            })

            this.scene.tweens.add({
                targets: shape,
                width: 200,
                height: 500,
                delay: 1000,
                duration: 1000,
                ease: 'Sine.easeInOut',
                repeat: 1,
                yoyo: true,
            })
        } else if (type == 2) {
            shape = this.triangle
        } else {
            shape = this.rect
        }

        // if (this.restartTween) this.restartTween.destroy()

        this.restartTween = this.scene.tweens.add({
            targets: shape,
            radius: 0,
            ease: 'Quintic.easeInOut',
            duration: 1000,
            yoyo: true,
            repeat: 0,
            onUpdate: () => {
                this.timeArround--
                this.i++
                if (this.i === this.gameObj.length) {
                    this.i = 0
                }
                if (this.timeArround <= 0) {
                    if (type == 0) {
                        Phaser.Actions.PlaceOnRectangle(this.gameObj, this.rect, this.i)
                        this.timeArround = 3
                    } else if (type == 1) {
                        Phaser.Actions.PlaceOnEllipse(this.gameObj, this.ellipse, this.i)
                        this.timeArround = 3
                    } else if (type == 2) {
                        const tmp = this.gameObj.shift()
                        if (tmp) this.gameObj.push(tmp)
                        Phaser.Actions.PlaceOnTriangle(this.gameObj, this.triangle)
                        this.timeArround = 3
                    } else {
                        const tmp = this.gameObj.shift()
                        if (tmp) this.gameObj.push(tmp)
                        let tmp_1 = 0
                        for (let i = 0; i < 10; i++) {
                            if (i == 9) {
                                Phaser.Actions.PlaceOnLine(
                                    this.gameObj.slice(tmp_1, 64),
                                    this.lines[i]
                                )
                            } else
                                Phaser.Actions.PlaceOnLine(
                                    this.gameObj.slice(tmp_1, tmp_1 + 6),
                                    this.lines[i]
                                )
                            tmp_1 += 6
                        }
                        this.timeArround = 3
                    }
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

    public selectedTileTweenPlay(tile: Tile, number: number): void {
        if (number == 1) {
            this.selectedTileTweenDestroy(1)
            tile.angle = -30
            this.firstSelectedTileTween = this.scene.add.tween({
                targets: tile,
                angle: 30,
                yoyo: true,
                duration: 300,
                repeat: -1,
            })
        } else if (number == 2) {
            this.selectedTileTweenDestroy(2)
            tile.angle = -30
            this.secondSelectedTileTween = this.scene.add.tween({
                targets: tile,
                angle: 30,
                yoyo: true,
                duration: 300,
                repeat: -1,
            })
        }
    }

    public selectedTileTweenDestroy(number: number): void {
        if (number == 1 && this.firstSelectedTileTween) {
            if (this.firstSelectedTileTween.targets) {
                const tile = this.firstSelectedTileTween.targets[0] as Tile
                tile.angle = 0
            }
            this.firstSelectedTileTween.destroy()
        } else if (number == 2 && this.secondSelectedTileTween) {
            if (this.secondSelectedTileTween.targets) {
                const tile = this.secondSelectedTileTween.targets[0] as Tile
                tile.angle = 0
            }
            this.secondSelectedTileTween.destroy()
        }
    }

    public resetTileTween(tile: Tile, y: number): void {
        this.scene.add.tween({
            targets: tile,
            y: CONST.tileHeight * y + CONST.tileHeight / 2 + CONST.alignY,
            ease: 'bounce',
            duration: 300,
            repeat: 0,
            yoyo: false,
        })
    }

    public fillTileTween(tile: Tile, y: number): void {
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

    public swapTileTween(firstSelectedTile: Tile, secondSelectedTile: Tile): void {
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

    public overlapTileTweenPlay(tiles: Tile[], x: number, y: number): void {
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

    public playHintTween(tile1: Tile, tile2: Tile): void {
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

    public playLevelUpEffect(level: number): void {
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

    public playBoardIdleEffect(): void {
        this.gameScene?.setIdle(false)
        for (let y = 0; y < CONST.gridHeight; y++) {
            for (let x = 0; x < CONST.gridWidth; x++) {
                if (this.grids[y][x])
                    this.scene.tweens.add({
                        targets: this.grids[y][x],
                        alpha: 1,
                        ease: 'sine.inout',
                        duration: 400,
                        delay: Math.abs(x + y) * 50,
                        repeat: 0,
                        yoyo: true,
                        onComplete: () => this.gameScene?.setIdle(true),
                    })
            }
        }
    }
}
