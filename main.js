const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  lvl: document.getElementById('lvl'),
  xp: document.getElementById('xp'),
  xpNext: document.getElementById('xpNext'),
  armor: document.getElementById('armor'),
  power: document.getElementById('power'),
  inventory: document.getElementById('inventory'),
  event: document.getElementById('eventStatus')
};

const state = {
  player: { x: 480, y: 300, hp: 100, armor: 0, power: 10 },
  level: 1,
  xp: 0,
  xpNext: 100,
  inventory: [],
  mobs: [],
  drops: [],
  eventTimer: 45,
  eventActive: false
};

const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

function spawnMob() {
  const mob = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    hp: 40 + Math.random() * 20,
    power: 6 + Math.random() * 4,
    alive: true
  };
  state.mobs.push(mob);
}

for (let i = 0; i < 8; i++) spawnMob();

function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= state.xpNext) {
    state.xp -= state.xpNext;
    state.level++;
    state.xpNext = Math.round(state.xpNext * 1.3);
    state.player.power += 2;
  }
}

function dropLoot(x, y) {
  const parts = ['Helm fragment', 'Chest plate shard', 'Greaves plate', 'Crystal core'];
  const item = parts[Math.floor(Math.random() * parts.length)];
  state.drops.push({ x, y, item, timer: 10 });
}

function pickUpLoot(drop) {
  state.inventory.push(drop.item);
  state.player.armor += 2;
}

function update(delta) {
  const speed = 160 * delta;
  if (keys.has('KeyW') || keys.has('ArrowUp')) state.player.y -= speed;
  if (keys.has('KeyS') || keys.has('ArrowDown')) state.player.y += speed;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) state.player.x -= speed;
  if (keys.has('KeyD') || keys.has('ArrowRight')) state.player.x += speed;
  state.player.x = Math.max(0, Math.min(canvas.width, state.player.x));
  state.player.y = Math.max(0, Math.min(canvas.height, state.player.y));

  state.mobs.forEach((mob) => {
    if (!mob.alive) return;
    const dx = state.player.x - mob.x;
    const dy = state.player.y - mob.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 90) {
      mob.x += (dx / dist) * 40 * delta;
      mob.y += (dy / dist) * 40 * delta;
      if (dist < 30) {
        mob.hp -= state.player.power * delta;
        state.player.hp -= mob.power * delta;
      }
    }
    if (mob.hp <= 0) {
      mob.alive = false;
      gainXP(25);
      dropLoot(mob.x, mob.y);
      setTimeout(spawnMob, 2500);
    }
  });

  state.drops.forEach((drop) => (drop.timer -= delta));
  state.drops = state.drops.filter((drop) => drop.timer > 0);

  state.drops.forEach((drop) => {
    if (Math.hypot(drop.x - state.player.x, drop.y - state.player.y) < 25) {
      pickUpLoot(drop);
      drop.timer = 0;
    }
  });

  state.eventTimer -= delta;
  if (state.eventTimer <= 0 && !state.eventActive) {
    state.eventActive = true;
    state.eventTimer = 30;
    hud.event.textContent = 'Castle gate opened!';
    state.player.power += 5;
  } else if (state.eventActive && state.eventTimer <= 0) {
    state.eventActive = false;
    state.eventTimer = 45;
    hud.event.textContent = 'Castle peace';
    state.player.power -= 5;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#101b2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffcf73';
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6fe7ff';
  state.mobs.forEach((mob) => {
    if (!mob.alive) return;
    ctx.beginPath();
    ctx.arc(mob.x, mob.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6f91';
    ctx.fillRect(mob.x - 12, mob.y - 16, (mob.hp / 60) * 24, 4);
    ctx.fillStyle = '#6fe7ff';
  });

  ctx.fillStyle = '#fff1d0';
  state.drops.forEach((drop) => {
    ctx.fillRect(drop.x - 4, drop.y - 4, 8, 8);
  });
}

let last = performance.now();
function loop(now) {
  const delta = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(delta);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function refreshHUD() {
  hud.lvl.textContent = state.level;
  hud.xp.textContent = Math.round(state.xp);
  hud.xpNext.textContent = state.xpNext;
  hud.armor.textContent = state.player.armor;
  hud.power.textContent = Math.round(state.player.power);
  hud.inventory.innerHTML = state.inventory.map((item) => `<li>${item}</li>`).join('');
  requestAnimationFrame(refreshHUD);
}
refreshHUD();
