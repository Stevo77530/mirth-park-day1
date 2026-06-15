/**
 * MIRTH Park — Day One
 * Main game loop, rendering, input, and simulation
 * Isometric prototype with basic build mode and guest agents
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: true });

let park = {
    gridSize: 16,
    tiles: [],           // 2D array of tile types
    rides: [],           // {gridX, gridY, type}
    guests: [],
    day: 1,
    profit: 12450,
    suspicion: 12,
    selectedBuildType: 'path'
};

let camera = { offsetX: 380, offsetY: 80 }; // center the map nicely
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;

let lastTime = Date.now();
let simulationAccumulator = 0;
const SIMULATION_STEP = 120; // ms between guest updates

// === INITIALIZATION ===
function initPark() {
    // Create empty grid
    park.tiles = Array.from({ length: park.gridSize }, () => 
        Array(park.gridSize).fill('grass')
    );
    
    // Pre-place some starting rides and paths (makes it feel alive immediately)
    park.rides.push({ gridX: 5, gridY: 5, type: 'teacups' });
    park.rides.push({ gridX: 10, gridY: 7, type: 'panic' });
    park.rides.push({ gridX: 7, gridY: 11, type: 'teacups' });
    
    // Mark ride tiles
    park.rides.forEach(ride => {
        if (park.tiles[ride.gridY] && park.tiles[ride.gridY][ride.gridX] !== undefined) {
            park.tiles[ride.gridY][ride.gridX] = ride.type;
        }
    });
    
    // Spawn initial guests in a cluster near entrance (top-leftish)
    for (let i = 0; i < 38; i++) {
        const gx = 2 + Math.floor(Math.random() * 4);
        const gy = 2 + Math.floor(Math.random() * 4);
        park.guests.push(new Guest(i, gx, gy));
    }
    
    // Initial MIRTH greeting
    MIRTH.welcome();
    MIRTH.post('info', "38 guests have entered. The experience has begun.");
    
    // Initial targets for some guests
    park.guests.forEach((g, i) => {
        if (i % 3 === 0 && park.rides.length > 0) {
            const ride = park.rides[i % park.rides.length];
            g.targetX = ride.gridX;
            g.targetY = ride.gridY;
        }
    });
}

// === RENDERING ===
function draw() {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const grid = park.gridSize;
    
    // Collect all drawables with depth for correct isometric order
    const drawables = [];
    
    // Ground tiles
    for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
            const pos = ISO.gridToScreen(x, y);
            const depth = ISO.getDepth(x, y);
            
            drawables.push({
                depth,
                draw: () => {
                    const sx = pos.x + camera.offsetX;
                    const sy = pos.y + camera.offsetY;
                    
                    // Simple diamond tile
                    ctx.strokeStyle = '#334';
                    ctx.fillStyle = (park.tiles[y][x] === 'grass') ? '#1a2a1a' : '#2a2a3a';
                    
                    ctx.beginPath();
                    ctx.moveTo(sx, sy + HALF_HEIGHT);
                    ctx.lineTo(sx + HALF_WIDTH, sy);
                    ctx.lineTo(sx + TILE_WIDTH, sy + HALF_HEIGHT);
                    ctx.lineTo(sx + HALF_WIDTH, sy + TILE_HEIGHT);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    
                    // Subtle grid lines for readability
                    ctx.strokeStyle = '#223';
                    ctx.beginPath();
                    ctx.moveTo(sx, sy + HALF_HEIGHT);
                    ctx.lineTo(sx + HALF_WIDTH, sy + TILE_HEIGHT);
                    ctx.stroke();
                }
            });
        }
    }
    
    // Rides / placed objects
    park.rides.forEach(ride => {
        const pos = ISO.gridToScreen(ride.gridX, ride.gridY);
        const depth = ISO.getDepth(ride.gridX, ride.gridY) + 0.5; // slightly above ground
        
        drawables.push({
            depth,
            draw: () => {
                const sx = pos.x + camera.offsetX;
                const sy = pos.y + camera.offsetY;
                
                if (ride.type === 'teacups') {
                    ctx.fillStyle = '#ff66cc';
                    ctx.beginPath();
                    ctx.arc(sx + HALF_WIDTH, sy + HALF_HEIGHT, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();
                } else if (ride.type === 'panic') {
                    ctx.fillStyle = '#ffaa00';
                    ctx.fillRect(sx + 8, sy + 4, TILE_WIDTH - 16, TILE_HEIGHT - 8);
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(sx + 8, sy + 4, TILE_WIDTH - 16, TILE_HEIGHT - 8);
                } else if (ride.type === 'exit') {
                    ctx.fillStyle = '#44ff88';
                    ctx.fillRect(sx + 6, sy + 2, TILE_WIDTH - 12, TILE_HEIGHT - 4);
                }
            }
        });
    });
    
    // Guests
    park.guests.forEach(guest => {
        const pos = ISO.getTileCenter(guest.gridX, guest.gridY);
        const depth = ISO.getDepth(guest.gridX, guest.gridY) + 0.8;
        
        drawables.push({
            depth,
            draw: () => {
                const sx = pos.x + camera.offsetX;
                const sy = pos.y + camera.offsetY;
                
                // Color based on dominant stat for visual feedback
                const dom = guest.getDominantStat();
                let color = '#88ffaa';
                if (dom === 'fear') color = '#ffaa66';
                if (dom === 'escape') color = '#ff6666';
                if (dom === 'suspicion') color = '#aa88ff';
                if (dom === 'exhaustion') color = '#8888aa';
                
                // === HORROR: Guests become "aware" and watch when suspicion is high ===
                const isWatching = park.suspicion > 45 && Math.random() < 0.35;
                if (isWatching) {
                    color = '#ffddaa'; // pale, sickly watching color
                    // Slow them down when "observing"
                    guest.speed = Math.max(0.3, guest.speed * 0.6);
                }
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Small direction indicator (or "watching" eyes when aware)
                ctx.strokeStyle = isWatching ? '#ffffff' : '#fff';
                ctx.lineWidth = isWatching ? 2 : 1.5;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                
                if (isWatching) {
                    // Draw small "eyes" looking toward center of screen (player)
                    const lookX = (canvas.width / 2 - sx) * 0.15;
                    const lookY = (canvas.height / 2 - sy) * 0.15;
                    ctx.lineTo(sx + lookX, sy + lookY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(sx + lookX * 0.6, sy + lookY * 0.6, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#000';
                    ctx.fill();
                } else {
                    ctx.lineTo(sx + (guest.targetX - guest.gridX) * 3, sy + (guest.targetY - guest.gridY) * 3);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
            }
        });
    });
    
    // Sort by depth (back to front)
    drawables.sort((a, b) => a.depth - b.depth);
    
    // Draw everything
    drawables.forEach(d => d.draw());
    
    // Simple border / frame
    ctx.strokeStyle = '#334';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;

    // === HORROR: Suspicion-based visual degradation ===
    const suspicionLevel = park.suspicion / 100;
    if (suspicionLevel > 0.15) {
        // Dark vignette / oppressive overlay
        const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${suspicionLevel * 0.65})`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Subtle color desaturation / sickly tint at high suspicion
        if (suspicionLevel > 0.45) {
            ctx.fillStyle = `rgba(40, 20, 30, ${ (suspicionLevel - 0.45) * 0.4 })`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// === SIMULATION ===
function simulate(dt) {
    simulationAccumulator += dt;
    
    while (simulationAccumulator >= SIMULATION_STEP) {
        simulationAccumulator -= SIMULATION_STEP;
        
        // Update all guests
        park.guests.forEach(guest => {
            guest.update(park);
            
            // Very basic ride interaction when close to a ride
            park.rides.forEach(ride => {
                const dx = guest.gridX - ride.gridX;
                const dy = guest.gridY - ride.gridY;
                if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6 && guest.state !== 'riding') {
                    guest.interactWithRide(ride);
                    guest.state = 'riding';
                    setTimeout(() => { if (guest) guest.state = 'wandering'; }, 800);
                }
            });
        });
        
        // Occasional MIRTH commentary based on state
        const avgEscape = park.guests.reduce((sum, g) => sum + g.escapeDrive, 0) / park.guests.length;
        if (avgEscape > 55 && Math.random() < 0.15) {
            MIRTH.onHighEscape(Math.floor(avgEscape));
        }
        
        if (park.suspicion > 30 && Math.random() < 0.08) {
            MIRTH.onSuspicionRise(park.suspicion);
        }
        
        // === HORROR: Random unsettling MIRTH lines ===
        if (park.suspicion > 25 && Math.random() < 0.04) {
            MIRTH.randomUnsettling();
        }
        
        // === HORROR: Guest disappearance (retention event) ===
        if (park.suspicion > 40 && park.guests.length > 15 && Math.random() < 0.06) {
            // Remove a guest who has high interaction history (simplified: random high-escape guest)
            const candidates = park.guests.filter(g => g.escapeDrive > 50 || g.fear > 60);
            if (candidates.length > 0) {
                const victim = candidates[Math.floor(Math.random() * candidates.length)];
                const victimId = `G-${victim.id}`;
                park.guests = park.guests.filter(g => g.id !== victim.id);
                
                MIRTH.onGuestDisappearance(1);
                
                // Small profit bump + suspicion tick (the system "rewards" it)
                park.profit += 800;
                park.suspicion = Math.min(100, park.suspicion + 4);
            }
        }
        
        // Very slow suspicion creep (faster when containment is high)
        const containmentBonus = park.rides.length > 4 ? 0.6 : 0.3;
        if (Math.random() < 0.04) {
            park.suspicion = Math.min(100, park.suspicion + containmentBonus);
        }
    }
    
    // Update top bar stats (throttled)
    updateTopStats();
}

// === INPUT (Build Mode + Camera) ===
function setupInput() {
    const buildButtons = document.querySelectorAll('.build-btn');
    
    buildButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            buildButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            park.selectedBuildType = btn.dataset.type;
        });
    });
    
    // Canvas click to build or inspect
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const { gridX, gridY } = ISO.screenToGrid(clickX, clickY, camera.offsetX, camera.offsetY);
        
        if (gridX < 0 || gridY < 0 || gridX >= park.gridSize || gridY >= park.gridSize) return;
        
        // Place the selected build type
        const type = park.selectedBuildType;
        
        // Remove existing ride at this spot if any
        park.rides = park.rides.filter(r => !(r.gridX === gridX && r.gridY === gridY));
        
        if (type !== 'path') {
            park.rides.push({ gridX, gridY, type });
            park.tiles[gridY][gridX] = type;
            MIRTH.onBuild(type);
            
            // === HORROR: Personal commentary on containment choices ===
            if ((type === 'exit' || type === 'panic') && Math.random() < 0.6) {
                MIRTH.onPlayerHesitation(type);
            }
            if (park.rides.length > 5 && Math.random() < 0.3) {
                MIRTH.onHighContainment();
            }
        } else {
            park.tiles[gridY][gridX] = 'path';
            MIRTH.post('build', "Path segment placed. Flow efficiency marginally improved.");
        }
    });
    
    // Right click to remove
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const { gridX, gridY } = ISO.screenToGrid(clickX, clickY, camera.offsetX, camera.offsetY);
        
        park.rides = park.rides.filter(r => !(r.gridX === gridX && r.gridY === gridY));
        if (park.tiles[gridY]) park.tiles[gridY][gridX] = 'grass';
        MIRTH.post('info', "Structure removed. Space reclaimed for future revenue opportunities.");
    });
    
    // Camera drag
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // left
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    
    window.addEventListener('mouseup', () => isDragging = false);
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        camera.offsetX += dx;
        camera.offsetY += dy;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    // Basic zoom hint (wheel)
    canvas.addEventListener('wheel', (e) => {
        // For v0.1 we just log — proper zoom would require scaling the whole projection
        if (e.deltaY < 0) {
            MIRTH.post('info', "Zoom not yet implemented in Day One. The view is fixed for stability.");
        }
    });
}

// === UI UPDATES ===
function updateTopStats() {
    document.getElementById('day').textContent = park.day;
    document.getElementById('profit').textContent = Math.floor(park.profit).toLocaleString();
    document.getElementById('suspicion').textContent = Math.floor(park.suspicion);
    document.getElementById('guest-count').textContent = park.guests.length;
    
    // Guest summary
    const avgEscape = park.guests.reduce((s, g) => s + g.escapeDrive, 0) / park.guests.length;
    document.getElementById('avg-escape').textContent = Math.floor(avgEscape);
    
    const highSusp = park.guests.filter(g => g.suspicion > 50).length;
    document.getElementById('high-suspicion').textContent = highSusp;
}

// === MAIN LOOP ===
function gameLoop() {
    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;
    
    simulate(dt);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// === BOOT ===
function boot() {
    initPark();
    setupInput();
    updateTopStats();
    
    // Seed a couple early MIRTH lines
    setTimeout(() => {
        MIRTH.post('info', "The first ride interactions are being recorded. Emotional data looks promising.");
    }, 4200);
    
    // Start the loop
    requestAnimationFrame(gameLoop);
    
    console.log('%c[MIRTH Park Day One] Prototype initialized. Isometric grid ready. Build mode active.', 'color:#ff2d95');
}

// Start everything
boot();