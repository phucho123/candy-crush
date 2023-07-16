export class LevelupPopup extends Phaser.GameObjects.Container {
    static instance: LevelupPopup | null = null
    private levelupImage: Phaser.GameObjects.Image
    private levelDisplay: Phaser.GameObjects.Text
    private scoreDisplay: Phaser.GameObjects.Text
    constructor(scene: Phaser.Scene) {
        super(scene)
        this.levelupImage = this.scene.add.image(0, 0, 'levelup')
        this.levelupImage.setScale(this.scene.sys.canvas.width / this.levelupImage.displayWidth)
        this.add(this.levelupImage)
        this.setSize(this.levelupImage.displayWidth, this.levelupImage.displayHeight)
        this.levelDisplay = this.scene.add
            .text(35, -90, '100', {
                color: '#ffffff',
                fontSize: '28px',
                fontFamily: 'Arial',
            })
            .setOrigin(0, 0.5)
        this.scoreDisplay = this.scene.add
            .text(0, 20, '100', {
                color: '#ffffff',
                fontSize: '56px',
                fontFamily: 'Arial',
            })
            .setOrigin(0.5)
        this.add(this.levelupImage)
        this.add(this.levelDisplay)
        this.add(this.scoreDisplay)

        this.setPosition(-100, this.scene.sys.canvas.height / 2)
        this.scene.add.existing(this)
    }

    static getInstance(scene: Phaser.Scene) {
        if (!LevelupPopup.instance) LevelupPopup.instance = new LevelupPopup(scene)
        return LevelupPopup.instance
    }

    public setContent(level: number, score: number) {
        this.levelDisplay.setText(`${level}`)
        this.scoreDisplay.setText(`${score}`)
    }

    public resetPosition() {
        this.setPosition(-100, this.scene.sys.canvas.height / 2)
    }
}
