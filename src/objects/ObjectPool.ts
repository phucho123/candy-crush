import { CONST } from '../const/const'
import { Tile } from './tile'

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
            CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 9)]

        const tiles = this.pool.filter((tile) => tile.alpha == 0)

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
            tiles[0].setPosition(
                x * CONST.tileWidth + CONST.tileWidth / 2,
                y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY
            )
            tiles[0].setAlpha(1)
            tiles[0].setColor()
        }
        return tiles[0]
    }
}

// import { CONST } from '../const/const'
// import { Tile } from './tile'

// export class ObjectPool {
//     static instance: ObjectPool | null = null
//     private scene: Phaser.Scene
//     private pool: Phaser.GameObjects.Group

//     constructor(scene: Phaser.Scene) {
//         this.scene = scene
//         this.init()
//     }

//     static getInstance(scene: Phaser.Scene) {
//         if (!ObjectPool.instance) {
//             console.log('Create new Object Pool')
//             ObjectPool.instance = new ObjectPool(scene)
//         }
//         return ObjectPool.instance
//     }

//     addTile(x: number, y: number): Tile {
//         const randomTileType: string =
//             CONST.candyTypes[Phaser.Math.RND.between(0, CONST.candyTypes.length - 9)]

//         const tile = this.pool.get()
//         console.log(tile)
//         tile.setTexture(randomTileType)
//         tile.setPosition(
//             x * CONST.tileWidth + CONST.tileWidth / 2,
//             y * CONST.tileHeight + CONST.tileHeight / 2 + CONST.alignY
//         )
//         tile.setAlpha(1)
//         tile.setColor()
//         return tile
//     }

//     init() {
//         this.pool = this.scene.add.group({
//             classType: Tile,
//             maxSize: 100,
//             runChildUpdate: true,
//         })
//     }
// }
