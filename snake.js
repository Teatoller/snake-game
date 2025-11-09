const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const COLS = 20;
const ROWS = 20;
const CELL = canvas.width / COLS;
// const FPS = 8; // ...existing code...
const NUM_OBSTACLES = 10; 

// difficulty map: name -> fps (lower fps = slower)
const DIFFICULTY = {
  novice: 6,       // slow (easier)
  intermediate: 10, // medium
  expert: 14       // fast (hard)
};

let snake, dir, food, score, running, loopId;
let obstacles = []; // new
let fps = DIFFICULTY.intermediate;
let currentDifficulty = 'intermediate';

function reset(){
  snake = [{x:9,y:9},{x:8,y:9},{x:7,y:9}];
  dir = {x:1,y:0}; // moving right
  placeObstacles(); // new: place obstacles first
  placeFood();
  score = 0;
  running = true;
  scoreEl.textContent = 'Score: 0';
  applyInterval();
}

function applyInterval(){
  if (loopId) clearInterval(loopId);
  // start loop with current fps
  loopId = setInterval(tick, 1000 / fps);
}

function setDifficulty(level){
  if (!DIFFICULTY[level]) return;
  currentDifficulty = level;
  fps = DIFFICULTY[level];
  const sel = document.getElementById('difficulty');
  if (sel) sel.value = level;
  // if game is running, restart interval with new fps
  if (running) applyInterval();
}

function placeFood(){
  while(true){
    const f = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
    // ensure food is not on the snake or an obstacle
    if (!snake.some(s => s.x===f.x && s.y===f.y) && !obstacles.some(o => o.x===f.x && o.y===f.y)){ food = f; break; }
  }
}

// new: place obstacles ensuring no overlap with snake or each other (and not on initial head)
function placeObstacles(){
  obstacles = [];
  const forbidden = new Set(snake.map(s => `${s.x},${s.y}`));
  while(obstacles.length < NUM_OBSTACLES){
    const o = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
    const key = `${o.x},${o.y}`;
    if (forbidden.has(key)) continue;
    if (obstacles.some(x => x.x===o.x && x.y===o.y)) continue;
    obstacles.push(o);
  }
}

function tick(){
  if (!running) return;
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

  // wrap-around: allow snake to pass through walls
  head.x = (head.x + COLS) % COLS;
  head.y = (head.y + ROWS) % ROWS;

  // obstacle collision (new)
  if (obstacles.some(o => o.x===head.x && o.y===head.y)) return gameOver();

  // self collision
  if (snake.some(s => s.x===head.x && s.y===head.y)) return gameOver();

  snake.unshift(head);

  // eat?
  if (head.x === food.x && head.y === food.y){
    score += 1;
    scoreEl.textContent = 'Score: ' + score;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function drawCell(x,y,fill){
  ctx.fillStyle = fill;
  ctx.fillRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
}

function draw(){
  // clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // food
  drawCell(food.x, food.y, '#e76f51');

  // obstacles (new) - draw under the snake
  for (let o of obstacles){
    drawCell(o.x, o.y, '#555');
  }

  // snake - head different color
  for (let i=0;i<snake.length;i++){
    drawCell(snake[i].x, snake[i].y, i===0 ? '#6be281' : '#2fd07a');
  }
}

function gameOver(){
  running = false;
  clearInterval(loopId);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, canvas.height/2-30, canvas.width, 60);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over — Score: ' + score, canvas.width/2, canvas.height/2+8);
}

/* Difficulty UI: create a select control and keyboard shortcuts (1/2/3) */
function createDifficultyUI(){
  const info = document.querySelector('.info') || document.body;
  const label = document.createElement('label');
  label.textContent = 'Difficulty: ';
  label.style.color = '#ddd';
  label.style.marginLeft = '8px';

  const sel = document.createElement('select');
  sel.id = 'difficulty';
  sel.style.marginLeft = '6px';
  for (const k of Object.keys(DIFFICULTY)){
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k.charAt(0).toUpperCase() + k.slice(1);
    sel.appendChild(opt);
  }
  sel.value = currentDifficulty;
  sel.addEventListener('change', e => setDifficulty(e.target.value));

  label.appendChild(sel);
  info.appendChild(label);

  // keyboard shortcuts: 1 = novice, 2 = intermediate, 3 = expert
  window.addEventListener('keydown', e => {
    if (e.key === '1') setDifficulty('novice');
    if (e.key === '2') setDifficulty('intermediate');
    if (e.key === '3') setDifficulty('expert');
  });
}

window.addEventListener('keydown', e => {
  const key = e.key;
  const map = {
    ArrowUp: {x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0}
  };
  if (!map[key]) return;
  const nd = map[key];
  // prevent reverse
  if (snake.length > 1 && nd.x === -dir.x && nd.y === -dir.y) return;
  dir = nd;
});

restartBtn.addEventListener('click', reset);

// initialize UI and game
createDifficultyUI();
setDifficulty(currentDifficulty);
reset();
draw();