import { CONST } from '../const/const'
import { Position } from '../interfaces/myinterface.interface'
import { ObjectPool } from '../objects/ObjectPool'
import { Tile } from '../objects/tile'
import { EmitterManager } from '../effects/EmitterManager'
import { TweenManager } from '../effects/TweenManager'
import { Progressbar } from '../ui/Progressbar'
import { CustomEmitter } from '../effects/CustomEmitter'

export class GameScene extends Phaser.Scene {
    static instance: GameScene | null = null
    // Variables
    private canMove: boolean

    // Grid with tiles
    private tileGrid: Tile[][] | undefined

    // Selected Tiles
    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    private progressBar: Progressbar
    private score = 0
    private prevScore = 0
    private tweenManager: TweenManager
    private idleTimeout: Phaser.Time.Timeline
    private idle: boolean
    private hintButton: Phaser.GameObjects.Text
    private shuffleButton: Phaser.GameObjects.Text
    private emitterManager: EmitterManager
    private findMove: boolean
    private objectPool: ObjectPool
    private delta: number
    private customEmitter: CustomEmitter
    private matchesTimeout: Phaser.Time.Timeline

    constructor() {
        super({
            key: 'GameScene',
        })
        GameScene.instance = this
        this.delta = CONST.delta
    }

    static getIntance() {
        return GameScene.instance
    }

    init(): void {
        this.emitterManager = EmitterManager.getInstance(this)
        this.customEmitter = CustomEmitter.getInstance(this)
        // this.emitterManager.playConffetiEffect(0, this.sys.canvas.height / 2)

        this.progressBar = new Progressbar(this)
        this.tweenManager = TweenManager.getInstance(this)

        this.objectPool = ObjectPool.getInstance(this)
        this.idle = false
        // Init variables
        this.canMove = true
        this.findMove = false

        // set background color
        this.cameras.main.setBackgroundColor(0x78aade)

        // Init grid with tiles
        this.tileGrid = []

        for (let y = 0; y < CONST.gridHeight; y++) {
            this.tileGrid[y] = []
            for (let x = 0; x < CONST.gridWidth; x++) {
                const tile = this.addTile(x, y)
                this.tileGrid[y][x] = tile
            }
        }
        this.debug()
        this.restart()
        this.input.on('gameobjectdown', this.tileDown, this)

        // Check if matches on the start
        // this.checkMatches()

        this.tweenManager.playLevelUpEffect()
    }

    debug() {
        this.shuffleButton = this.add
            .text(this.sys.canvas.width - 10, 50, 'Shuffle', {
                color: '#ffffff',
                fontSize: '32px',
                fontFamily: 'Arial',
            })
            .setInteractive()
            .setOrigin(1, 0)
            .setAlpha(0.5)
            .on('pointerdown', () => {
                if (this.idle) this.restart()
            })
        this.hintButton = this.add
            .text(this.sys.canvas.width - 10, 90, 'Hint', {
                color: '#ffffff',
                fontSize: '32px',
                fontFamily: 'Arial',
            })
            .setInteractive()
            .setOrigin(1, 0)
            .setAlpha(0.5)
            .on('pointerdown', () => {
                if (this.idle) this.hintMove()
            })
    }

    shuffle() {
        if (!this.tileGrid) return
        for (let y = 0; y < this.tileGrid.length; y++) {
            const gameObj = this.tileGrid[y]
            for (let x = gameObj.length - 1; x > 0; x--) {
                const j = Math.floor(Math.random() * (x + 1))
                ;[gameObj[x], gameObj[j]] = [gameObj[j], gameObj[x]]
                this.emitterManager.setColorEmitter(j, y, gameObj[j].getColor())
                this.emitterManager.setColorEmitter(x, y, gameObj[x].getColor())
            }
        }
    }

    restart() {
        if (!this.tileGrid) return
        this.canMove = false
        this.idle = false
        this.shuffle()

        // this.emitterManager.stopHintEffect()
        this.tweenManager.restartTweenPlay(this.tileGrid)

        // Selected Tiles
        this.tweenManager.selectedTileTweenDestroy(1)
        this.tweenManager.selectedTileTweenDestroy(2)
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined

        this.findMove = false
    }

    /**
     * Add a new random tile at the specified position.
     * @param x
     * @param y
     */
    private addTile(x: number, y: number): Tile {
        // // Get a random tile
        // const randomTileType: string =
        //     CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 9)]
        // // CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        // // Return the created tile
        // return new Tile({
        //     scene: this,
        //     x: x * CONST.tileWidth + CONST.tileWidth / 2,
        //     y: y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY,
        //     texture: randomTileType,
        // })

        return this.objectPool.addTile(x, y)
    }

    /**
     * This function gets called, as soon as a tile has been pressed or clicked.
     * It will check, if a move can be done at first.
     * Then it will check if a tile was already selected before or not (if -> else)
     * @param pointer
     * @param gameobject
     * @param event
     */
    private tileDown(
        _pointer: Phaser.Input.Pointer,
        gameobject: Tile | undefined,
        _event: any
    ): void {
        if (gameobject?.type != 'Image') return
        if (this.canMove) {
            if (!this.firstSelectedTile) {
                this.firstSelectedTile = gameobject
                this.tweenManager.selectedTileTweenPlay(this.firstSelectedTile, 1)
            } else {
                // So if we are here, we must have selected a second tile
                if (this.firstSelectedTile == gameobject || this.secondSelectedTile == gameobject)
                    return
                this.secondSelectedTile = gameobject
                this.tweenManager.selectedTileTweenPlay(this.secondSelectedTile, 2)
                if (this.secondSelectedTile) {
                    const dx =
                        Math.abs(this.firstSelectedTile.x - this.secondSelectedTile.x) /
                        CONST.tileWidth
                    const dy =
                        Math.abs(this.firstSelectedTile.y - this.secondSelectedTile.y) /
                        CONST.tileHeight

                    // Check if the selected tiles are both in range to make a move
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        this.canMove = false
                        this.swapTiles()
                    } else {
                        this.tweenManager.selectedTileTweenDestroy(2)
                        this.tweenManager.selectedTileTweenDestroy(1)
                        this.firstSelectedTile = gameobject
                        this.tweenManager.selectedTileTweenPlay(this.firstSelectedTile, 1)
                        this.secondSelectedTile = undefined
                    }
                }
            }
        }
    }

    /**
     * This function will take care of the swapping of the two selected tiles.
     * It will only work, if two tiles have been selected.
     */
    private swapTiles(): void {
        if (!this.tileGrid) return
        if (this.firstSelectedTile && this.secondSelectedTile) {
            // Get the position of the two tiles
            const firstTilePosition = {
                x: this.firstSelectedTile.x,
                y: this.firstSelectedTile.y,
            }

            const secondTilePosition = {
                x: this.secondSelectedTile.x,
                y: this.secondSelectedTile.y,
            }

            // Swap them in our grid with the tiles
            if (this.tileGrid) {
                const x1 = Math.floor((firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth)
                const y1 = Math.floor(
                    (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                )
                const x2 = Math.floor(
                    (secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth
                )
                const y2 = Math.floor(
                    (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                )

                // this.tileGrid[
                //     (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                // ][(firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth] =
                //     this.secondSelectedTile
                // this.tileGrid[
                //     (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                // ][(secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth] =
                //     this.firstSelectedTile

                this.tileGrid[y1][x1] = this.secondSelectedTile
                this.tileGrid[y2][x2] = this.firstSelectedTile

                this.emitterManager.setColorEmitter(x1, y1, this.secondSelectedTile.getColor())
                this.emitterManager.setColorEmitter(x2, y2, this.firstSelectedTile.getColor())
            }

            this.tweenManager.swapTileTween(this.firstSelectedTile, this.secondSelectedTile)

            if (this.tileGrid) {
                const x1 = Math.floor((firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth)
                const y1 = Math.floor(
                    (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                )
                const x2 = Math.floor(
                    (secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth
                )
                const y2 = Math.floor(
                    (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                )

                // this.firstSelectedTile =
                //     this.tileGrid[
                //         (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) /
                //             CONST.tileHeight
                //     ][(firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth]
                // this.secondSelectedTile =
                //     this.tileGrid[
                //         (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) /
                //             CONST.tileHeight
                //     ][(secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth]

                this.firstSelectedTile = this.tileGrid[y1][x1]
                this.secondSelectedTile = this.tileGrid[y2][x2]
            }
        }
    }

    public checkMatches(): void {
        //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row
        if (!this.tileGrid) return

        this.setIdle(false)

        if (this.idleTimeout) {
            // this.hintButton.setAlpha(0.5)
            this.idleTimeout.reset()
        } else
            this.idleTimeout = this.add.timeline({
                at: 1100,
                run: () => {
                    console.log('hello there')
                    this.setIdle(true)
                },
            })

        const matches = this.getMatches(this.tileGrid)

        //If there are matches, remove them
        if (matches.length > 0) {
            // this.setIdle(false)
            // this.setIdle(false)
            //Remove the tiles
            this.removeTileGroup(matches)
            // Move the tiles currently on the board into their new positions
            // setTimeout(() => {
            //     this.resetTile()
            //     //Fill the board with new tiles wherever there is an empty spot
            //     this.fillTile()
            //     this.tileUp()
            //     // this.checkMatches()
            // }, 500)

            if (this.matchesTimeout) this.matchesTimeout.reset()
            else
                this.matchesTimeout = this.add
                    .timeline([
                        {
                            at: 500,
                            run: () => {
                                this.resetTile()
                                this.fillTile()
                                this.tileUp()
                            },
                        },
                    ])
                    .play()
        } else {
            // No match so just swap the tiles back to their original position and reset
            this.swapTiles()
            this.tileUp()
            // this.canMove = true
            // if (this.checkTileGridFull()) {
            // }
        }
    }

    public resetTile(): void {
        if (!this.tileGrid) return
        // Loop through each column starting from the left
        for (let y = this.tileGrid.length - 1; y > 0; y--) {
            // Loop through each tile in column from bottom to top
            for (let x = this.tileGrid[y].length - 1; x >= 0; x--) {
                // If this space is blank, but the one above it is not, move the one above down
                if (this.tileGrid[y][x] === undefined) {
                    // Move the tile above down one
                    let y_tmp = y
                    while (y_tmp - 1 > 0 && this.tileGrid[y_tmp - 1][x] === undefined) {
                        y_tmp--
                    }
                    const tempTile = this.tileGrid[y_tmp - 1][x]
                    this.tileGrid[y][x] = tempTile
                    this.emitterManager.setColorEmitter(x, y, tempTile?.getColor())
                    ;(this.tileGrid[y_tmp - 1][x] as Tile | undefined) = undefined

                    this.tweenManager.resetTileTween(tempTile, y)

                    //The positions have changed so start this process again from the bottom
                    //NOTE: This is not set to me.tileGrid[i].length - 1 because it will immediately be decremented as
                    //we are at the end of the loop.
                    // x = this.tileGrid[y].length
                }
            }
        }
    }

    public fillTile(): void {
        if (!this.tileGrid) return
        //Check for blank spaces in the grid and add new tiles at that position
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                // if (this.tileGrid[y][x] === undefined) {
                //     //Found a blank spot so lets add animate a tile there
                //     const tile = this.addTile(x, y)
                //     //And also update our "theoretical" grid
                //     this.tileGrid[y][x] = tile
                // }
                let cnt = 0
                while (this.tileGrid[y][x] === undefined) {
                    const tile = this.addTile(x, y)
                    let y_tmp = y
                    while (
                        y_tmp + 1 < this.tileGrid.length &&
                        this.tileGrid[y_tmp + 1][x] === undefined
                    ) {
                        y_tmp += 1
                    }
                    if (y == 0) tile.setY(-CONST.tileHeight * (cnt - 0.5))
                    this.tweenManager.fillTileTween(tile, y_tmp)
                    this.tileGrid[y_tmp][x] = tile
                    this.emitterManager.setColorEmitter(x, y_tmp, tile?.getColor())
                    cnt++
                }
            }
        }
    }

    public tileUp(): void {
        this.tweenManager.selectedTileTweenDestroy(1)
        this.tweenManager.selectedTileTweenDestroy(2)

        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined
    }

    private removeTileGroup(matches: Tile[][]): void {
        if (!this.tileGrid) return
        // Loop through all the matches and remove the associated tiles
        const prevScore = this.score
        // matches.sort((a, b) => b.length - a.length)
        for (let i = 0; i < matches.length; i++) {
            const tempArr = matches[i]

            this.score += this.getTotalOverlap(tempArr) * 100

            for (let j = 0; j < tempArr.length; j++) {
                const tile = tempArr[j]

                //Find where this tile lives in the theoretical grid
                const tilePos = this.getTilePos(this.tileGrid, tile)

                // Remove the tile from the theoretical grid
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    // this.emitterManager.stopHintEffect()
                    this.findMove = false
                    if (
                        tempArr.length >= 4 &&
                        (this.firstSelectedTile || this.secondSelectedTile)
                    ) {
                        if (tile == this.firstSelectedTile || tile == this.secondSelectedTile) {
                            this.tweenManager.overlapTileTweenPlay(
                                tempArr.filter((tmp_tile) => tmp_tile != tile),
                                tile.x,
                                tile.y
                            )
                            tile.addTotalOverlap(
                                this.getTotalOverlap(tempArr.filter((tmp_tile) => tmp_tile != tile))
                            )
                        } else {
                            (this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                        }
                    } else if (tempArr.length >= 4) {
                        if (j == Math.floor(tempArr.length / 2)) {
                            this.tweenManager.overlapTileTweenPlay(
                                tempArr.filter((tmp_tile) => tmp_tile != tile),
                                tile.x,
                                tile.y
                            )
                            tile.addTotalOverlap(
                                this.getTotalOverlap(tempArr.filter((tmp_tile) => tmp_tile != tile))
                            )
                        } else {
                            (this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                        }
                    } else {
                        if (tile.getTotalOverlap() >= 5) {
                            this.removeAllInRow(tilePos.y)
                            this.removeAllInColumn(tilePos.x)
                            this.cameras.main.shake(1000, 0.02)
                            break
                        }
                        tile.destroy()
                        this.emitterManager.explodeBoardEmitter(tilePos.x, tilePos.y)
                        ;(this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                    }
                }
            }
        }
        this.progressBar.updateProgreebar(this.score - this.prevScore)
        this.progressBar.updateScore(prevScore, this.score)
    }

    private getTilePos(tileGrid: Tile[][], tile: Tile): Position {
        const pos = { x: -1, y: -1 }

        //Find the position of a specific tile in the grid
        for (let y = 0; y < tileGrid.length; y++) {
            for (let x = 0; x < tileGrid[y].length; x++) {
                //There is a match at this position so return the grid coords
                if (tile === tileGrid[y][x]) {
                    pos.x = x
                    pos.y = y
                    break
                }
            }
        }

        return pos
    }

    private getMatches(tileGrid: Tile[][]): Tile[][] {
        const matches: Tile[][] = []
        let groups: Tile[] = []

        // Check for horizontal matches
        for (let y = 0; y < tileGrid.length; y++) {
            const tempArray = tileGrid[y]
            groups = []
            for (let x = 0; x < tempArray.length; x++) {
                if (x < tempArray.length - 2) {
                    if (tileGrid[y][x] && tileGrid[y][x + 1] && tileGrid[y][x + 2]) {
                        if (
                            tileGrid[y][x].texture.key === tileGrid[y][x + 1].texture.key &&
                            tileGrid[y][x + 1].texture.key === tileGrid[y][x + 2].texture.key
                        ) {
                            if (groups.length > 0) {
                                if (groups.indexOf(tileGrid[y][x]) == -1) {
                                    matches.push(groups)
                                    groups = []
                                }
                            }

                            if (groups.indexOf(tileGrid[y][x]) == -1) {
                                groups.push(tileGrid[y][x])
                            }

                            if (groups.indexOf(tileGrid[y][x + 1]) == -1) {
                                groups.push(tileGrid[y][x + 1])
                            }

                            if (groups.indexOf(tileGrid[y][x + 2]) == -1) {
                                groups.push(tileGrid[y][x + 2])
                            }
                        }
                    }
                }
            }

            if (groups.length > 0) {
                matches.push(groups)
            }
        }

        //Check for vertical matches
        for (let j = 0; j < tileGrid.length; j++) {
            const tempArr = tileGrid[j]
            groups = []
            for (let i = 0; i < tempArr.length; i++) {
                if (i < tempArr.length - 2)
                    if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
                        if (
                            tileGrid[i][j].texture.key === tileGrid[i + 1][j].texture.key &&
                            tileGrid[i + 1][j].texture.key === tileGrid[i + 2][j].texture.key
                        ) {
                            if (groups.length > 0) {
                                if (groups.indexOf(tileGrid[i][j]) == -1) {
                                    matches.push(groups)
                                    groups = []
                                }
                            }

                            if (groups.indexOf(tileGrid[i][j]) == -1) {
                                groups.push(tileGrid[i][j])
                            }
                            if (groups.indexOf(tileGrid[i + 1][j]) == -1) {
                                groups.push(tileGrid[i + 1][j])
                            }
                            if (groups.indexOf(tileGrid[i + 2][j]) == -1) {
                                groups.push(tileGrid[i + 2][j])
                            }
                        }
                    }
            }
            if (groups.length > 0) matches.push(groups)
        }

        return matches
    }

    hintMove() {
        this.findMove = false
        if (!this.tileGrid || this.findMove) return
        // let find = false
        for (let y = 0; y < this.tileGrid.length; y++) {
            if (this.findMove) break
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.findMove) break
                if (!this.findMove && y < this.tileGrid.length - 1) {
                    this.swapTileVertical(y, y + 1, x)
                    if (this.getMatches(this.tileGrid).length) {
                        this.findMove = true
                    }
                    this.swapTileVertical(y, y + 1, x)
                    if (this.findMove) {
                        console.log(`(x: ${x},y: ${y}), 1`)
                        // this.emitterManager.playHintEffect(x, y)
                        // this.emitterManager.playHintEffect(x, y + 1)
                        this.tweenManager.playHintTween(
                            this.tileGrid[y][x],
                            this.tileGrid[y + 1][x]
                        )
                    }
                }
                if (!this.findMove && x < this.tileGrid[0].length - 1) {
                    this.swapTileHorizontal(x, x + 1, y)
                    if (this.getMatches(this.tileGrid).length) {
                        this.findMove = true
                    }
                    this.swapTileHorizontal(x, x + 1, y)
                    if (this.findMove) {
                        console.log(`(x: ${x},y: ${y}), 2`)
                        // this.emitterManager.playHintEffect(x, y)
                        // this.emitterManager.playHintEffect(x + 1, y)
                        this.tweenManager.playHintTween(
                            this.tileGrid[y][x],
                            this.tileGrid[y][x + 1]
                        )
                    }
                }
            }
        }

        if (!this.findMove) console.log('No move')
    }

    swapTileVertical(y1: number, y2: number, x: number) {
        if (!this.tileGrid) return
        const tmp_tile = this.tileGrid[y1][x]
        this.tileGrid[y1][x] = this.tileGrid[y2][x]
        this.tileGrid[y2][x] = tmp_tile
    }

    swapTileHorizontal(x1: number, x2: number, y: number) {
        if (!this.tileGrid) return
        const tmp_tile = this.tileGrid[y][x1]
        this.tileGrid[y][x1] = this.tileGrid[y][x2]
        this.tileGrid[y][x2] = tmp_tile
    }

    checkTileGridFull() {
        if (!this.tileGrid) return
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] === undefined) return false
            }
        }
        return true
    }

    update(_time: number, _delta: number): void {
        this.delta = _delta
        // this.emitterManager.update()
        if (this.idle) {
            if (this.score - this.prevScore >= this.progressBar.getMaxScore()) {
                this.restart()
                this.progressBar.updateProgreebar(0)
                this.progressBar.updateScore(this.score, 0)
                // this.score = 0
                this.progressBar.levelUp()
                this.customEmitter.playConfettiEffect()
                this.prevScore = this.score
            }
            this.hintButton.setAlpha(1)
            this.shuffleButton.setAlpha(1)
            this.canMove = true
        } else {
            this.hintButton.setAlpha(0.5)
            this.shuffleButton.setAlpha(0.5)
            this.canMove = false
        }

        // if (this.score >= 3000) this.canMove = false
    }

    setCanMove(canMove: boolean) {
        this.canMove = canMove
    }

    setIdle(idle: boolean) {
        this.idle = idle
    }

    getTotalOverlap(tiles: Tile[]) {
        let res = 0
        for (const tile of tiles) res += tile.getTotalOverlap() + 1
        return res
    }

    removeAllInRow(y: number) {
        if (!this.tileGrid) return
        for (let x = 0; x < this.tileGrid[y].length; x++) {
            if (this.tileGrid[y][x]) {
                this.tileGrid[y][x].destroy()
                this.emitterManager.explodeBoardEmitter(x, y)
                ;(this.tileGrid[y][x] as Tile | undefined) = undefined
            }
        }
    }

    removeAllInColumn(x: number) {
        if (!this.tileGrid) return
        for (let y = 0; y < this.tileGrid.length; y++) {
            if (this.tileGrid[y][x]) {
                this.tileGrid[y][x].destroy()
                this.emitterManager.explodeBoardEmitter(x, y)
                ;(this.tileGrid[y][x] as Tile | undefined) = undefined
            }
        }
    }
}
