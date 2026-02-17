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

const world = {
  width: canvas.width,
  height: canvas.height,
  castle: { x: canvas.width * 0.75, y: canvas.height * 0.35, radius: 70 },
  crystals: Array.from({ length: 18 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    pulse: Math.random() * Math.PI * 2
  }))
};

const state = {
  player: { x: 480, y: 360, hp: 100, armor: 0, power: 10 },
  level: 1,
  xp: 0,
  xpNext: 100,
  inventory: [],
  mobs: [],
  drops: [],
  eventTimer: 60,
  eventActive: false
};

const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

function spawnMob() {
  const spawnEdge = Math.random() < 0.5 ? 0 : canvas.width;
  const mob = {
    x: spawnEdge,
    y: Math.random() * canvas.height,
    hp: 50 + Math.random() * 30,
    power: 6 + Math.random() * 4,
    alive: true,
    hue: 180 + Math.random() * 60
  };
  state.mobs.push(mob);
}
for (let i = 0; i < 10; i++) spawnMob();

function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= state.xpNext) {
    state.xp -= state.xpNext;
    state.level++;
    state.xpNext = Math.round(state.xpNext * 1.35);
    state.player.power += 3;
    state.player.armor += 1;
  }
}

function dropLoot(x, y) {
  const parts = [
    { name: 'Cambria Helm Shard', bonus: 2 },
    { name: 'Crystal Spaulder', bonus: 3 },
    { name: 'Verdant Greaves', bonus: 2 },
    { name: 'Sunsteel Core', bonus: 4 }
  ];
  const item = parts[Math.floor(Math.random() * parts.length)];
  state.drops.push({ x, y, item, timer: 12 });
}

function pickUpLoot(drop) {
  state.inventory.unshift(`${drop.item.name} +${drop.item.bonus}`);
  state.player.armor += drop.item.bonus;
}

function update(delta) {
  const speed = 180 * delta;
  if (keys.has('KeyW') || keys.has('ArrowUp')) state.player.y -= speed;
  if (keys.has('KeyS') || keys.has('ArrowDown')) state.player.y += speed;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) state.player.x -= speed;
  if (keys.has('KeyD') || keys.has('ArrowRight')) state.player.x += speed;
  state.player.x = Math.max(16, Math.min(canvas.width - 16, state.player.x));
  state.player.y = Math.max(16, Math.min(canvas.height - 16, state.player.y));

  state.mobs.forEach((mob) => {
    if (!mob.alive) return;
    const dx = state.player.x - mob.x;
    const dy = state.player.y - mob.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      mob.x += (dx / dist) * 36 * delta;
      mob.y += (dy / dist) * 36 * delta;
    }
    if (dist < 32) {
      mob.hp -= state.player.power * delta;
      state.player.hp = Math.max(0, state.player.hp - mob.power * delta);
    }
    if (mob.hp <= 0) {
      mob.alive = false;
      gainXP(35);
      dropLoot(mob.x, mob.y);
      setTimeout(spawnMob, 2000);
    }
  });

  state.drops.forEach((drop) => (drop.timer -= delta));
  state.drops = state.drops.filter((drop) => drop.timer > 0);
  state.drops.forEach((drop) => {
    if (Math.hypot(drop.x - state.player.x, drop.y - state.player.y) < 28) {
      pickUpLoot(drop);
      drop.timer = 0;
    }
  });

  state.eventTimer -= delta;
  if (state.eventTimer <= 0 && !state.eventActive) {
    state.eventActive = true;
    state.eventTimer = 25;
    hud.event.textContent = 'Castle Siege Active';
    state.player.power += 8;
  } else if (state.eventActive && state.eventTimer <= 0) {
    state.eventActive = false;
    state.eventTimer = 55;
    hud.event.textContent = 'Castle Peace';
    state.player.power -= 8;
  }
}

function renderBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#041124');
  gradient.addColorStop(1, '#0b1c2f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = state.eventActive ? 'rgba(255, 155, 92, 0.25)' : 'rgba(99, 158, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(world.castle.x, world.castle.y, world.castle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = state.eventActive ? '#ff9b5c' : '#74a4ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  world.crystals.forEach((crystal) => {
    crystal.pulse += 0.6 * (1 / 60);
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.rotate(crystal.pulse * 0.5);
    ctx.fillStyle = `rgba(126, 255, 214, ${0.3 + 0.2 * Math.sin(crystal.pulse)})`;
    ctx.fillRect(-2, -12, 4, 24);
    ctx.restore();
  });
}

function renderEntities() {
  ctx.save();
  ctx.shadowColor = '#ffd27d';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffd27d';
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 18, 0, Math.PI * 2);
  ctx.stroke();

  state.mobs.forEach((mob) => {
    if (!mob.alive) return;
    ctx.fillStyle = `hsl(${mob.hue}, 80%, 60%)`;
    ctx.beginPath();
    ctx.ellipse(mob.x, mob.y, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(mob.x - 12, mob.y - 18, 24, 4);
    ctx.fillStyle = '#ff517a';
    ctx.fillRect(mob.x - 12, mob.y - 18, Math.max(0, (mob.hp / 70) * 24), 4);
  });

  state.drops.forEach((drop) => {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate((drop.timer % 1) * Math.PI * 2);
    ctx.strokeStyle = '#f7ebff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-6, -6, 12, 12);
    ctx.restore();
  });
  ctx.restore();
}

function renderHUD() {
  hud.lvl.textContent = state.level;
  hud.xp.textContent = Math.floor(state.xp);
  hud.xpNext.textContent = state.xpNext;
  hud.armor.textContent = state.player.armor;
  hud.power.textContent = Math.round(state.player.power);
  hud.inventory.innerHTML = state.inventory.slice(0, 6).map((item) => `<li>${item}</li>`).join('');
}

let last = performance.now();
function loop(now) {
  const delta = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(delta);
  renderBackground();
  renderEntities();
  renderHUD();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
