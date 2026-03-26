export const audio = {
    bgMusic: new Audio('assets/bg-noise.mp3'),
    playing: false,
    
    init() {
        if (this.playing) return;
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.4;
        
        this.bgMusic.play().then(() => {
            this.playing = true;
        }).catch(e => console.log("Audio waiting for user interaction.", e));
    },
    
    // Fallbacks so game logic doesn't crash
    playUI() { },
    playCoin() { },
    playTool(type) { }
};
