class GameOfLife {
    constructor() {
        this.canvas = document.getElementById('game_canvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 8;
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        this.rows = Math.floor(this.canvas.height / this.cellSize);

        this.grid = this.createGrid();
        this.isPlaying = false;
        this.generation = 0;
        this.speed = 5;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsStartTime = Date.now();

        this.isMouseDown = false;
        this.paintMode = null;

        this.setupEventListeners();
        this.draw();
        this.updateStats();
    }

    createGrid() {
        return Array(this.rows).fill().map(() => Array(this.cols).fill(false));
    }


    setupEventListeners() {
        document.getElementById('play_button').addEventListener('click', () => this.togglePlay());
        document.getElementById('step_button').addEventListener('click', () => this.step());
        document.getElementById('clear_button').addEventListener('click', () => this.clear());
        document.getElementById('random_button').addEventListener('click', () => this.randomize());

        const speed_slider = document.getElementById('speed_slider');
        speed_slider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speed_value').textContent = this.speed;
        });

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    getCellFromMouse(e) {
        const pos = this.getMousePos(e);
        const col = Math.floor(pos.x / this.cellSize);
        const row = Math.floor(pos.y / this.cellSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        return null;
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        const cell = this.getCellFromMouse(e);
        if (cell) {
            this.paintMode = this.grid[cell.row][cell.col] ? 'dead' : 'alive';
            this.toggleCell(cell.row, cell.col);
        }
    }

    handleMouseMove(e) {
        if (this.isMouseDown) {
            const cell = this.getCellFromMouse(e);
            if (cell) {
                this.paintCell(cell.row, cell.col);
            }
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.paintMode = null;
    }

    toggleCell(row, col) {
        this.grid[row][col] = !this.grid[row][col];
        this.draw();
        this.updateStats();
    }

    paintCell(row, col) {
        if (this.paintMode === 'alive' && !this.grid[row][col]) {
            this.grid[row][col] = true;
            this.draw();
            this.updateStats();
        } else if (this.paintMode === 'dead' && this.grid[row][col]) {
            this.grid[row][col] = false;
            this.draw();
            this.updateStats();
        }
    }

    countNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.grid[newRow][newCol]) {
                    count++;
                }
            }
        }
        return count;
    }

    step() {
        const newGrid = this.createGrid();
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const isAlive = this.grid[row][col];
                
                if (isAlive && (neighbors === 2 || neighbors === 3)) {
                    newGrid[row][col] = true;
                } else if (!isAlive && neighbors === 3) {
                    newGrid[row][col] = true;
                }
            }
        }
        
        this.grid = newGrid;
        this.generation++;
        this.draw();
        this.updateStats();
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const play_button = document.getElementById('play_button');
        
        if (this.isPlaying) {
            play_button.textContent = '⏸ Pause';
            play_button.className = 'pause_button';
            this.animate();
        } else {
            play_button.textContent = '▶ Play';
            play_button.className = 'play_button';
        }
    }

    animate(currentTime = 0) {
        if (!this.isPlaying) return;
        
        const frameInterval = 1000 / this.speed;
        
        if (currentTime - this.lastFrameTime >= frameInterval) {
            this.step();
            this.lastFrameTime = currentTime;
            
            this.frameCount++;
            if (currentTime - this.fpsStartTime >= 1000) {
                document.getElementById('fps').textContent = this.frameCount;
                this.frameCount = 0;
                this.fpsStartTime = currentTime;
            }
        }
        
        requestAnimationFrame((time) => this.animate(time));
    }

    clear() {
        this.grid = this.createGrid();
        this.generation = 0;
        this.draw();
        this.updateStats();
    }

    randomize() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < 0.3;
            }
        }
        this.generation = 0;
        this.draw();
        this.updateStats();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw alive cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    const x = col * this.cellSize;
                    const y = row * this.cellSize;
                    
                    this.ctx.fillStyle = "#14204f";
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                }
            }
        }
    }

    updateStats() {
        document.getElementById('generation').textContent = this.generation;
        
        let population = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) population++;
            }
        }
        document.getElementById('population').textContent = population;
    }

    
}

window.addEventListener('load', () => {
    new GameOfLife();
});