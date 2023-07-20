import { CONST } from '../const/const'
import { Tile } from './Tile'

export class ObjectPool {
    static instance: ObjectPool | null = null
    private scene: Phaser.Scene
    private pool: Tile[]

    constructor(scene: Phaser.Scene) {
        this.scene = scene
        this.pool = []
    }

    static getInstance(scene: Phaser.Scene) {
        if (!ObjectPool.instance) {
            console.log('Create new Object Pool')
            ObjectPool.instance = new ObjectPool(scene)
        }
        return ObjectPool.instance
    }

    addTile(x: number, y: number): Tile {
        const randomTileType: string =
            CONST.candyTypes[Phaser.Math.RND.between(8, CONST.candyTypes.length - 1)]

        const tiles = this.pool.filter((tile) => !tile.active)

        if (this.pool.length < CONST.gridWidth * CONST.gridHeight || tiles.length <= 0) {
            console.log('Create new Tile')
            const tile = new Tile({
                scene: this.scene,
                x: x * CONST.tileWidth + CONST.tileWidth / 2,
                y: y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY,
                texture: randomTileType,
            })
            this.pool.push(tile)
            return tile
        }

        if (tiles.length) {
            tiles[0].setTexture(randomTileType)
            tiles[0].setActive(true)
            tiles[0].setVisible(true)
            tiles[0].setAlpha(1)
            tiles[0].setPosition(
                x * CONST.tileWidth + CONST.tileWidth / 2,
                y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY
            )
            tiles[0].setColor()
        }
        return tiles[0]
    }
}
