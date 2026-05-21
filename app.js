// PersonaTrack - Advanced Personality Tracking System
class PersonaTrack {
    constructor() {
        this.entries = this.loadData('entries') || [];
        this.goals = this.loadData('goals') || [];
        this.traits = this.loadData('traits') || [];
        this.selectedMood = null;
        this.selectedActivities = new Set();
        this.currentView = 'dashboard';
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupNavigation();
        this.setupEventListeners();
        
        // Setup optional features with error handling
        try {
            this.setupVoiceRecording();
        } catch (e) {
            console.log('Voice recording not available');
        }
        
        try {
            this.setupPhotoUpload();
        } catch (e) {
            console.log('Photo upload not available');
        }
        
        try {
            this.setupLocationDetection();
        } catch (e) {
            console.log('Location detection not available');
        }
        
        this.renderDashboard();
        this.showView('dashboard');
    }

    applyTheme() {
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view);
            });
        });

        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('collapsed');
        });

        // Add hamburger menu button for when sidebar is collapsed
        this.createHamburgerMenu();

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', this.theme);
            this.applyTheme();
            document.getElementById('themeToggle').textContent = 
                this.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }

    createHamburgerMenu() {
        // Create hamburger button that appears when sidebar is collapsed
        const hamburger = document.createElement('button');
        hamburger.id = 'hamburgerMenu';
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = '☰';
        document.body.appendChild(hamburger);

        hamburger.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('collapsed');
        });
    }

    setupEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-btn-large').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e.target));
        });

        // Sliders
        ['energy', 'productivity', 'social', 'wellbeing'].forEach(type => {
            const slider = document.getElementById(`${type}Level`) || 
                          document.getElementById(`${type}Score`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    document.getElementById(`${type}Value`).textContent = e.target.value;
                });
            }
        });

        // Activity tags
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleActivity(e.target));
        });

        // Save entry
        document.getElementById('saveAdvancedEntry').addEventListener('click', () => {
            this.saveAdvancedEntry();
        });

        // Personality traits
        ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'stability'].forEach(trait => {
            const slider = document.getElementById(`trait${trait.charAt(0).toUpperCase() + trait.slice(1)}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    document.getElementById(`${trait}Value`).textContent = e.target.value;
                });
            }
        });

        document.getElementById('saveTraits')?.addEventListener('click', () => {
            this.savePersonalityTraits();
        });

        // Goals
        document.getElementById('addGoal')?.addEventListener('click', () => {
            this.addGoal();
        });

        // Export/Import
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJSON')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('importData')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importJSON(e.target.files[0]);
        });

        // Timeline
        document.getElementById('timelineFilter')?.addEventListener('change', (e) => {
            this.renderTimeline(e.target.value);
        });
        document.getElementById('timelineSearch')?.addEventListener('input', (e) => {
            this.searchTimeline(e.target.value);
        });

        // Compare
        document.getElementById('compareBtn')?.addEventListener('click', () => {
            this.renderCompare();
        });

        // Habits
        document.getElementById('addHabit')?.addEventListener('click', () => {
            this.addHabit();
        });

        // Reports
        document.getElementById('shareReport')?.addEventListener('click', () => {
            this.shareReport();
        });
    }

    showView(viewName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');
        this.currentView = viewName;

        // Render view-specific content
        switch(viewName) {
            case 'dashboard': this.renderDashboard(); break;
            case 'personality': this.renderPersonality(); break;
            case 'patterns': this.renderPatterns(); break;
            case 'goals': this.renderGoals(); break;
            case 'insights': this.renderInsights(); break;
            case 'timeline': this.renderTimeline(); break;
            case 'calendar': this.renderCalendar(); break;
            case 'achievements': this.renderAchievements(); break;
            case 'compare': this.renderCompare(); break;
            case 'habits': this.renderHabits(); break;
            case 'predictions': this.renderPredictions(); break;
            case 'reports': this.renderReports(); break;
        }
        
        this.updateSidebarStats();
    }

    selectMood(btn) {
        document.querySelectorAll('.mood-btn-large').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMood = btn.dataset.mood;
        document.getElementById('entryFormAdvanced').style.display = 'block';
    }

    toggleActivity(btn) {
        const activity = btn.dataset.activity;
        if (this.selectedActivities.has(activity)) {
            this.selectedActivities.delete(activity);
            btn.classList.remove('selected');
        } else {
            this.selectedActivities.add(activity);
            btn.classList.add('selected');
        }
    }

    saveAdvancedEntry() {
        if (!this.selectedMood) {
            this.showNotification('Please select a mood first!', 'warning');
            return;
        }

        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            mood: this.selectedMood,
            energy: parseInt(document.getElementById('energyLevel').value),
            productivity: parseInt(document.getElementById('productivityLevel').value),
            social: parseInt(document.getElementById('socialLevel').value),
            wellbeing: parseInt(document.getElementById('wellbeingScore').value),
            activities: Array.from(this.selectedActivities),
            notes: document.getElementById('entryNotes').value,
            tags: document.getElementById('entryTags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        this.entries.unshift(entry);
        this.saveData('entries', this.entries);
        
        // Check for achievements
        const newAchievements = this.checkNewAchievements();
        if (newAchievements.length > 0) {
            this.triggerConfetti();
            this.showNotification(`🎉 Achievement Unlocked: ${newAchievements[0].title}!`, 'success');
        } else {
            this.showNotification('Entry saved successfully! 🎉', 'success');
        }
        
        this.resetEntryForm();
        this.showView('dashboard');
    }

    checkNewAchievements() {
        // Simple achievement check - can be expanded
        const newAchievements = [];
        const totalEntries = this.entries.length;
        
        if (totalEntries === 1 || totalEntries === 10 || totalEntries === 50 || totalEntries === 100) {
            newAchievements.push({ title: 'Milestone Reached' });
        }
        
        return newAchievements;
    }

    resetEntryForm() {
        document.querySelectorAll('.mood-btn-large').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('energyLevel').value = 5;
        document.getElementById('productivityLevel').value = 5;
        document.getElementById('socialLevel').value = 5;
        document.getElementById('wellbeingScore').value = 5;
        document.getElementById('entryNotes').value = '';
        document.getElementById('entryTags').value = '';
        this.selectedMood = null;
        this.selectedActivities.clear();
        document.getElementById('entryFormAdvanced').style.display = 'none';
    }

    renderDashboard() {
        // Quick stats
        document.getElementById('dashTotalEntries').textContent = this.entries.length;
        
        const avgWellbeing = this.entries.length > 0 
            ? (this.entries.reduce((sum, e) => sum + e.wellbeing, 0) / this.entries.length).toFixed(1)
            : '-';
        document.getElementById('dashAvgScore').textContent = avgWellbeing;
        
        document.getElementById('dashStreak').textContent = this.calculateStreak();
        
        const completedGoals = this.goals.filter(g => g.completed).length;
        document.getElementById('dashGoals').textContent = `${completedGoals}/${this.goals.length}`;

        // Recent entries
        this.renderRecentEntries();
        
        // Charts
        this.renderMoodTrendChart();
        this.renderPersonalityRadar();
        
        // Insights
        this.renderDashboardInsights();
    }

    renderRecentEntries() {
        const container = document.getElementById('dashRecentEntries');
        const recent = this.entries.slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No entries yet</p>';
            return;
        }

        container.innerHTML = recent.map(entry => `
            <div class="mini-entry">
                <span class="mini-mood">${this.getMoodEmoji(entry.mood)}</span>
                <div class="mini-info">
                    <span class="mini-score">${entry.wellbeing}/10</span>
                    <span class="mini-date">${this.formatRelativeDate(entry.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    renderMoodTrendChart() {
        const canvas = document.getElementById('dashMoodTrend');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        const last30Days = this.getLast30DaysData();
        this.drawLineChart(ctx, canvas, last30Days, 'wellbeing');
    }

    renderPersonalityRadar() {
        const canvas = document.getElementById('personalityRadar');
        if (!canvas || this.traits.length === 0) {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.offsetWidth;
                canvas.height = 200;
                ctx.fillStyle = '#64748b';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Complete personality assessment first', canvas.width / 2, canvas.height / 2);
            }
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        const latestTraits = this.traits[this.traits.length - 1];
        this.drawRadarChart(ctx, canvas, latestTraits);
    }

    drawLineChart(ctx, canvas, data, key) {
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = canvas.height - padding - (chartHeight / 10 * i);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Draw line
        if (data.length > 1) {
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();

            const pointSpacing = chartWidth / (data.length - 1);
            data.forEach((point, index) => {
                if (point[key] !== null) {
                    const x = padding + (index * pointSpacing);
                    const y = canvas.height - padding - (point[key] / 10 * chartHeight);
                    
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points
            ctx.fillStyle = '#6366f1';
            data.forEach((point, index) => {
                if (point[key] !== null) {
                    const x = padding + (index * pointSpacing);
                    const y = canvas.height - padding - (point[key] / 10 * chartHeight);
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    }

    drawRadarChart(ctx, canvas, traits) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        const labels = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Stability'];
        const values = [
            traits.openness, traits.conscientiousness, traits.extraversion,
            traits.agreeableness, traits.stability
        ];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background circles
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axes
        const angleStep = (Math.PI * 2) / 5;
        ctx.strokeStyle = '#cbd5e1';
        for (let i = 0; i < 5; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw labels
            ctx.fillStyle = '#475569';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            const labelX = centerX + Math.cos(angle) * (radius + 30);
            const labelY = centerY + Math.sin(angle) * (radius + 30);
            ctx.fillText(labels[i], labelX, labelY);
        }

        // Draw data polygon
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const value = values[i] / 10;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    renderDashboardInsights() {
        const container = document.getElementById('dashInsights');
        const insights = this.generateInsights().slice(0, 3);
        
        if (insights.length === 0) {
            container.innerHTML = '<p class="empty-state">Add more entries to see insights</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <span class="insight-icon">${insight.icon}</span>
                <p>${insight.text}</p>
            </div>
        `).join('');
    }

    generateInsights() {
        if (this.entries.length < 3) return [];

        const insights = [];
        const recent = this.entries.slice(0, 7);

        // Average wellbeing trend
        const avgWellbeing = recent.reduce((sum, e) => sum + e.wellbeing, 0) / recent.length;
        if (avgWellbeing >= 7) {
            insights.push({
                icon: '🌟',
                text: `Your wellbeing has been great this week (${avgWellbeing.toFixed(1)}/10)!`
            });
        } else if (avgWellbeing < 5) {
            insights.push({
                icon: '💙',
                text: `Your wellbeing is lower than usual. Consider self-care activities.`
            });
        }

        // Activity correlation
        const activityScores = {};
        this.entries.forEach(entry => {
            entry.activities?.forEach(activity => {
                if (!activityScores[activity]) activityScores[activity] = [];
                activityScores[activity].push(entry.wellbeing);
            });
        });

        let bestActivity = null;
        let bestScore = 0;
        Object.keys(activityScores).forEach(activity => {
            const avg = activityScores[activity].reduce((a, b) => a + b, 0) / activityScores[activity].length;
            if (avg > bestScore) {
                bestScore = avg;
                bestActivity = activity;
            }
        });

        if (bestActivity) {
            insights.push({
                icon: '🎯',
                text: `${bestActivity} activities correlate with your highest wellbeing scores!`
            });
        }

        // Streak motivation
        const streak = this.calculateStreak();
        if (streak >= 7) {
            insights.push({
                icon: '🔥',
                text: `Amazing! You've maintained a ${streak}-day tracking streak!`
            });
        }

        // Energy patterns
        const avgEnergy = recent.reduce((sum, e) => sum + (e.energy || 5), 0) / recent.length;
        if (avgEnergy < 4) {
            insights.push({
                icon: '⚡',
                text: 'Your energy levels are low. Prioritize rest and nutrition.'
            });
        }

        return insights;
    }

    savePersonalityTraits() {
        const traits = {
            timestamp: new Date().toISOString(),
            openness: parseInt(document.getElementById('traitOpenness').value),
            conscientiousness: parseInt(document.getElementById('traitConscientiousness').value),
            extraversion: parseInt(document.getElementById('traitExtraversion').value),
            agreeableness: parseInt(document.getElementById('traitAgreeableness').value),
            stability: parseInt(document.getElementById('traitStability').value)
        };

        this.traits.push(traits);
        this.saveData('traits', this.traits);
        this.showNotification('Personality assessment saved!', 'success');
        this.renderPersonality();
    }

    renderPersonality() {
        if (this.traits.length > 0) {
            const latest = this.traits[this.traits.length - 1];
            document.getElementById('traitOpenness').value = latest.openness;
            document.getElementById('traitConscientiousness').value = latest.conscientiousness;
            document.getElementById('traitExtraversion').value = latest.extraversion;
            document.getElementById('traitAgreeableness').value = latest.agreeableness;
            document.getElementById('traitStability').value = latest.stability;
            
            document.getElementById('opennessValue').textContent = latest.openness;
            document.getElementById('conscientiousnessValue').textContent = latest.conscientiousness;
            document.getElementById('extraversionValue').textContent = latest.extraversion;
            document.getElementById('agreeablenessValue').textContent = latest.agreeableness;
            document.getElementById('stabilityValue').textContent = latest.stability;
        }

        this.renderTraitHistory();
    }

    renderTraitHistory() {
        const canvas = document.getElementById('traitHistoryChart');
        if (!canvas || this.traits.length === 0) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 300;

        // Draw multi-line chart for trait history
        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = canvas.height - padding - (chartHeight / 10 * i);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'stability'];
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

        traits.forEach((trait, idx) => {
            ctx.strokeStyle = colors[idx];
            ctx.lineWidth = 2;
            ctx.beginPath();

            const pointSpacing = chartWidth / Math.max(this.traits.length - 1, 1);
            this.traits.forEach((data, index) => {
                const x = padding + (index * pointSpacing);
                const y = canvas.height - padding - (data[trait] / 10 * chartHeight);
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        });

        // Legend
        ctx.font = '11px sans-serif';
        traits.forEach((trait, idx) => {
            ctx.fillStyle = colors[idx];
            const x = padding + (idx * 100);
            ctx.fillRect(x, 10, 15, 15);
            ctx.fillStyle = '#475569';
            ctx.fillText(trait, x + 20, 20);
        });
    }

    renderPatterns() {
        this.renderTimeOfDayPattern();
        this.renderDayOfWeekPattern();
        this.renderActivityCorrelation();
        this.renderMoodTriggers();
    }

    renderTimeOfDayPattern() {
        const canvas = document.getElementById('timeOfDayChart');
        if (!canvas || this.entries.length === 0) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        const timeSlots = { morning: [], afternoon: [], evening: [], night: [] };
        
        this.entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (hour >= 6 && hour < 12) timeSlots.morning.push(entry.wellbeing);
            else if (hour >= 12 && hour < 17) timeSlots.afternoon.push(entry.wellbeing);
            else if (hour >= 17 && hour < 22) timeSlots.evening.push(entry.wellbeing);
            else timeSlots.night.push(entry.wellbeing);
        });

        const averages = Object.keys(timeSlots).map(slot => {
            const scores = timeSlots[slot];
            return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        });

        this.drawBarChart(ctx, canvas, ['Morning', 'Afternoon', 'Evening', 'Night'], averages);
    }

    renderDayOfWeekPattern() {
        const canvas = document.getElementById('dayOfWeekChart');
        if (!canvas || this.entries.length === 0) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayScores = Array(7).fill(null).map(() => []);

        this.entries.forEach(entry => {
            const day = new Date(entry.timestamp).getDay();
            dayScores[day].push(entry.wellbeing);
        });

        const averages = dayScores.map(scores => 
            scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        );

        this.drawBarChart(ctx, canvas, days, averages);
    }

    drawBarChart(ctx, canvas, labels, values) {
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / labels.length - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bars
        values.forEach((value, index) => {
            const barHeight = (value / 10) * chartHeight;
            const x = padding + (index * (chartWidth / labels.length)) + 5;
            const y = canvas.height - padding - barHeight;

            ctx.fillStyle = '#6366f1';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = '#475569';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - padding + 20);
            
            // Value
            if (value > 0) {
                ctx.fillText(value.toFixed(1), x + barWidth / 2, y - 5);
            }
        });
    }

    renderActivityCorrelation() {
        const container = document.getElementById('activityCorrelation');
        if (this.entries.length === 0) {
            container.innerHTML = '<p class="empty-state">No data yet</p>';
            return;
        }

        const activityScores = {};
        this.entries.forEach(entry => {
            entry.activities?.forEach(activity => {
                if (!activityScores[activity]) activityScores[activity] = [];
                activityScores[activity].push(entry.wellbeing);
            });
        });

        const correlations = Object.keys(activityScores).map(activity => ({
            activity,
            avg: activityScores[activity].reduce((a, b) => a + b, 0) / activityScores[activity].length,
            count: activityScores[activity].length
        })).sort((a, b) => b.avg - a.avg);

        container.innerHTML = correlations.map(item => `
            <div class="correlation-item">
                <span class="correlation-name">${item.activity}</span>
                <div class="correlation-bar">
                    <div class="correlation-fill" style="width: ${item.avg * 10}%"></div>
                </div>
                <span class="correlation-score">${item.avg.toFixed(1)}</span>
            </div>
        `).join('') || '<p class="empty-state">No activities tracked</p>';
    }

    renderMoodTriggers() {
        const container = document.getElementById('moodTriggers');
        if (this.entries.length < 5) {
            container.innerHTML = '<p class="empty-state">Need more data to identify triggers</p>';
            return;
        }

        const triggers = [];
        
        // Analyze tags for high/low moods
        const highMoodTags = new Set();
        const lowMoodTags = new Set();

        this.entries.forEach(entry => {
            if (entry.wellbeing >= 7) {
                entry.tags?.forEach(tag => highMoodTags.add(tag));
            } else if (entry.wellbeing <= 4) {
                entry.tags?.forEach(tag => lowMoodTags.add(tag));
            }
        });

        if (highMoodTags.size > 0) {
            triggers.push({
                type: 'positive',
                text: `Positive triggers: ${Array.from(highMoodTags).slice(0, 3).join(', ')}`
            });
        }

        if (lowMoodTags.size > 0) {
            triggers.push({
                type: 'negative',
                text: `Watch out for: ${Array.from(lowMoodTags).slice(0, 3).join(', ')}`
            });
        }

        container.innerHTML = triggers.map(trigger => `
            <div class="trigger-item ${trigger.type}">
                <span class="trigger-icon">${trigger.type === 'positive' ? '✅' : '⚠️'}</span>
                <p>${trigger.text}</p>
            </div>
        `).join('') || '<p class="empty-state">No clear triggers identified yet</p>';
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        if (this.goals.length === 0) {
            container.innerHTML = '<p class="empty-state">No goals yet. Create your first goal!</p>';
            return;
        }

        container.innerHTML = this.goals.map(goal => `
            <div class="goal-card ${goal.completed ? 'completed' : ''}">
                <div class="goal-header">
                    <h4>${goal.title}</h4>
                    <button class="goal-toggle" data-id="${goal.id}">
                        ${goal.completed ? '✅' : '⭕'}
                    </button>
                </div>
                <p>${goal.description}</p>
                <div class="goal-meta">
                    <span class="goal-category">${goal.category}</span>
                    <span class="goal-deadline">${new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        // Add toggle listeners
        document.querySelectorAll('.goal-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const goal = this.goals.find(g => g.id === id);
                if (goal) {
                    goal.completed = !goal.completed;
                    this.saveData('goals', this.goals);
                    this.renderGoals();
                    this.renderDashboard();
                }
            });
        });
    }

    addGoal() {
        const title = document.getElementById('goalTitle').value;
        const description = document.getElementById('goalDescription').value;
        const category = document.getElementById('goalCategory').value;
        const deadline = document.getElementById('goalDeadline').value;

        if (!title || !deadline) {
            this.showNotification('Please fill in title and deadline', 'warning');
            return;
        }

        const goal = {
            id: Date.now(),
            title, description, category, deadline,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.goals.push(goal);
        this.saveData('goals', this.goals);
        this.showNotification('Goal added!', 'success');
        
        // Clear form
        document.getElementById('goalTitle').value = '';
        document.getElementById('goalDescription').value = '';
        document.getElementById('goalDeadline').value = '';
        
        this.renderGoals();
    }

    renderInsights() {
        const container = document.getElementById('insightsContainer');
        const insights = this.generateInsights();

        if (insights.length === 0) {
            container.innerHTML = '<p class="empty-state">Add more entries to generate insights</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon-large">${insight.icon}</span>
                    <h3>${insight.title || 'Insight'}</h3>
                </div>
                <p>${insight.text}</p>
            </div>
        `).join('');
    }

    renderTimeline(filter = 'all') {
        const container = document.getElementById('timelineContainer');
        let filtered = [...this.entries];

        const now = new Date();
        if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(e => new Date(e.timestamp) >= weekAgo);
        } else if (filter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(e => new Date(e.timestamp) >= monthAgo);
        } else if (filter === 'year') {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(e => new Date(e.timestamp) >= yearAgo);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No entries found</p>';
            return;
        }

        container.innerHTML = filtered.map(entry => `
            <div class="timeline-entry">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-mood">${this.getMoodEmoji(entry.mood)}</span>
                        <span class="timeline-score">${entry.wellbeing}/10</span>
                        <span class="timeline-date">${this.formatFullDate(entry.timestamp)}</span>
                    </div>
                    ${entry.notes ? `<p class="timeline-notes">${entry.notes}</p>` : ''}
                    <div class="timeline-meta">
                        <span>⚡ Energy: ${entry.energy}/10</span>
                        <span>📊 Productivity: ${entry.productivity}/10</span>
                        <span>👥 Social: ${entry.social}/10</span>
                    </div>
                    ${entry.activities && entry.activities.length > 0 ? `
                        <div class="timeline-activities">
                            ${entry.activities.map(a => `<span class="activity-badge">${a}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    searchTimeline(query) {
        if (!query) {
            this.renderTimeline();
            return;
        }

        const filtered = this.entries.filter(entry => 
            entry.notes?.toLowerCase().includes(query.toLowerCase()) ||
            entry.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
            entry.activities?.some(act => act.toLowerCase().includes(query.toLowerCase()))
        );

        const container = document.getElementById('timelineContainer');
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No matching entries found</p>';
            return;
        }

        container.innerHTML = filtered.map(entry => `
            <div class="timeline-entry">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-mood">${this.getMoodEmoji(entry.mood)}</span>
                        <span class="timeline-score">${entry.wellbeing}/10</span>
                        <span class="timeline-date">${this.formatFullDate(entry.timestamp)}</span>
                    </div>
                    ${entry.notes ? `<p class="timeline-notes">${entry.notes}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    exportCSV() {
        if (this.entries.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        const headers = ['Date', 'Mood', 'Wellbeing', 'Energy', 'Productivity', 'Social', 'Activities', 'Notes', 'Tags'];
        const rows = this.entries.map(entry => [
            new Date(entry.timestamp).toLocaleString(),
            entry.mood,
            entry.wellbeing,
            entry.energy,
            entry.productivity,
            entry.social,
            entry.activities?.join(';') || '',
            entry.notes?.replace(/,/g, ';') || '',
            entry.tags?.join(';') || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        this.downloadFile(csv, 'personatrack-export.csv', 'text/csv');
        this.showNotification('CSV exported successfully!', 'success');
    }

    exportJSON() {
        const data = {
            entries: this.entries,
            goals: this.goals,
            traits: this.traits,
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'personatrack-backup.json', 'application/json');
        this.showNotification('Backup created successfully!', 'success');
    }

    importJSON(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('This will replace all current data. Continue?')) {
                    this.entries = data.entries || [];
                    this.goals = data.goals || [];
                    this.traits = data.traits || [];
                    this.saveData('entries', this.entries);
                    this.saveData('goals', this.goals);
                    this.saveData('traits', this.traits);
                    this.showNotification('Data imported successfully!', 'success');
                    this.renderDashboard();
                }
            } catch (error) {
                this.showNotification('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    getLast30DaysData() {
        const data = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dayEntries = this.entries.filter(e => {
                const entryDate = new Date(e.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === date.getTime();
            });

            const avgWellbeing = dayEntries.length > 0
                ? dayEntries.reduce((sum, e) => sum + e.wellbeing, 0) / dayEntries.length
                : null;

            data.push({ date, wellbeing: avgWellbeing });
        }

        return data;
    }

    calculateStreak() {
        if (this.entries.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedEntries = [...this.entries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        for (let i = 0; i < sortedEntries.length; i++) {
            const entryDate = new Date(sortedEntries[i].timestamp);
            entryDate.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);

            if (entryDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else if (entryDate.getTime() < expectedDate.getTime()) {
                break;
            }
        }

        return streak;
    }

    getMoodEmoji(mood) {
        const emojis = {
            ecstatic: '🤩', happy: '😊', content: '😌', neutral: '😐',
            anxious: '😰', sad: '😢', angry: '😠', tired: '😴'
        };
        return emojis[mood] || '😐';
    }

    formatRelativeDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    formatFullDate(timestamp) {
        return new Date(timestamp).toLocaleString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        const gradients = {
            success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${gradients[type]}; color: white;
            padding: 18px 28px; border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; align-items: center; gap: 12px;
            font-weight: 600; font-size: 1rem;
            backdrop-filter: blur(10px);
        `;
        notification.innerHTML = `<span style="font-size: 1.5rem;">${icons[type]}</span> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => notification.remove(), 400);
        }, 3500);
    }

    loadData(key) {
        const stored = localStorage.getItem(`personatrack_${key}`);
        return stored ? JSON.parse(stored) : null;
    }

    saveData(key, data) {
        localStorage.setItem(`personatrack_${key}`, JSON.stringify(data));
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Remove welcome screen after 2 seconds
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }, 2000);

    new PersonaTrack();
});


// Add scroll to top button
function addScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.innerHTML = '↑';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
}

// Add particles effect
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Initialize effects
document.addEventListener('DOMContentLoaded', () => {
    addScrollToTop();
    createParticles();
});


// Mouse tracking for card hover effects
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.dashboard-card, .quick-stat-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });
});

// Add ripple effect to buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-primary, .btn-primary-large, .btn-secondary')) {
        e.target.classList.add('ripple');
        setTimeout(() => e.target.classList.remove('ripple'), 600);
    }
});

// Smooth reveal animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements when they're added to DOM
const observeElements = () => {
    document.querySelectorAll('.dashboard-card, .quick-stat-card, .entry-card-large').forEach(el => {
        observer.observe(el);
    });
};

// Call after DOM updates
setTimeout(observeElements, 100);


    renderCalendar() {
        const container = document.getElementById('calendarHeatmap');
        if (!container) {
            console.log('Calendar container not found');
            return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[month]} ${year}`;
        }

        // Get days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        let html = '<div class="calendar-grid">';
        
        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Empty cells for first week
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days with data
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            const dayEntries = this.entries.filter(e => {
                const entryDate = new Date(e.timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === date.getTime();
            });

            const avgWellbeing = dayEntries.length > 0
                ? dayEntries.reduce((sum, e) => sum + e.wellbeing, 0) / dayEntries.length
                : 0;

            const intensity = avgWellbeing > 0 ? Math.ceil(avgWellbeing / 2) : 0;
            const mood = dayEntries.length > 0 ? this.getMoodEmoji(dayEntries[0].mood) : '';

            html += `
                <div class="calendar-day intensity-${intensity}" 
                     data-date="${date.toISOString()}"
                     data-wellbeing="${avgWellbeing.toFixed(1)}"
                     data-entries="${dayEntries.length}">
                    <span class="day-number">${day}</span>
                    ${mood ? `<span class="day-mood">${mood}</span>` : ''}
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        // Add tooltips
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('mouseenter', (e) => {
                const entries = e.target.dataset.entries;
                const wellbeing = e.target.dataset.wellbeing;
                if (entries > 0) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'calendar-tooltip';
                    tooltip.innerHTML = `
                        <strong>${entries} ${entries === '1' ? 'entry' : 'entries'}</strong><br>
                        Avg Wellbeing: ${wellbeing}/10
                    `;
                    e.target.appendChild(tooltip);
                }
            });
            day.addEventListener('mouseleave', (e) => {
                const tooltip = e.target.querySelector('.calendar-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    renderAchievements() {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;

        const achievements = this.calculateAchievements();
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
                ${achievement.unlocked ? 
                    `<div class="achievement-date">Unlocked: ${new Date(achievement.unlockedDate).toLocaleDateString()}</div>` :
                    `<div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span>${achievement.progress}%</span>
                    </div>`
                }
            </div>
        `).join('');
    }

    calculateAchievements() {
        const totalEntries = this.entries.length;
        const streak = this.calculateStreak();
        const avgWellbeing = totalEntries > 0 
            ? this.entries.reduce((sum, e) => sum + e.wellbeing, 0) / totalEntries 
            : 0;

        return [
            {
                icon: '🎯',
                title: 'First Step',
                description: 'Create your first entry',
                unlocked: totalEntries >= 1,
                unlockedDate: totalEntries >= 1 ? this.entries[this.entries.length - 1].timestamp : null,
                progress: Math.min(totalEntries * 100, 100)
            },
            {
                icon: '📝',
                title: 'Consistent Tracker',
                description: 'Log 10 entries',
                unlocked: totalEntries >= 10,
                unlockedDate: totalEntries >= 10 ? this.entries[Math.max(0, this.entries.length - 10)].timestamp : null,
                progress: Math.min((totalEntries / 10) * 100, 100)
            },
            {
                icon: '📚',
                title: 'Dedicated Journalist',
                description: 'Log 50 entries',
                unlocked: totalEntries >= 50,
                unlockedDate: totalEntries >= 50 ? this.entries[Math.max(0, this.entries.length - 50)].timestamp : null,
                progress: Math.min((totalEntries / 50) * 100, 100)
            },
            {
                icon: '🔥',
                title: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                unlocked: streak >= 7,
                unlockedDate: streak >= 7 ? new Date().toISOString() : null,
                progress: Math.min((streak / 7) * 100, 100)
            },
            {
                icon: '⚡',
                title: 'Month Master',
                description: 'Maintain a 30-day streak',
                unlocked: streak >= 30,
                unlockedDate: streak >= 30 ? new Date().toISOString() : null,
                progress: Math.min((streak / 30) * 100, 100)
            },
            {
                icon: '🌟',
                title: 'Positive Vibes',
                description: 'Maintain average wellbeing above 7',
                unlocked: avgWellbeing >= 7,
                unlockedDate: avgWellbeing >= 7 ? new Date().toISOString() : null,
                progress: Math.min((avgWellbeing / 7) * 100, 100)
            },
            {
                icon: '🎭',
                title: 'Self Aware',
                description: 'Complete personality assessment',
                unlocked: this.traits.length > 0,
                unlockedDate: this.traits.length > 0 ? this.traits[0].timestamp : null,
                progress: this.traits.length > 0 ? 100 : 0
            },
            {
                icon: '🎯',
                title: 'Goal Getter',
                description: 'Complete 5 goals',
                unlocked: this.goals.filter(g => g.completed).length >= 5,
                unlockedDate: this.goals.filter(g => g.completed).length >= 5 ? new Date().toISOString() : null,
                progress: Math.min((this.goals.filter(g => g.completed).length / 5) * 100, 100)
            },
            {
                icon: '💎',
                title: 'Century Club',
                description: 'Log 100 entries',
                unlocked: totalEntries >= 100,
                unlockedDate: totalEntries >= 100 ? this.entries[Math.max(0, this.entries.length - 100)].timestamp : null,
                progress: Math.min((totalEntries / 100) * 100, 100)
            },
            {
                icon: '👑',
                title: 'Legend',
                description: 'Maintain a 100-day streak',
                unlocked: streak >= 100,
                unlockedDate: streak >= 100 ? new Date().toISOString() : null,
                progress: Math.min((streak / 100) * 100, 100)
            }
        ];
    }

    updateSidebarStats() {
        const streak = this.calculateStreak();
        const avgWellbeing = this.entries.length > 0 
            ? (this.entries.reduce((sum, e) => sum + e.wellbeing, 0) / this.entries.length).toFixed(1)
            : '-';

        const sidebarStreak = document.getElementById('sidebarStreak');
        const sidebarScore = document.getElementById('sidebarScore');
        
        if (sidebarStreak) sidebarStreak.textContent = streak;
        if (sidebarScore) sidebarScore.textContent = avgWellbeing;
    }


    renderCompare() {
        const period1 = document.getElementById('period1')?.value || 'week';
        const period2 = document.getElementById('period2')?.value || 'lastWeek';

        const data1 = this.getDataForPeriod(period1);
        const data2 = this.getDataForPeriod(period2);

        const container = document.getElementById('comparisonResults');
        if (!container) return;

        if (data1.entries.length === 0 || data2.entries.length === 0) {
            container.innerHTML = '<p class="empty-state">Not enough data to compare these periods</p>';
            return;
        }

        const metrics = [
            {
                name: 'Average Wellbeing',
                value1: data1.avgWellbeing,
                value2: data2.avgWellbeing,
                icon: '⭐'
            },
            {
                name: 'Average Energy',
                value1: data1.avgEnergy,
                value2: data2.avgEnergy,
                icon: '⚡'
            },
            {
                name: 'Average Productivity',
                value1: data1.avgProductivity,
                value2: data2.avgProductivity,
                icon: '📊'
            },
            {
                name: 'Total Entries',
                value1: data1.entries.length,
                value2: data2.entries.length,
                icon: '📝'
            }
        ];

        container.innerHTML = metrics.map(metric => {
            const change = ((metric.value1 - metric.value2) / metric.value2 * 100).toFixed(1);
            const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
            const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

            return `
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h3>${metric.icon} ${metric.name}</h3>
                        <div class="comparison-change ${changeClass}">
                            ${changeIcon} ${Math.abs(change)}%
                        </div>
                    </div>
                    <div class="comparison-values">
                        <div class="comparison-value">
                            <div class="comparison-value-label">Period 1</div>
                            <div class="comparison-value-number animated-counter">${metric.value1.toFixed(1)}</div>
                        </div>
                        <div class="comparison-value">
                            <div class="comparison-value-label">Period 2</div>
                            <div class="comparison-value-number animated-counter">${metric.value2.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDataForPeriod(period) {
        const now = new Date();
        let startDate, endDate;

        switch(period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'lastWeek':
                startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'lastMonth':
                startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'lastQuarter':
                startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'lastYear':
                startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                endDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }

        const entries = this.entries.filter(e => {
            const date = new Date(e.timestamp);
            return date >= startDate && date <= endDate;
        });

        return {
            entries,
            avgWellbeing: entries.length > 0 ? entries.reduce((sum, e) => sum + e.wellbeing, 0) / entries.length : 0,
            avgEnergy: entries.length > 0 ? entries.reduce((sum, e) => sum + (e.energy || 5), 0) / entries.length : 0,
            avgProductivity: entries.length > 0 ? entries.reduce((sum, e) => sum + (e.productivity || 5), 0) / entries.length : 0
        };
    }

    // Confetti celebration effect
    triggerConfetti() {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }


    setupVoiceRecording() {
        const recordBtn = document.getElementById('recordVoice');
        const voiceStatus = document.getElementById('voiceStatus');

        if (!recordBtn || !voiceStatus) return;

        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;

        recordBtn.addEventListener('click', async () => {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    
                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentVoiceNote = audioUrl;
                        voiceStatus.innerHTML = `
                            <div class="voice-recorded">
                                <span>✅ Voice note recorded</span>
                                <audio controls src="${audioUrl}"></audio>
                            </div>
                        `;
                        audioChunks = [];
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    recordBtn.innerHTML = '<span class="voice-icon recording">⏹️</span><span class="voice-text">Stop Recording</span>';
                    recordBtn.classList.add('recording');
                } catch (error) {
                    this.showNotification('Microphone access denied', 'error');
                }
            } else {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                isRecording = false;
                recordBtn.innerHTML = '<span class="voice-icon">🎤</span><span class="voice-text">Record Voice Note</span>';
                recordBtn.classList.remove('recording');
            }
        });
    }

    setupPhotoUpload() {
        const photoInput = document.getElementById('photoInput');
        const addPhotoBtn = document.getElementById('addPhoto');
        const photoPreview = document.getElementById('photoPreview');

        if (!addPhotoBtn || !photoInput || !photoPreview) return;

        addPhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.currentPhoto = event.target.result;
                    photoPreview.innerHTML = `
                        <div class="photo-item">
                            <img src="${event.target.result}" alt="Entry photo">
                            <button class="remove-photo" onclick="this.parentElement.remove()">×</button>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    setupLocationDetection() {
        const detectBtn = document.getElementById('detectLocation');
        const locationInfo = document.getElementById('locationInfo');

        if (!detectBtn || !locationInfo) return;

        detectBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                detectBtn.textContent = '📍 Detecting...';
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        this.currentLocation = { latitude, longitude };
                        
                        // Simulate weather data (in real app, call weather API)
                        const weather = this.getSimulatedWeather();
                        
                        locationInfo.innerHTML = `
                            <div class="location-detected">
                                <span>📍 Location detected</span>
                                <span>${weather.temp}°C, ${weather.condition}</span>
                            </div>
                        `;
                    },
                    (error) => {
                        this.showNotification('Location access denied', 'warning');
                        detectBtn.textContent = '📍 Detect Location';
                    }
                );
            } else {
                this.showNotification('Geolocation not supported', 'warning');
            }
        });
    }

    getSimulatedWeather() {
        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear'];
        return {
            temp: Math.floor(Math.random() * 20) + 15,
            condition: conditions[Math.floor(Math.random() * conditions.length)]
        };
    }


    renderHabits() {
        const container = document.getElementById('habitsGrid');
        if (!container) {
            console.log('Habits container not found');
            return;
        }

        const habits = this.loadData('habits') || [];
        
        if (habits.length === 0) {
            container.innerHTML = '<p class="empty-state">No habits yet. Create your first habit!</p>';
            return;
        }

        const today = new Date().toDateString();
        
        container.innerHTML = habits.map(habit => {
            const completedToday = habit.completions?.includes(today);
            const streak = this.calculateHabitStreak(habit);
            
            return `
                <div class="habit-card" style="border-left-color: ${habit.color}">
                    <div class="habit-header">
                        <h4>${habit.name}</h4>
                        <span class="habit-streak">🔥 ${streak} days</span>
                    </div>
                    <div class="habit-frequency">${habit.frequency}</div>
                    <button class="habit-check ${completedToday ? 'completed' : ''}" 
                            data-id="${habit.id}">
                        ${completedToday ? '✅ Done Today' : '⭕ Mark Complete'}
                    </button>
                    <div class="habit-progress">
                        <div class="habit-progress-bar">
                            <div class="habit-progress-fill" 
                                 style="width: ${Math.min((habit.completions?.length || 0) * 2, 100)}%; background: ${habit.color}">
                            </div>
                        </div>
                        <span>${habit.completions?.length || 0} completions</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        document.querySelectorAll('.habit-check').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.toggleHabitCompletion(id);
            });
        });
    }

    calculateHabitStreak(habit) {
        if (!habit.completions || habit.completions.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toDateString();
            
            if (habit.completions.includes(dateStr)) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    toggleHabitCompletion(habitId) {
        const habits = this.loadData('habits') || [];
        const habit = habits.find(h => h.id === habitId);
        
        if (habit) {
            const today = new Date().toDateString();
            if (!habit.completions) habit.completions = [];
            
            const index = habit.completions.indexOf(today);
            if (index > -1) {
                habit.completions.splice(index, 1);
                this.showNotification('Habit unmarked', 'info');
            } else {
                habit.completions.push(today);
                this.showNotification('Great job! Habit completed! 🎉', 'success');
                this.triggerConfetti();
            }
            
            this.saveData('habits', habits);
            this.renderHabits();
        }
    }

    addHabit() {
        const name = document.getElementById('habitName').value;
        const frequency = document.getElementById('habitFrequency').value;
        const color = document.getElementById('habitColor').value;

        if (!name) {
            this.showNotification('Please enter a habit name', 'warning');
            return;
        }

        const habits = this.loadData('habits') || [];
        habits.push({
            id: Date.now(),
            name,
            frequency,
            color,
            completions: [],
            createdAt: new Date().toISOString()
        });

        this.saveData('habits', habits);
        document.getElementById('habitName').value = '';
        this.showNotification('Habit added!', 'success');
        this.renderHabits();
    }

    renderPredictions() {
        const prediction = this.predictTomorrowMood();
        
        const tomorrowPrediction = document.getElementById('tomorrowPrediction');
        const predictionConfidence = document.getElementById('predictionConfidence');
        const predictionReason = document.getElementById('predictionReason');
        const factorsContainer = document.getElementById('predictionFactors');
        
        if (!tomorrowPrediction || !predictionConfidence || !predictionReason || !factorsContainer) {
            console.log('Prediction elements not found');
            return;
        }
        
        tomorrowPrediction.textContent = this.getMoodEmoji(prediction.mood);
        predictionConfidence.textContent = `${prediction.confidence}% confidence`;
        predictionReason.textContent = prediction.reason;

        factorsContainer.innerHTML = prediction.factors.map(factor => `
            <div class="factor-item">
                <div class="factor-name">${factor.name}</div>
                <div class="factor-impact ${factor.impact > 0 ? 'positive' : 'negative'}">
                    ${factor.impact > 0 ? '↑' : '↓'} ${Math.abs(factor.impact)}%
                </div>
            </div>
        `).join('');

        this.renderForecastChart();
    }

    predictTomorrowMood() {
        if (this.entries.length < 7) {
            return {
                mood: 'neutral',
                confidence: 0,
                reason: 'Need more data for accurate predictions (at least 7 entries)',
                factors: []
            };
        }

        // Analyze patterns
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayOfWeek = tomorrow.getDay();

        // Get historical data for same day of week
        const sameDayEntries = this.entries.filter(e => {
            const entryDate = new Date(e.timestamp);
            return entryDate.getDay() === dayOfWeek;
        });

        const avgWellbeing = sameDayEntries.length > 0
            ? sameDayEntries.reduce((sum, e) => sum + e.wellbeing, 0) / sameDayEntries.length
            : 5;

        // Determine mood based on wellbeing
        let predictedMood = 'neutral';
        if (avgWellbeing >= 8) predictedMood = 'happy';
        else if (avgWellbeing >= 6) predictedMood = 'content';
        else if (avgWellbeing <= 3) predictedMood = 'sad';

        // Calculate confidence
        const confidence = Math.min(sameDayEntries.length * 10, 95);

        // Identify factors
        const factors = [
            { name: 'Day of Week Pattern', impact: avgWellbeing > 5 ? 15 : -15 },
            { name: 'Recent Trend', impact: this.getRecentTrend() },
            { name: 'Activity Patterns', impact: 10 }
        ];

        return {
            mood: predictedMood,
            confidence,
            reason: `Based on ${sameDayEntries.length} previous ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}s`,
            factors
        };
    }

    getRecentTrend() {
        const recent = this.entries.slice(0, 7);
        if (recent.length < 2) return 0;
        
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const avg1 = firstHalf.reduce((sum, e) => sum + e.wellbeing, 0) / firstHalf.length;
        const avg2 = secondHalf.reduce((sum, e) => sum + e.wellbeing, 0) / secondHalf.length;
        
        return Math.round((avg2 - avg1) * 5);
    }

    renderForecastChart() {
        const canvas = document.getElementById('forecastChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        // Generate 7-day forecast
        const forecast = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            
            const sameDayEntries = this.entries.filter(e => {
                const entryDate = new Date(e.timestamp);
                return entryDate.getDay() === dayOfWeek;
            });

            const predicted = sameDayEntries.length > 0
                ? sameDayEntries.reduce((sum, e) => sum + e.wellbeing, 0) / sameDayEntries.length
                : 5;

            forecast.push(predicted);
        }

        this.drawLineChart(ctx, canvas, forecast.map((v, i) => ({ wellbeing: v })), 'wellbeing');
    }

    renderReports() {
        const period = 'thisWeek'; // Default
        const report = this.generateWeeklyReport(period);
        
        const container = document.getElementById('reportContent');
        if (!container) {
            console.log('Report container not found');
            return;
        }

        container.innerHTML = `
            <div class="report-summary">
                <h2>Week Summary</h2>
                <div class="report-stats-grid">
                    <div class="report-stat">
                        <div class="report-stat-icon">📊</div>
                        <div class="report-stat-value">${report.totalEntries}</div>
                        <div class="report-stat-label">Entries</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-icon">⭐</div>
                        <div class="report-stat-value">${report.avgWellbeing.toFixed(1)}</div>
                        <div class="report-stat-label">Avg Wellbeing</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-icon">⚡</div>
                        <div class="report-stat-value">${report.avgEnergy.toFixed(1)}</div>
                        <div class="report-stat-label">Avg Energy</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-icon">📈</div>
                        <div class="report-stat-value">${report.avgProductivity.toFixed(1)}</div>
                        <div class="report-stat-label">Avg Productivity</div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>🎯 Highlights</h3>
                <ul class="report-list">
                    ${report.highlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>

            <div class="report-section">
                <h3>💡 Insights</h3>
                <ul class="report-list">
                    ${report.insights.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>

            <div class="report-section">
                <h3>🎨 Top Activities</h3>
                <div class="report-activities">
                    ${report.topActivities.length > 0 ? 
                        report.topActivities.map(a => `<div class="report-activity-badge">${a}</div>`).join('') :
                        '<p>No activities tracked yet</p>'
                    }
                </div>
            </div>

            <div class="report-section">
                <h3>📅 Best Day</h3>
                <p class="report-best-day">${report.bestDay}</p>
            </div>
        `;
    }

    generateWeeklyReport(period) {
        const weekEntries = this.entries.filter(e => {
            const date = new Date(e.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
        });

        const avgWellbeing = weekEntries.length > 0
            ? weekEntries.reduce((sum, e) => sum + e.wellbeing, 0) / weekEntries.length
            : 0;

        const avgEnergy = weekEntries.length > 0
            ? weekEntries.reduce((sum, e) => sum + (e.energy || 5), 0) / weekEntries.length
            : 0;

        const avgProductivity = weekEntries.length > 0
            ? weekEntries.reduce((sum, e) => sum + (e.productivity || 5), 0) / weekEntries.length
            : 0;

        // Get top activities
        const activityCounts = {};
        weekEntries.forEach(e => {
            e.activities?.forEach(a => {
                activityCounts[a] = (activityCounts[a] || 0) + 1;
            });
        });

        const topActivities = Object.entries(activityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([activity]) => activity);

        // Find best day
        const dayScores = {};
        weekEntries.forEach(e => {
            const day = new Date(e.timestamp).toLocaleDateString();
            if (!dayScores[day]) dayScores[day] = [];
            dayScores[day].push(e.wellbeing);
        });

        let bestDay = 'N/A';
        let bestScore = 0;
        Object.entries(dayScores).forEach(([day, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > bestScore) {
                bestScore = avg;
                bestDay = day;
            }
        });

        return {
            totalEntries: weekEntries.length,
            avgWellbeing,
            avgEnergy,
            avgProductivity,
            highlights: [
                `You logged ${weekEntries.length} entries this week`,
                avgWellbeing >= 7 ? 'Your wellbeing was above average!' : 'Focus on self-care activities',
                `Most productive on ${bestDay}`
            ],
            insights: [
                avgEnergy > 7 ? 'Your energy levels are great!' : 'Consider more rest and nutrition',
                topActivities.length > 0 ? `You enjoyed ${topActivities[0]} activities most` : 'Try tracking more activities',
                'Keep up the consistent tracking!'
            ],
            topActivities,
            bestDay
        };
    }

    shareReport() {
        if (navigator.share) {
            navigator.share({
                title: 'My PersonaTrack Report',
                text: 'Check out my weekly mood tracking report!',
                url: window.location.href
            }).catch(() => {
                this.showNotification('Sharing cancelled', 'info');
            });
        } else {
            this.showNotification('Sharing not supported on this device', 'warning');
        }
    }
