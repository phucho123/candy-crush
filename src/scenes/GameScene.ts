import { CONST } from '../const/const'
import { Position } from '../interfaces/myinterface.interface'
import { ObjectPool } from '../objects/ObjectPool'
import { Tile } from '../objects/Tile'
import { EmitterManager } from '../effects/EmitterManager'
import { TweenManager } from '../effects/TweenManager'
import { ProgressUI } from '../ui/ProgressUI'

export class GameScene extends Phaser.Scene {
    static instance: GameScene | null = null
    // Variables
    private canMove: boolean

    // Grid with tiles
    private tileGrid: Tile[][] | undefined

    // Selected Tiles
    private firstSelectedTile: Tile | undefined
    private secondSelectedTile: Tile | undefined

    private progressUI: ProgressUI
    private score = 0
    private prevScore = 0
    private tweenManager: TweenManager
    private idleTimeline: Phaser.Time.Timeline
    private idle: boolean
    private hintButton: Phaser.GameObjects.Text
    private shuffleButton: Phaser.GameObjects.Text
    private emitterManager: EmitterManager
    private findMove: boolean
    private objectPool: ObjectPool
    private delta: number
    private matchesTimeLine: Phaser.Time.Timeline
    private timeToplayIdleEffect: number

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

    private init(): void {
        this.emitterManager = EmitterManager.getInstance(this)

        this.progressUI = new ProgressUI(this)
        this.tweenManager = TweenManager.getInstance(this)

        this.objectPool = ObjectPool.getInstance(this)
        this.idle = false
        this.timeToplayIdleEffect = 0
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

        this.tweenManager.playLevelUpEffect(this.progressUI.getLevel())

        this.idleTimeline = this.add.timeline({
            at: 1000,
            run: () => {
                this.setIdle(true)
            },
        })

        this.matchesTimeLine = this.add.timeline([
            {
                at: 500,
                run: () => {
                    this.resetTile()
                    this.fillTile()
                    this.tileUp()
                },
            },
        ])
        // Check if matches on the start
        // this.checkMatches()
    }

    private debug(): void {
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

    private shuffle(): void {
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

    private restart(): void {
        if (!this.tileGrid) return
        this.setCanMove(false)
        this.setIdle(false)
        this.shuffle()
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

                this.firstSelectedTile = this.tileGrid[y1][x1]
                this.secondSelectedTile = this.tileGrid[y2][x2]
            }
        }
    }

    public checkMatches(): void {
        //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row

        if (!this.tileGrid || this.score - this.prevScore >= this.progressUI.getMaxScore()) return

        this.setIdle(false)

        this.idleTimeline.reset()
        this.idleTimeline.play()

        //If there are matches, remove them
        if (this.firstSelectedTile && this.secondSelectedTile) {
            if (this.firstSelectedTile?.getOverlap() >= 5) {
                const tilePos = this.getTilePos(this.tileGrid, this.firstSelectedTile)
                this.remove5Matches(this.secondSelectedTile)
                this.destroyCell(tilePos.x, tilePos.y)
                return
            } else if (this.secondSelectedTile?.getOverlap() >= 5) {
                const tilePos = this.getTilePos(this.tileGrid, this.secondSelectedTile)
                this.remove5Matches(this.firstSelectedTile)
                this.destroyCell(tilePos.x, tilePos.y)
                return
            }
        }

        const matches = this.getMatches(this.tileGrid)
        if (matches.length > 0) {
            //Remove the tiles
            this.removeTileGroup(matches)
            // Move the tiles currently on the board into their new positions
            this.matchesTimeLine.reset()
            this.matchesTimeLine.play()
        } else {
            // No match so just swap the tiles back to their original position and reset
            this.swapTiles()
            this.tileUp()
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
        // matches.sort((a: Tile[], b: Tile[]) => {
        //     return b.length - a.length
        // })
        for (let i = 0; i < matches.length; i++) {
            const tempArr = matches[i].filter((tile) => tile.active)
            for (let j = 0; j < tempArr.length; j++) {
                const tile = tempArr[j]

                //Find where this tile lives in the theoretical grid
                const tilePos = this.getTilePos(this.tileGrid, tile)

                // Remove the tile from the theoretical grid
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    this.findMove = false
                    if (
                        tempArr.length >= 4 &&
                        (this.firstSelectedTile || this.secondSelectedTile)
                    ) {
                        if (tile == this.firstSelectedTile || tile == this.secondSelectedTile) {
                            tile.setOverlap(tempArr.length)
                            this.tweenManager.overlapTileTweenPlay(
                                tempArr.filter((tmp_tile) => tmp_tile != tile),
                                tile.x,
                                tile.y
                            )
                        } else {
                            (this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                            tile.setActive(false)
                        }
                        this.score += tempArr.length * 100
                    } else if (tempArr.length >= 4) {
                        if (j == 0) {
                            tile.setOverlap(tempArr.length)
                            this.tweenManager.overlapTileTweenPlay(
                                tempArr.filter((tmp_tile) => tmp_tile != tile),
                                tile.x,
                                tile.y
                            )
                        } else {
                            (this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                            tile.setActive(false)
                        }
                        this.score += tempArr.length * 100
                    } else {
                        if (tile.getOverlap() == 4) {
                            this.remove4Matches(tilePos.x, tilePos.y)
                            this.cameras.main.shake(500, 0.02)
                        }
                        if (!tile.isDestroyed()) {
                            this.destroyCell(tilePos.x, tilePos.y)
                            this.score += 100
                        }
                    }
                }
            }
        }
        this.progressUI.updateProgreebar(this.score - this.prevScore)
        this.progressUI.updateScore(prevScore, this.score)
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

    private hintMove(): void {
        this.findMove = false
        if (!this.tileGrid || this.findMove) return
        const pivot = Phaser.Math.Between(1, CONST.gridHeight - 1)
        for (let y = pivot; y >= 0; y--) {
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
                        this.tweenManager.playHintTween(
                            this.tileGrid[y][x],
                            this.tileGrid[y][x + 1]
                        )
                    }
                }
            }
        }

        if (this.findMove) return
        for (let y = pivot + 1; y < this.tileGrid.length; y++) {
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

    private swapTileVertical(y1: number, y2: number, x: number): void {
        if (!this.tileGrid) return
        const tmp_tile = this.tileGrid[y1][x]
        this.tileGrid[y1][x] = this.tileGrid[y2][x]
        this.tileGrid[y2][x] = tmp_tile
    }

    private swapTileHorizontal(x1: number, x2: number, y: number): void {
        if (!this.tileGrid) return
        const tmp_tile = this.tileGrid[y][x1]
        this.tileGrid[y][x1] = this.tileGrid[y][x2]
        this.tileGrid[y][x2] = tmp_tile
    }

    public update(_time: number, _delta: number): void {
        this.delta = _delta
        if (this.idle) {
            this.timeToplayIdleEffect++
            if (this.score - this.prevScore >= this.progressUI.getMaxScore()) {
                this.restart()
                this.progressUI.updateProgreebar(0)
                this.progressUI.levelUp()
                this.tweenManager.playLevelUpEffect(this.progressUI.getLevel())
                this.emitterManager.playConfettiEffect()
                this.prevScore = this.score
            }
            if (this.timeToplayIdleEffect >= 1000) {
                this.timeToplayIdleEffect = 0
                this.tweenManager.playBoardIdleEffect(<Tile[][]> this.tileGrid)
            }
            this.hintButton.setAlpha(1)
            this.shuffleButton.setAlpha(1)
            this.canMove = true
        } else {
            this.timeToplayIdleEffect = 0
            this.hintButton.setAlpha(0.5)
            this.shuffleButton.setAlpha(0.5)
            this.canMove = false
        }
    }

    public setCanMove(canMove: boolean): void {
        this.canMove = canMove
    }

    public setIdle(idle: boolean): void {
        this.idle = idle
    }

    private removeAllInRow(y: number): void {
        if (!this.tileGrid) return
        for (let x = 0; x < this.tileGrid[y].length; x++) {
            if (this.tileGrid[y][x]) {
                this.destroyCell(x, y)
                this.score += 100
            }
        }
    }

    private removeAllInColumn(x: number): void {
        if (!this.tileGrid) return
        for (let y = 0; y < this.tileGrid.length; y++) {
            if (this.tileGrid[y][x]) {
                this.destroyCell(x, y)
                this.score += 100
            }
        }
    }

    private remove4Matches(x: number, y: number): void {
        if (!this.tileGrid) return
        if (x > 0 && this.tileGrid[y][x - 1]) {
            if (this.tileGrid[y][x - 1].getOverlap() >= 5) {
                this.removeAllInColumn(x - 1)
                this.removeAllInRow(y)
            } else {
                this.destroyCell(x - 1, y)
                this.score += 100
            }
        }

        if (x < CONST.gridWidth - 1 && this.tileGrid[y][x + 1]) {
            if (this.tileGrid[y][x + 1].getOverlap() >= 5) {
                this.removeAllInColumn(x + 1)
                this.removeAllInRow(y)
            } else {
                this.destroyCell(x + 1, y)
                this.score += 100
            }
        }

        if (y > 0 && this.tileGrid[y - 1][x]) {
            if (this.tileGrid[y - 1][x].getOverlap() >= 5) {
                this.removeAllInColumn(x)
                this.removeAllInRow(y - 1)
            } else {
                this.destroyCell(x, y - 1)
                this.score += 100
            }
        }
        if (y < CONST.gridHeight - 1 && this.tileGrid[y + 1][x]) {
            if (this.tileGrid[y + 1][x].getOverlap() >= 5) {
                this.removeAllInColumn(x)
                this.removeAllInRow(y + 1)
            } else {
                this.destroyCell(x, y + 1)
                this.score += 100
            }
        }
    }

    private remove5Matches(tile: Tile): void {
        if (!this.tileGrid) return
        const prevScore = this.score
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] && this.tileGrid[y][x].texture.key == tile.texture.key) {
                    this.destroyCell(x, y)
                    this.score += 100
                }
            }
        }

        this.progressUI.updateProgreebar(this.score - this.prevScore)
        this.progressUI.updateScore(prevScore, this.score)

        this.matchesTimeLine.reset()
        this.matchesTimeLine.play()
    }

    private destroyCell(x: number, y: number): void {
        if (!this.tileGrid || !this.tileGrid[y][x]) return
        const tile = this.tileGrid[y][x]
        this.emitterManager.explodeBoardEmitter(x, y)
        ;(this.tileGrid[y][x] as Tile | undefined) = undefined

        tile.setDepth(10)
        this.add.tween({
            targets: tile,
            scale: 0.2,
            x: 100,
            y: 100,
            duration: 300,
            onComplete: () => {
                tile.destroy()
            },
        })
    }
}
