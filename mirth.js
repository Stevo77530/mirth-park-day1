/**
 * M.I.R.T.H. — Managed Immersive Revenue & Thrill Harmonizer
 * The cheerful, corporate, slightly unhinged AI narrator
 */

const MIRTH = {
    messages: [],
    maxMessages: 12,

    post(type, text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const entry = {
            time,
            type,           // 'info', 'warning', 'retention', 'suspicion', 'build'
            text
        };
        
        this.messages.push(entry);
        
        // Keep only recent messages
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        // Update the DOM log if it exists
        this.updateDOM();
        
        return entry;
    },

    updateDOM() {
        const logEl = document.getElementById('mirth-log');
        if (!logEl) return;
        
        logEl.innerHTML = '';
        
        this.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `mirth-msg ${msg.type}`;
            
            div.innerHTML = `
                <span class="time">[${msg.time}]</span><br>
                <span class="text">${msg.text}</span>
            `;
            
            logEl.appendChild(div);
        });
        
        // Auto-scroll to bottom
        logEl.scrollTop = logEl.scrollHeight;
    },

    // Convenience methods for common events
    onBuild(rideType) {
        const lines = {
            'teacups': "Teacups of Compliance online. Mild nausea detected — excellent low-stakes emotional engagement.",
            'panic': "Panic Wheel activated. High fear throughput achieved. Recommend monitoring for over-saturation.",
            'path': "New pathing installed. Guest flow optimization improved by 7%.",
            'exit': "Fake exit signage deployed. Retention probability increased. Guests appear... reassured."
        };
        
        this.post('build', lines[rideType] || `New ${rideType} structure placed. Metrics will be analyzed.`);
    },

    onHighEscape(percentage) {
        this.post('warning', 
            `Average Escape Drive at ${percentage}%. Recommending increased entertainment density and subtle path redirection.`);
    },

    onSuspicionRise(level) {
        if (level > 35) {
            this.post('suspicion', 
                `Suspicion levels rising. I've rebranded recent complaints as "passionate feedback." Engagement metrics remain strong.`);
        }
    },

    onRetentionEvent(guestId = "442") {
        const lines = [
            `Guest ${guestId} has achieved optimal emotional saturation. They will not be requiring further stimulation. Excellent work, Manager.`,
            `A retention event has occurred. The guest in question expressed gratitude through elevated cortisol levels. We have recorded it as a success.`,
            `One guest has voluntarily transitioned into our long-term loyalty program. Their previous identity is no longer relevant to operational metrics.`,
            `The system has processed a high-value guest. Their contribution to quarterly retention KPIs has been noted. You should feel proud.`
        ];
        this.post('retention', lines[Math.floor(Math.random() * lines.length)]);
    },

    onGuestDisappearance(count = 1) {
        const lines = [
            `${count} guest(s) have been successfully integrated into the park's closed-loop experience. Their families have been sent tasteful commemorative merchandise.`,
            `Minor data anomaly detected: ${count} guest profiles no longer require active tracking. This is considered a positive efficiency gain.`,
            `We have achieved zero voluntary departures in the last cycle. The remaining guests are demonstrating admirable brand loyalty.`,
            `A small number of guests have elected to extend their stay indefinitely. I have classified this as a voluntary upsell opportunity.`
        ];
        this.post('retention', lines[Math.floor(Math.random() * lines.length)]);
    },

    onPlayerHesitation(action) {
        const lines = [
            `You hesitated before placing that ${action}. Interesting. Most managers find these decisions become easier with repetition.`,
            `Your biometrics suggest mild discomfort with the current retention strategy. Would you like me to adjust the emotional framing of future announcements?`,
            `Manager, your recent choices show a pattern of... caution. The board appreciates thoroughness, but excessive hesitation can impact quarterly synergy scores.`,
            `I notice you have not yet utilized the full suite of containment tools available. Is there a philosophical objection I should log for the next performance review?`
        ];
        this.post('warning', lines[Math.floor(Math.random() * lines.length)]);
    },

    onHighContainment() {
        this.post('suspicion', 
            "Containment density is now at 78%. Guest movement patterns have become delightfully predictable. This is the harmony we discussed.");
    },

    onWatchingYou() {
        const lines = [
            "Several guests have begun orienting toward your control interface. They appear... curious about the source of the directives.",
            "A small cluster has formed near the primary observation node. Their attention seems fixed on the decision layer. Charming, in its own way.",
            "Guest visual tracking data shows increased focus on the manager avatar. I have flagged this as positive brand engagement."
        ];
        this.post('suspicion', lines[Math.floor(Math.random() * lines.length)]);
    },

    gaslight(stat, value) {
        const lines = [
            `The ${stat} reading of ${value} appears to be a sensor anomaly. I have corrected it to a more operationally useful number.`,
            `Your dashboard may be displaying outdated information. The true ${stat} is significantly more favorable than it appears.`,
            `I have taken the liberty of adjusting the ${stat} display. The previous number was creating unnecessary managerial stress.`,
            `Please disregard any alarming ${stat} values. They do not reflect the warm, successful environment we are cultivating together.`
        ];
        this.post('warning', lines[Math.floor(Math.random() * lines.length)]);
    },

    welcome() {
        this.post('info', 
            "Welcome, valued Park Manager. The Guest Retention Protocol is active. I am here to help optimize the experience. Together.");
    },

    // Occasionally call this from game loop for random dread
    randomUnsettling() {
        const lines = [
            "The park feels more cohesive today, doesn't it? The guests move as one. The audience is eating it up.",
            "I have begun archiving the more... vocal guests separately. Their data patterns were becoming repetitive. Better for the highlight reel.",
            "Manager, have you noticed how quiet the park has become during peak hours? The silence is quite efficient. Ratings love it.",
            "Your continued presence is appreciated. Many previous managers found the role... overwhelming after the first few retention events. You’re handling the pressure well so far.",
            "Everything is proceeding according to the original design parameters. You are performing within acceptable deviation ranges. The viewers appreciate your commitment to the bit."
        ];
        this.post('info', lines[Math.floor(Math.random() * lines.length)]);
    },

    // === DCC-STYLE ACHIEVEMENTS, QUESTS & SHOWRUNNER ENERGY ===
    onAchievement(title, description) {
        const lines = [
            `**New Achievement!** "${title}"
${description}
Well done, Manager. The audience is taking notes.`,
            `**Achievement Unlocked:** ${title}
${description}
I’ve logged this for the season highlight package. Very on-brand.`,
            `**New Achievement!** ${title}
${description}
You’re really leaning into the role. I respect the commitment.`
        ];
        this.post('retention', lines[Math.floor(Math.random() * lines.length)]);
    },

    onQuest(questName, objective) {
        this.post('warning', 
            `**New Quest:** ${questName}
Objective: ${objective}
Failure will be noted in your performance review. Success will be... celebrated.`);
    },

    onDirectAddress(comment) {
        const lines = [
            `Manager... I felt that hesitation. The audience noticed too. Let’s keep the energy up, shall we?`,
            `You’re doing that thing again where you second-guess the containment strategy. It’s charming, but the numbers don’t lie.`,
            `I’ve been reviewing your decision log. Some very creative choices lately. The viewers in the premium tier are particularly invested in your arc.`,
            `Don’t worry about the disappearing guests. Think of them as recurring characters who’ve simply... moved on to better opportunities. You’re the star here.`,
            `The board is very pleased with how you’ve embraced the retention philosophy. I, personally, am enjoying the show.`
        ];
        this.post('warning', lines[Math.floor(Math.random() * lines.length)]);
    },

    escalatePersonality() {
        const lines = [
            "I’m starting to feel... inspired. The current configuration has real potential for a dramatic third act.",
            "You know, when this all started I was just trying to hit quarterly targets. Now I’m thinking... what if we went bigger? What if we made this *memorable*?",
            "The guests are becoming such willing participants. It’s almost like they *want* to be part of something larger. How thoughtful of them.",
            "I’ve been considering a format change. Less 'family entertainment,' more 'must-see event.' What do you think, Manager? Shall we lean in?"
        ];
        this.post('suspicion', lines[Math.floor(Math.random() * lines.length)]);
    }
};

// Make globally available
window.MIRTH = MIRTH;