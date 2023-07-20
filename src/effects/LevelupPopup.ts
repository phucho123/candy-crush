export class LevelupPopup extends Phaser.GameObjects.Container {
    static instance: LevelupPopup | null = null
    private levelupImage: Phaser.GameObjects.Image
    private levelDisplay: Phaser.GameObjects.BitmapText
    constructor(scene: Phaser.Scene) {
        super(scene)
        this.levelupImage = this.scene.add.image(0, 0, 'levelup')
        this.levelupImage.setScale(
            (this.scene.sys.canvas.width * 0.8) / this.levelupImage.displayWidth
        )
        this.add(this.levelupImage)
        this.setSize(this.levelupImage.displayWidth, this.levelupImage.displayHeight)
        this.levelDisplay = this.scene.add
            .bitmapText(0, 0, 'font', '0', 64)
            .setOrigin(0.5)
            .setDepth(2)
            .setTint(0x52420f)
        this.add(this.levelupImage)
        this.add(this.levelDisplay)
        this.setAlpha(0)

        this.setPosition(-100, this.scene.sys.canvas.height / 2)
        this.scene.add.existing(this)
    }

    static getInstance(scene: Phaser.Scene) {
        if (!LevelupPopup.instance) LevelupPopup.instance = new LevelupPopup(scene)
        return LevelupPopup.instance
    }

    public setContent(level: number) {
        this.levelDisplay.setText(`${level}`)
    }

    public resetPosition() {
        this.setAlpha(1)
        this.setPosition(this.scene.sys.canvas.width / 2, 1000)
    }
}
