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
let fruits = [];
let score = 0;
let caught = 0;
let previousTime = 0;
let spawnTimer = 0;
let nextSpawnAfter = 0.75;
let animationFrame = 0;
let backgroundTime = 0;

const BEACH_COLORS = Object.freeze({
  sky: "#fff1f2",
  cloud: "#fffbeb",
  sun: "#d97706",
  sunset: "#fed7aa",
  sea: "#0891b2",
  wave: "#eff6ff",
  waveShadow: "#2563eb",
  shore: "#ecfdf3",
  leaves: "#16a34a",
  foam: "#bbf7d0",
  silhouette: "#111827",
});

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
  fruits = [];
  score = 0;
  caught = 0;
  spawnTimer = 0;
  nextSpawnAfter = 0.65;
  backgroundTime = 0;
  updateHud("水果要落下来了");
}

function spawnFruit() {
  const isOrange = Math.random() < 0.3;
  const radius = isOrange ? 18 + Math.random() * 3 : 19 + Math.random() * 5;
  fruits.push({
    type: isOrange ? "orange" : "apple",
    points: isOrange ? 5 : 10,
    x: 50 + Math.random() * (WORLD_WIDTH - 100),
    y: -radius - 8,
    radius,
    speed: 150 + Math.random() * 70,
    wobble: Math.random() * Math.PI * 2,
  });
  nextSpawnAfter = 0.78 + Math.random() * 0.42;
}

function isFruitCaught(fruit) {
  const basketTop = basket.y + 4;
  return (
    fruit.y + fruit.radius >= basketTop &&
    fruit.y - fruit.radius <= basket.y + basket.height &&
    fruit.x + fruit.radius * 0.65 >= basket.x &&
    fruit.x - fruit.radius * 0.65 <= basket.x + basket.width
  );
}

function update(deltaTime) {
  backgroundTime += deltaTime;

  const direction = Number(keys.right) - Number(keys.left);
  basket.x += direction * basket.speed * deltaTime;
  basket.x = clamp(basket.x, 18, WORLD_WIDTH - basket.width - 18);
  canvas.dataset.playerX = String(Math.round(basket.x));

  spawnTimer += deltaTime;
  if (spawnTimer >= nextSpawnAfter) {
    spawnTimer = 0;
    spawnFruit();
  }

  fruits.forEach((fruit) => {
    fruit.y += fruit.speed * deltaTime;
    fruit.wobble += deltaTime * 2.2;
  });

  const remainingFruits = [];
  for (const fruit of fruits) {
    if (isFruitCaught(fruit)) {
      score += fruit.points;
      caught += 1;
      if (fruit.type === "orange") {
        updateHud("接到橘子，+5 分");
      } else {
        updateHud(caught % 5 === 0 ? "漂亮！继续保持" : "接到了，+10 分");
      }
    } else if (fruit.y - fruit.radius > WORLD_HEIGHT) {
      updateHud("差一点，再接一个");
    } else {
      remainingFruits.push(fruit);
    }
  }
  fruits = remainingFruits;
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

function drawWaveLine(y, amplitude, speed, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(-32, y);
  for (let x = -32; x < WORLD_WIDTH + 32; x += 32) {
    const nextX = x + 32;
    const nextY = y + Math.sin((nextX * 0.028) + (backgroundTime * speed)) * amplitude;
    ctx.quadraticCurveTo(x + 16, y - amplitude, nextX, nextY);
  }
  ctx.stroke();
}

function drawSeagull(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = BEACH_COLORS.silhouette;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-7, 0, 7, Math.PI * 1.08, Math.PI * 1.92);
  ctx.arc(7, 0, 7, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  const horizonY = 286;
  const shoreY = 434;
  const cloudDrift = (backgroundTime * 7) % (WORLD_WIDTH + 220);
  const birdDrift = (backgroundTime * 16) % (WORLD_WIDTH + 180);

  ctx.fillStyle = BEACH_COLORS.sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = BEACH_COLORS.cloud;
  ctx.fillRect(0, 204, WORLD_WIDTH, 82);

  ctx.fillStyle = BEACH_COLORS.sun;
  ctx.beginPath();
  ctx.arc(728, 222, 66, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(cloudDrift - 160, 72, 0.55);
  drawCloud(cloudDrift - 620, 124, 0.38);
  drawSeagull(birdDrift - 120, 132, 0.9);
  drawSeagull(birdDrift - 84, 151, 0.58);

  ctx.fillStyle = BEACH_COLORS.sea;
  ctx.fillRect(0, horizonY, WORLD_WIDTH, shoreY - horizonY);

  ctx.fillStyle = BEACH_COLORS.silhouette;
  ctx.beginPath();
  ctx.moveTo(0, 326);
  ctx.quadraticCurveTo(106, 248, 258, 319);
  ctx.quadraticCurveTo(350, 272, 446, 318);
  ctx.lineTo(446, horizonY + 52);
  ctx.lineTo(0, horizonY + 52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = BEACH_COLORS.sunset;
  for (let index = 0; index < 5; index += 1) {
    const width = 38 + index * 22;
    const y = 294 + index * 25;
    const offset = Math.sin((backgroundTime * 1.8) + index) * 8;
    ctx.fillRect(728 - (width / 2) + offset, y, width, 5);
  }

  drawWaveLine(316, 4, 1.25, BEACH_COLORS.wave, 3);
  drawWaveLine(360, 6, 1.65, BEACH_COLORS.waveShadow, 4);
  drawWaveLine(403, 5, 1.4, BEACH_COLORS.wave, 3);

  ctx.fillStyle = BEACH_COLORS.shore;
  ctx.fillRect(0, shoreY, WORLD_WIDTH, WORLD_HEIGHT - shoreY);
  drawWaveLine(shoreY + 2, 4, 2.1, BEACH_COLORS.foam, 4);

  drawTree(48, 320, 0.84, BEACH_COLORS.leaves);
  drawTree(908, 306, 0.96, BEACH_COLORS.leaves);
  drawTree(756, 354, 0.48, BEACH_COLORS.leaves);
  drawTree(224, 360, 0.42, BEACH_COLORS.leaves);
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

function drawOrange(orange) {
  const wobbleX = Math.sin(orange.wobble) * 2;
  ctx.save();
  ctx.translate(orange.x + wobbleX, orange.y);
  ctx.strokeStyle = BEACH_COLORS.silhouette;
  ctx.lineWidth = 3;

  ctx.fillStyle = BEACH_COLORS.sun;
  ctx.beginPath();
  ctx.arc(0, 2, orange.radius * 0.84, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = BEACH_COLORS.sunset;
  ctx.beginPath();
  ctx.ellipse(-orange.radius * 0.25, -orange.radius * 0.2, 3, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BEACH_COLORS.leaves;
  ctx.beginPath();
  ctx.ellipse(8, -orange.radius * 0.9, 8, 4, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFruit(fruit) {
  if (fruit.type === "orange") {
    drawOrange(fruit);
    return;
  }
  drawApple(fruit);
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
  fruits.forEach(drawFruit);
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
