const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const caughtElement = document.querySelector("#caught");
const statusElement = document.querySelector("#statusText");
const startOverlay = document.querySelector("#startOverlay");
const startButton = document.querySelector("#startButton");

const WORLD_WIDTH = canvas.width;
const WORLD_HEIGHT = canvas.height;
const GROUND_Y = 470;

const basket = {
  x: WORLD_WIDTH / 2 - 54,
  y: 423,
  width: 108,
  height: 48,
  speed: 460,
};

const keys = { left: false, right: false };
let apples = [];
let score = 0;
let caught = 0;
let previousTime = 0;
let spawnTimer = 0;
let nextSpawnAfter = 0.75;
let animationFrame = 0;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function updateHud(message) {
  scoreElement.textContent = String(score).padStart(4, "0");
  caughtElement.textContent = String(caught);
  if (message) statusElement.textContent = message;
}

function resetGame() {
  basket.x = WORLD_WIDTH / 2 - basket.width / 2;
  apples = [];
  score = 0;
  caught = 0;
  spawnTimer = 0;
  nextSpawnAfter = 0.65;
  updateHud("苹果要落下来了");
}

function spawnApple() {
  const radius = 19 + Math.random() * 5;
  apples.push({
    x: 50 + Math.random() * (WORLD_WIDTH - 100),
    y: -radius - 8,
    radius,
    speed: 150 + Math.random() * 70,
    wobble: Math.random() * Math.PI * 2,
  });
  nextSpawnAfter = 0.78 + Math.random() * 0.42;
}

function isAppleCaught(apple) {
  const basketTop = basket.y + 4;
  return (
    apple.y + apple.radius >= basketTop &&
    apple.y - apple.radius <= basket.y + basket.height &&
    apple.x + apple.radius * 0.65 >= basket.x &&
    apple.x - apple.radius * 0.65 <= basket.x + basket.width
  );
}

function update(deltaTime) {
  const direction = Number(keys.right) - Number(keys.left);
  basket.x += direction * basket.speed * deltaTime;
  basket.x = clamp(basket.x, 18, WORLD_WIDTH - basket.width - 18);
  canvas.dataset.playerX = String(Math.round(basket.x));

  spawnTimer += deltaTime;
  if (spawnTimer >= nextSpawnAfter) {
    spawnTimer = 0;
    spawnApple();
  }

  apples.forEach((apple) => {
    apple.y += apple.speed * deltaTime;
    apple.wobble += deltaTime * 2.2;
  });

  const remainingApples = [];
  for (const apple of apples) {
    if (isAppleCaught(apple)) {
      score += 10;
      caught += 1;
      updateHud(caught % 5 === 0 ? "漂亮！继续保持" : "接到了，+10 分");
    } else if (apple.y - apple.radius > WORLD_HEIGHT) {
      updateHud("差一点，再接一个");
    } else {
      remainingApples.push(apple);
    }
  }
  apples = remainingApples;
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawCloud(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 250, 236, 0.92)";
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 12, 24, Math.PI * 0.75, Math.PI * 1.7);
  ctx.arc(29, 0, 30, Math.PI, Math.PI * 1.9);
  ctx.arc(64, 14, 24, Math.PI * 1.2, Math.PI * 0.22);
  ctx.lineTo(0, 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTree(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#7b4429";
  ctx.fillRect(-8, 20, 16, 78);
  ctx.fillStyle = color;
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 3;
  for (const [cx, cy, radius] of [[-27, 13, 32], [5, -4, 41], [38, 15, 30], [7, 32, 38]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#e94a35";
  for (const [appleX, appleY] of [[-19, 7], [18, -12], [35, 21], [1, 37]]) {
    ctx.beginPath();
    ctx.arc(appleX, appleY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#76c8db");
  sky.addColorStop(1, "#cce9d1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = "#f7b928";
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(818, 86, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawCloud(120, 94, 0.9);
  drawCloud(510, 66, 0.62);

  ctx.fillStyle = "#579660";
  ctx.beginPath();
  ctx.moveTo(0, 372);
  ctx.quadraticCurveTo(165, 260, 338, 370);
  ctx.quadraticCurveTo(545, 240, 735, 366);
  ctx.quadraticCurveTo(860, 288, 960, 350);
  ctx.lineTo(960, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  drawTree(82, 304, 0.72, "#326f42");
  drawTree(885, 298, 0.78, "#2c6c3e");
  drawTree(717, 334, 0.48, "#438451");
  drawTree(245, 338, 0.45, "#438451");

  ctx.fillStyle = "#78a84e";
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(WORLD_WIDTH, GROUND_Y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(45, 36, 29, 0.38)";
  ctx.lineWidth = 2;
  for (let x = 12; x < WORLD_WIDTH; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, WORLD_HEIGHT);
    ctx.lineTo(x + 12, GROUND_Y + 8);
    ctx.stroke();
  }
}

function drawApple(apple) {
  const wobbleX = Math.sin(apple.wobble) * 2;
  ctx.save();
  ctx.translate(apple.x + wobbleX, apple.y);
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 3;

  ctx.fillStyle = "#e94a35";
  ctx.beginPath();
  ctx.arc(-apple.radius * 0.34, 2, apple.radius * 0.73, 0, Math.PI * 2);
  ctx.arc(apple.radius * 0.34, 2, apple.radius * 0.73, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#5f3724";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -apple.radius * 0.7);
  ctx.lineTo(5, -apple.radius * 1.15);
  ctx.stroke();

  ctx.fillStyle = "#3f8548";
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(12, -apple.radius * 0.92, 10, 5, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.ellipse(-8, -7, 4, 7, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBasket() {
  ctx.save();
  ctx.translate(basket.x, basket.y);
  ctx.strokeStyle = "#2d241d";
  ctx.lineWidth = 4;

  ctx.fillStyle = "#b96c37";
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.lineTo(basket.width, 7);
  ctx.lineTo(basket.width - 13, basket.height);
  ctx.lineTo(13, basket.height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8c4d2b";
  roundedRect(-5, 0, basket.width + 10, 13, 5);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 232, 174, 0.75)";
  ctx.lineWidth = 3;
  for (let x = 19; x < basket.width; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x - 5, basket.height - 4);
    ctx.stroke();
  }
  for (let y = 24; y < basket.height; y += 12) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(basket.width - 10, y);
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  drawBackground();
  apples.forEach(drawApple);
  drawBasket();
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - previousTime) / 1000, 0.033);
  previousTime = timestamp;
  update(deltaTime);
  draw();
  animationFrame = window.requestAnimationFrame(gameLoop);
}

function startGame() {
  window.cancelAnimationFrame(animationFrame);
  resetGame();
  startOverlay.hidden = true;
  previousTime = performance.now();
  animationFrame = window.requestAnimationFrame(gameLoop);
}

function setKey(event, pressed) {
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    keys.left = pressed;
    event.preventDefault();
  }
  if (key === "arrowright" || key === "d") {
    keys.right = pressed;
    event.preventDefault();
  }
}

window.addEventListener("keydown", (event) => setKey(event, true));
window.addEventListener("keyup", (event) => setKey(event, false));
window.addEventListener("blur", () => {
  keys.left = false;
  keys.right = false;
});
startButton.addEventListener("click", startGame);

canvas.dataset.playerX = String(Math.round(basket.x));
draw();

// Intentionally unfinished. Pick exactly one next feature from TASKS.md.
