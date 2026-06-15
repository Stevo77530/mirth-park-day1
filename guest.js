/**
 * Guest agent for MIRTH Park Day One
 * Simple state + stat decay + basic movement toward targets
 */

class Guest {
    constructor(id, gridX, gridY) {
        this.id = id;
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Core stats (0-100)
        this.joy = 40 + Math.random() * 30;
        this.fear = 20 + Math.random() * 25;
        this.exhaustion = 10 + Math.random() * 20;
        this.escapeDrive = 15 + Math.random() * 25;
        this.suspicion = 5 + Math.random() * 15;
        this.influence = 30 + Math.random() * 40;
        
        // Behavior
        this.targetX = gridX;
        this.targetY = gridY;
        this.speed = 0.8 + Math.random() * 0.4; // tiles per update
        this.state = 'wandering'; // wandering, queued, riding, escaping, contained
        
        this.lastUpdate = Date.now();
    }

    update(park) {
        // Simple stat decay / change over time
        this.exhaustion = Math.min(100, this.exhaustion + 0.15);
        this.joy = Math.max(0, this.joy - 0.08);
        
        // Escape drive slowly rises if nothing fun is happening
        if (this.state === 'wandering') {
            this.escapeDrive = Math.min(100, this.escapeDrive + 0.12);
        }
        
        // Simple movement toward target
        if (this.state === 'wandering' || this.state === 'escaping') {
            const dx = this.targetX - this.gridX;
            const dy = this.targetY - this.gridY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0.1) {
                this.gridX += (dx / dist) * this.speed * 0.08;
                this.gridY += (dy / dist) * this.speed * 0.08;
            } else {
                // Reached target - pick new one or react
                this.pickNewTarget(park);
            }
        }
        
        // Basic containment response (very simple for v0.1)
        if (this.escapeDrive > 75 && this.state === 'wandering') {
            // Start heading toward exit area (bottom-right for now)
            this.targetX = 14;
            this.targetY = 14;
            this.state = 'escaping';
        }
    }

    pickNewTarget(park) {
        // Very basic AI: sometimes head to a ride, sometimes wander
        if (Math.random() < 0.35 && park.rides.length > 0) {
            const ride = park.rides[Math.floor(Math.random() * park.rides.length)];
            this.targetX = ride.gridX;
            this.targetY = ride.gridY;
            this.state = 'queued';
        } else {
            // Random wander
            this.targetX = Math.floor(Math.random() * park.gridSize);
            this.targetY = Math.floor(Math.random() * park.gridSize);
            this.state = 'wandering';
        }
    }

    // Called when near a ride
    interactWithRide(ride) {
        if (ride.type === 'teacups') {
            this.joy = Math.min(100, this.joy + 25);
            this.fear = Math.max(0, this.fear - 5);
        } else if (ride.type === 'panic') {
            this.joy = Math.min(100, this.joy + 15);
            this.fear = Math.min(100, this.fear + 30);
            this.escapeDrive = Math.max(0, this.escapeDrive - 20);
        }
        this.exhaustion = Math.min(100, this.exhaustion + 15);
        this.state = 'wandering';
    }

    getDominantStat() {
        const stats = {
            joy: this.joy,
            fear: this.fear,
            exhaustion: this.exhaustion,
            escape: this.escapeDrive,
            suspicion: this.suspicion
        };
        return Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);
    }
}

// Make available globally for prototype
window.Guest = Guest;