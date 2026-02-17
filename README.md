# Cambria Siege (Prototype)

Browser-based ARPG sandbox inspired by Lineage II. Current build features:

- Top-down battlefield with crystal beacons, castle zone, and ambient grid.
- Mob spawners that chase, trade blows, drop armor fragments, and respawn.
- Inventory + stats HUD persisting armor bonuses and level scaling.
- Timed castle event that empowers the player during siege windows.

## Stack

- HTML5 Canvas + vanilla JavaScript.
- Purely client-side for now; logic structured for future multiplayer sync.

## Run locally

```bash
python3 -m http.server 4173
# or
npx serve
```

Open `http://localhost:4173` in a desktop browser.
