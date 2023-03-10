export const DIRECTIONS = ['up', 'right', 'down', 'left'];

/**
 * Returns a random element of an array.
 * @param {Array} arr Array of Elements
 * @returns any random Array Element
 */
export function getRandomArrayElement(arr) {
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
// TODO Right now, the Audio Controller also works as a kind of Asset Pool for audio data, 
// would be good to extract that to an actual AssetPool class
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

    /**
     * Creates an audio element for a sound effect linked to the given file and saves a
     * reference to that element in the AudioControllers asset pool, to be able to access
     * it later on.
     * @param {string} name 
     * @param {string} filename 
     */
    addClip(name, filename) {
        if (this.clips[name]) this.removeClip(name);
        const audioElement = new Audio(`${this.soundPath}/${filename}`);
        audioElement.volume = this.soundEffectsVolume;
        this.clips[name] = audioElement;
    }

    /**
     * Removes an audio element for a sound effect from the AudioControllers asset pool.
     * @param {string} name 
     */
    removeClip(name) {
        delete this.clips[name];
    }

    /**
     * Plays a clip from the AudioControllers asset pool, if it exists.
     * Does nothing if sound effects are turned off in the settings.
     * @param {string} name 
     */
    playClip(name) {
        if (this.settings.soundEffects && this.clips[name]) {
            this.clips[name].play();
            this.clips[name].volume = this.soundEffectsVolume;
        }
    }

    /**
     * Creates an audio element for a music track linked to the given file and 
     * saves a reference to that element in the AudioControllers asset pool, to 
     * be able to access it later on.
     * @param {string} name 
     * @param {string} filename 
     */
    addMusic(name, filename) {
        if (this.musicTracks[name]) this.removeMusic(name);
        const audioElement = new Audio(`${this.musicPath}/${filename}`);
        audioElement.volume = this.musicVolume;
        audioElement.loop=true;
        this.musicTracks[name] = audioElement;
    }

    /**
     * Removes an audio element for a music track from the AudioControllers asset pool.
     * @param {string} name 
     */
    removeMusic(name) {
        delete this.musicTracks[name];
    }

    /**
     * Start playing a music track from the AudioControllers asset pool, if it exists in
     * the pool.
     * Does nothing if music is turned off in the settings.

     * Music is set to loop continiously (or until stopped).
     * @param {string} name 
     */
    playMusic(name) {
        // TODO to future proof, would be good to stop playing currently active track when starting
        // a new one (this project only has a single track, but if we add more, this will need to be adjusted)
        if (this.settings.music && this.musicTracks[name]) this.musicTracks[name].play();
    }

    /**
     * Stops playing a music track, if that music track is found in the asset pool.
     * @param {string} name 
     */
    pauseMusic(name) {
        if (this.musicTracks[name]) this.musicTracks[name].pause();
    }

    /**
     * Sets the volume to be used for music tracks.
     * This will effect the current track being played as well as future ones.
     * @param {number} volume 
     */
    setMusicVolume(volume) {
        if (volume) {
            this.musicVolume = volume;
            Object.values(this.musicTracks).forEach((audio)=>audio.volume = volume);
        }
    }

    /**
     * Sets the volume to be used for the sound effects.
     * Has no effect on clips already playing the moment the setting is activated.
     * @param {number} volume
     */
    setSoundEffectVolume(volume) {
        // for sound effects, the volume is adjusted directly on playing them
        if (volume) this.soundEffectsVolume = volume;
    }
}

// TODO Right now, the UI Controller also works as a kind of Asset Pool, would be good to extract 
// that to an actual AssetPool class
export class UIController {
    /**
     * Create a new UIController that can handle the interaction between the game and the website.
     * Manages the variable HTML and CSS parts.
     */
    constructor() {
        this.rows = 10;
        this.columns = 10;
        this.dialogs = {};
        this.icons = {};
        this.elements = {
            root: document.querySelector(':root'),
        }

        // This path is used in the DOM, so uses path from project root
        this.iconPath = './assets/images/icons';

        // This path is used for CSS variables, so needs to the path from CSS folder
        this.playerImagePath = '../assets/images/robot';

        window.addEventListener('resize', this.setTileSize.bind(this));
    }

    /**
     * Clears the containers for the game board, the dice results and the selected dice.
     */
    clearUI() {
        document.getElementById('game-dice-results').innerHTML = '';
        document.getElementById('game-dice-chosen').innerHTML = '';
        document.getElementById('game-board-container').innerHTML = '';
    }

    /**
     * Takes care of all the setup steps necessary when a new map starts.
     * @param {GameBoard} gameBoard 
     * @param {Player} player 
     */
    setupNewMap(gameBoard, player) {
        this.elements.root.style.setProperty('--visibleWhileGameIsRunning', 'visible');
        const {rows, columns} = gameBoard.getDimension();
        this.rows = rows;
        this.columns = columns;
        this.generateGrid();

        this.setTileSize()

        this.drawBoard(gameBoard);
        this.initializePlayer(player);
    }

    /**
     * Hide all UI elements that should only be visible while a game is running.
     * Changes Background to the title screen.
     * Sets up event handler necessary to leave title screen
     */
    displayTitleScene(callback) {
        document.getElementById('title-scene').classList.remove('inactive');
        document.getElementById('game-player-info').classList.add('inactive');
        document.getElementById('game-board-container').classList.add('inactive');

        this.elements.root.style.setProperty('--background-image', 'var(--title-scene)');

        window.addEventListener('keydown', (event)=>{
            if (event.code === 'Space') callback();
        });

        // to make it work on mobile, using touchend event
        window.addEventListener('touchend', (event)=>{
            callback();
        });
    }

    /**
     * Show the UI elements necessary to play the game.
     * Change Background to gradient
     */
    displayGameScene() {
        document.getElementById('title-scene').classList.add('inactive');
        document.getElementById('game-player-info').classList.remove('inactive');
        document.getElementById('game-board-container').classList.remove('inactive');

        this.elements.root.style.setProperty('--background-image', 'var(--gradient)');
    }

    /**
     * Generates a grid exactly large enough to hold the current gameBoard.
     */
    generateGrid() {
        const boardContainer = document.getElementById('game-board-container');

        // setting up the CSS variables to adjust the grid to the rows, columns 
        // and tile size chosen in settings
        this.elements.root.style.setProperty('--columns', this.columns);
        this.elements.root.style.setProperty('--rows', this.rows);
                
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

    /**
     * Draws the gameBoard (terrain, flag) on the grid.
     * @param {GameBoard} gameBoard 
     */
    drawBoard(gameBoard) {
        if (document.querySelectorAll('#game-board-container > .grid-row > .tile').length !== this.columns * this.rows) {
            throw Error('[GameBoard]: Unable to draw map on this game board');
        }

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                document.querySelector(`[row='${row}'][column='${column}'`).classList.add(gameBoard.board[row][column].terrainClass);
            }
        }

        const {row, column} = gameBoard.flagLocation;
        const flagTile = document.createElement('div');
        flagTile.setAttribute('id', 'flag');
        document.querySelector(`[row='${row}'][column='${column}'`).appendChild(flagTile);
    }

    /**
     * Displays the player char on the map and his life total in the UI.
     * @param {Player} player 
     */
    initializePlayer(player) {
        // check if there is already a player div in the dom - if so, use that, if not, create one
        if (document.getElementById('player')) this.elements.player = document.getElementById('player');
        else {
            this.elements.player = document.createElement('div');
            this.elements.player.setAttribute('id', 'player');
        }

        const sprite = `${this.playerImagePath}/${player.sprite}-${DIRECTIONS[player.facingDirection]}.png`
        this.elements.root.style.setProperty('--player-original-sprite', `url('${sprite}')`);
        this.alignPlayerSprite(player);
        this.movePlayerSprite(player);
        this.updatePlayerLifes(player);
    }

    /**
     * Sets the display of players life to the current value.
     * @param {Player} player 
     */
    updatePlayerLifes(player) {
        const lifesElement = document.querySelector('#lifes');
        document.querySelector('#game-lifes').querySelector('h2').textContent = 'Health:';
        lifesElement.innerHTML = '';
        for (let i = 0; i < player.lifes; i++) {
            const newDiv = document.createElement('div');
            lifesElement.appendChild(newDiv);
        }
    }

    /**
     * Hide the player lifes, to be used during transitions from one map to the next
     */
    hidePlayerLifes() {
        document.querySelector('#game-lifes').querySelector('h2').textContent = '';
        document.querySelector('#lifes').innerHTML = '';
    }

    /**
     * Draws the player sprite at his current location.
     * @param {Player} player 
     */
    movePlayerSprite(player) {
        const {row, column} = player.location;

        document.querySelector(`[row='${row}'][column='${column}'`).prepend(this.elements.player);
    }

    /**
     * Allows to exchange the player sprite
     * To be used when player turns and faces a new direction
     * @param {Player} player 
     */
    alignPlayerSprite(player) {
        const sprite = `${this.playerImagePath}/${player.sprite}-${DIRECTIONS[player.facingDirection]}.png`
        this.elements.root.style.setProperty('--player-sprite', `url('${sprite}')`);
    }

    showDevTools() {
        this.elements.root.style.setProperty('--dev-display', 'block');
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

        commands.forEach((command) => {
            const newIconNode = this.icons[command.name].cloneNode(true);
            newIconNode.addEventListener('click', ()=>{
                chooseCommand(command);
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

    updateCompletedMaps(completedMaps) {
        document.querySelectorAll('.counter-completed-maps').forEach(element => {
            element.textContent = completedMaps;
        });
    }


    /**
     * Calculates a tile size that will work best with the available height and width.
     */
    // (Could probably be better implemented via CSS, but I started the project with the 
    // ability to modify tileSize through settings and changed this very late in the project,
    // so I did not want to go make too big a change)
    setTileSize(){
        const availableWidth = window.innerWidth - (window.innerWidth < 1200 ? 0 : 400);
        const availableHeight = window.innerHeight - document.querySelector('nav').offsetHeight
            - (window.innerWidth < 1200 ? 260 : 0);
        const tileSizeWidth = availableWidth / (this.columns + 2);
        const tileSizeHeight = availableHeight / (this.rows);
        const tileSize = Math.floor(Math.min(tileSizeHeight, tileSizeWidth));
        this.elements.root.style.setProperty('--tile-size', `${tileSize}px`);
    }
}