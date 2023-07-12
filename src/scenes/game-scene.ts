import { CONST } from '../const/const'
import { Position } from '../interfaces/myinterface.interface'
import { Tile } from '../objects/tile'
import { EmitterManager } from '../tweens/EmitterManager'
import { TweenManager } from '../tweens/TweenManager'
import { Progressbar } from '../ui/Progressbar'

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
    private tweenManager: TweenManager
    private idleTimeout: NodeJS.Timeout
    private idle: boolean
    private hintButton: Phaser.GameObjects.Text
    private shuffleButton: Phaser.GameObjects.Text
    private emitterManager: EmitterManager

    constructor() {
        super({
            key: 'GameScene',
        })
        GameScene.instance = this
    }
    static getIntance() {
        return GameScene.instance
    }
    init(): void {
        this.emitterManager = EmitterManager.getInstance(this)
        this.emitterManager.playConffetiEffect(0, this.sys.canvas.height / 2)
        this.tweenManager = TweenManager.getInstance(this)
        this.progressBar = new Progressbar(this)
        this.idle = false
        this.progressBar.init()
        // Init variables
        this.canMove = true

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
            for (let i = gameObj.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[gameObj[i], gameObj[j]] = [gameObj[j], gameObj[i]]
            }
        }
    }

    restart() {
        if (!this.tileGrid) return
        this.canMove = false
        this.shuffle()
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x]) this.tileGrid[y][x].stopHintEffect()
            }
        }
        this.tweenManager.restartTweenPlay(this.tileGrid)

        // Selected Tiles
        this.tweenManager.selectedTileTweenDestroy(1)
        this.tweenManager.selectedTileTweenDestroy(2)
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined

        this.idle = false
    }

    /**
     * Add a new random tile at the specified position.
     * @param x
     * @param y
     */
    private addTile(x: number, y: number): Tile {
        // Get a random tile
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 1)]

        // Return the created tile
        return new Tile({
            scene: this,
            x: x * CONST.tileWidth + CONST.tileWidth / 2,
            y: y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY,
            texture: randomTileType,
        })
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
                this.tileGrid[
                    (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                ][(firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth] =
                    this.secondSelectedTile
                this.tileGrid[
                    (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) / CONST.tileHeight
                ][(secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth] =
                    this.firstSelectedTile
            }

            this.tweenManager.swapTileTween(this.firstSelectedTile, this.secondSelectedTile)

            if (this.tileGrid) {
                this.firstSelectedTile =
                    this.tileGrid[
                        (firstTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) /
                            CONST.tileHeight
                    ][(firstTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth]
                this.secondSelectedTile =
                    this.tileGrid[
                        (secondTilePosition.y - CONST.tileHeight / 2 - CONST.alignY) /
                            CONST.tileHeight
                    ][(secondTilePosition.x - CONST.tileWidth / 2) / CONST.tileWidth]
            }
        }
    }

    public checkMatches(): void {
        //Call the getMatches function to check for spots where there is
        //a run of three or more tiles in a row
        if (!this.tileGrid) return
        if (this.idleTimeout) {
            this.idle = false
            this.hintButton.setAlpha(0.5)
            clearTimeout(this.idleTimeout)
        }

        this.idleTimeout = setTimeout(() => {
            this.idle = true
        }, 1300)
        const matches = this.getMatches(this.tileGrid)

        //If there are matches, remove them
        if (matches.length > 0) {
            //Remove the tiles
            this.removeTileGroup(matches)
            // Move the tiles currently on the board into their new positions
            setTimeout(() => {
                this.resetTile()
                //Fill the board with new tiles wherever there is an empty spot
                this.fillTile()
                this.tileUp()
                // this.checkMatches()
            }, 500)
        } else {
            // No match so just swap the tiles back to their original position and reset
            this.swapTiles()
            this.tileUp()
            this.canMove = true
            // if (this.checkTileGridFull()) {

            // }
        }
    }

    private resetTile(): void {
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

    private fillTile(): void {
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
                    cnt++
                }
            }
        }
    }

    private tileUp(): void {
        this.tweenManager.selectedTileTweenDestroy(1)
        this.tweenManager.selectedTileTweenDestroy(2)

        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined
    }

    private removeTileGroup(matches: Tile[][]): void {
        if (!this.tileGrid) return
        // Loop through all the matches and remove the associated tiles
        const prevScore = this.score
        for (let i = 0; i < matches.length; i++) {
            const tempArr = matches[i]

            this.score += tempArr.length * 100

            for (let j = 0; j < tempArr.length; j++) {
                const tile = tempArr[j]

                //Find where this tile lives in the theoretical grid
                const tilePos = this.getTilePos(this.tileGrid, tile)

                // Remove the tile from the theoretical grid
                if (tilePos.x !== -1 && tilePos.y !== -1) {
                    this.stopHintEffect()
                    if (tempArr.length >= 4 && this.firstSelectedTile && this.secondSelectedTile) {
                        if (tile == this.firstSelectedTile || tile == this.secondSelectedTile) {
                            this.tweenManager.overlapTileTweenPlay(
                                tempArr.filter((tmp_tile) => tmp_tile != tile),
                                tile.x,
                                tile.y
                            )
                        } else {
                            (this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                        }
                    } else {
                        tile.destroy()
                        // this.stopHintEffect()
                        tile.updateEmitterPosition()
                        tile.explode()
                        ;(this.tileGrid[tilePos.y][tilePos.x] as Tile | undefined) = undefined
                    }
                }
            }
        }
        this.progressBar.updateProgreebar(this.score)
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
        if (!this.tileGrid) return
        let find = false
        for (let y = 0; y < this.tileGrid.length; y++) {
            if (find) break
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (find) break
                if (!find && y < this.tileGrid.length - 1) {
                    this.swapTileVertical(y, y + 1, x)
                    if (this.getMatches(this.tileGrid).length) {
                        find = true
                        console.log(`(x: ${x},y: ${y}), 1`)
                    }
                    this.swapTileVertical(y, y + 1, x)
                    if (find) {
                        this.tileGrid[y][x].playHintEffect()
                        this.tileGrid[y + 1][x].playHintEffect()
                    }
                }
                if (!find && x < this.tileGrid[0].length - 1) {
                    this.swapTileHorizontal(x, x + 1, y)
                    if (this.getMatches(this.tileGrid).length) {
                        find = true
                        console.log(`(x: ${x},y: ${y}), 2`)
                    }
                    this.swapTileHorizontal(x, x + 1, y)
                    if (find) {
                        this.tileGrid[y][x].playHintEffect()
                        this.tileGrid[y][x + 1].playHintEffect()
                    }
                }
            }
        }

        if (!find) console.log('No move')
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

    stopHintEffect() {
        if (!this.tileGrid) return
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x]) this.tileGrid[y][x].stopHintEffect()
            }
        }
    }

    update(_time: number, _delta: number): void {
        this.emitterManager.update()
        if (this.idle) {
            if (this.score >= 3000) {
                this.restart()
                this.progressBar.updateProgreebar(0)
                this.progressBar.updateScore(this.score, 0)
                this.score = 0
            }
            this.hintButton.setAlpha(1)
            this.shuffleButton.setAlpha(1)
        } else {
            this.hintButton.setAlpha(0.5)
            this.shuffleButton.setAlpha(0.5)
        }
    }

    setCanMove(canMove: boolean) {
        this.canMove = canMove
    }
}
