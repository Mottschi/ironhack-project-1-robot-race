
/**
 * Returns a random element of an array.
 * @param {Array} arr Array of Elements
 * @returns any random Array Element
 */
export let getRandomArrayElement = function getRandomArrayElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};


/**
 * AudioController has access to the current settings and will play clips only when current
 * settings allows it to do so.
 * 
 * Allows adding clips via addClip(), removing Clips via removeClip()
 * and playing clips via playClip
 * playClip will play the corresponding sound clip if and only if the current setting
 * for sound effects is enabled AND the sound effect was set up previously via addClip
 */
// TODO Right now, the Audio Controller also works as a kind of Asset Pool, would be good to extract 
// that to an actual AssetPool class
export class AudioController {
    constructor(settings) {
        this.settings = settings;
        this.clips = {};
        this.musicTracks = {};
        this.musicVolume = settings.musicVolume ? settings.musicVolume : 1;
        this.soundEffectsVolume = settings.soundEffectsVolume ? settings.soundEffectsVolume : 1;
        
        // These paths are used in the DOM, so use path from project root
        this.soundPath = './assets/sound';
        this.musicPath = './assets/music';

    }

    addClip(name, filename) {
        if (this.clips[name]) this.removeClip(name);
        const audioElement = new Audio(`${this.soundPath}/${filename}`);
        audioElement.volume = this.soundEffectsVolume;
        this.clips[name] = audioElement;
    }

    removeClip(name) {
        delete this.clips[name];
    }

    playClip(name) {
        if (this.settings.soundEffects && this.clips[name]) {
            this.clips[name].play();
            this.clips[name].volume = this.soundEffectsVolume;
        }
    }

    addMusic(name, filename) {
        if (this.musicTracks[name]) this.removeMusic(name);
        const audioElement = new Audio(`${this.musicPath}/${filename}`);
        audioElement.volume = this.musicVolume;
        this.musicTracks[name] = audioElement;
    }

    removeMusic(name) {
        delete this.musicTracks[name];
    }

    playMusic(name) {
        if (this.settings.music && this.musicTracks[name]) this.musicTracks[name].play();
    }

    pauseMusic(name) {
        if (this.musicTracks[name]) this.musicTracks[name].pause();
    }

    setMusicVolume(volume) {
        // for music, the volume is adjusted on change of the setting
        if (volume) {
            this.musicVolume = volume;
            Object.values(this.musicTracks).forEach((audio)=>audio.volume = volume);
        }
    }

    setSoundEffectVolume(volume) {
        // for sound effects, the volume is adjusted directly on playing them
        if (volume) this.soundEffectsVolume = volume;
    }
}

export const DIRECTIONS = ['up', 'right', 'down', 'left'];

export class UIController {
    constructor() {
        this.rows = null;
        this.columns = null;
        this.root = document.querySelector(':root');
        this.dialogs = {};
        this.icons = {};

        // This path is used in the DOM, so uses path from project root
        this.iconPath = './assets/images/icons';

        // This path is used for CSS variables, so needs to the path from CSS folder
        this.playerImagePath = '../assets/images/robot';
    }

    resetUI() {
        console.log('resetting ui');
        document.getElementById('game-dice-results').innerHTML = '';
        document.getElementById('game-dice-chosen').innerHTML = '';
        document.getElementById('game-board-container').innerHTML = '';
    }

    /**
     * 
     * @param {GameBoard} gameBoard 
     * @param {Player} player 
     */
    setupNewMap(gameBoard, player) {
        this.root.style.setProperty('--visibleWhileGameIsRunning', 'visible');
        const {rows, columns} = gameBoard.getDimension();
        this.rows = rows;
        this.columns = columns;
        this.generateGrid();
        this.drawBoard(gameBoard);
        this.initializePlayer(player);
    }

    stopGame() {
        this.root.style.setProperty('--visibleWhileGameIsRunning', 'hidden');
    }

    generateGrid() {
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        this.root.style.setProperty('--columns', this.columns);
        this.root.style.setProperty('--rows', this.rows);
                
        // reset the grid container, in case there was already something in there from a previous round
        boardContainer.innerHTML = '';

        // generate a new grid
        for (let row = 0; row < this.rows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('grid-row');           
            
            for (let column = 0; column < this.columns; column++) {
                const gridTile = document.createElement('div');
                gridTile.classList.add('tile');
                gridTile.setAttribute('row', row);
                gridTile.setAttribute('column', column);
                rowDiv.appendChild(gridTile);
            }
            boardContainer.appendChild(rowDiv);
        }
    }


    drawBoard(gameBoard) {
        if (document.querySelectorAll('#game-board-container > .grid-row > .tile').length !== this.columns * this.rows) {
            console.log('drawing board of size', this.columns, 'x', this.rows);
            throw Error('[GameBoard]: Unable to draw map on this game board');
        }

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                document.querySelector(`[row='${row}'][column='${column}'`).classList.add(gameBoard.board[row][column].terrainClass);
            }
        }

        const {row, column} = gameBoard.flagLocation;
        document.querySelector(`[row='${row}'][column='${column}'`).setAttribute('id', 'flag');
    }

    initializePlayer(player) {
        const sprite = `${this.playerImagePath}/${player.sprite}-${DIRECTIONS[player.facingDirection]}.png`
        const root = document.querySelector(':root');
        root.style.setProperty('--player-original-sprite', `url('${sprite}')`);
        this.alignPlayerSprite(player);
        this.movePlayerSprite(player);
        this.updatePlayerLifes(player);
    }

    updatePlayerLifes(player) {
        const lifesElement = document.querySelector('#lifes');
        lifesElement.innerHTML = '';
        for (let i = 0; i < player.lifes; i++) {
            const newDiv = document.createElement('div');
            lifesElement.appendChild(newDiv);
        }
    }

    /**
     * Draws the player sprite at his current location.
     * @param {Player} player 
     */
    movePlayerSprite(player) {
        const {row, column} = player.location;
        const oldLocation = document.getElementById('player');
        if (oldLocation) oldLocation.removeAttribute('id', 'player');
        document.querySelector(`[row='${row}'][column='${column}'`).setAttribute('id', 'player');
    }

    /**
     * Allows to exchange the player sprite
     * To be used when player turns and faces a new direction
     * @param {Player} player 
     */
    alignPlayerSprite(player) {
        const sprite = `${this.playerImagePath}/${player.sprite}-${DIRECTIONS[player.facingDirection]}.png`
        this.root.style.setProperty('--player-sprite', `url('${sprite}')`);
    }

    showDevTools() {
        this.root.style.setProperty('--dev-display', 'block');
    }

    showDialog(name) {
        if (this.dialogs[name]) this.dialogs[name].showModal();
    }

    hideDialog(name) {
        if (this.dialogs[name]) this.dialogs[name].close();
    }

    addDialog(name, id) {
        const dialog = document.getElementById(id);
        this.dialogs[name] = dialog;
    }

    addIcon(name, filename) {
        const iconDiv = document.createElement('div');
        iconDiv.classList.add('icon');
        
        const iconImg = document.createElement('img');
        iconImg.src = `${this.iconPath}/${filename}`;

        iconDiv.appendChild(iconImg);
        this.icons[name] = iconDiv;
    }

    /**
     * Receives an array of objects, each with a game command, and a callback function
     * that should be executed when the generated icon is clicked
     * @param {*} commands 
     */
    showDiceResults(commands, chooseCommand) {
        // clear out the containers before adding the new dice results
        const diceResultContainer = document.querySelector('#game-dice-results');
        this.updateChosenDiceResults([]);

        diceResultContainer.innerHTML = '';

        commands.forEach((command, index) => {
            const newIconNode = this.icons[command.name].cloneNode(true);
            newIconNode.addEventListener('click', ()=>{
                chooseCommand(index, command);
                newIconNode.classList.add('chosen');
            })
            diceResultContainer.appendChild(newIconNode);
        });

        
    }

    updateChosenDiceResults(commands) {
        const diceChosenContainer = document.querySelector('#game-dice-chosen');
        diceChosenContainer.innerHTML = '';

        commands.forEach(command => {
            const newIconNode = this.icons[command.name].cloneNode(true);
            newIconNode.classList.add('chosen');
            diceChosenContainer.appendChild(newIconNode);
        })

        for (let i = 0; i < 3 - commands.length; i++) {
            const newEmptyIconNode = document.createElement('div');
            newEmptyIconNode.classList.add('icon');
            diceChosenContainer.appendChild(newEmptyIconNode);
        }
    }
}