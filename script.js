// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentDate = getCurrentDate(); // Automatically use today's date
    let currentTimestamps = [];
    let currentTimestampIndex = 0;
    let liveUpdateInterval;
    let isLiveMode = true; // Start in live mode
    
    // Get current date in YYYY-MM-DD format
    function getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Update time every second
    function updateTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = 
            now.toLocaleString('en-US', { 
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
    }
    
    setInterval(updateTime, 1000);
    updateTime();

    // Chart configuration
    const ctx = document.getElementById('sensorChart').getContext('2d');
    let sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Heart Rate (bpm)',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Value'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });

    // ========== PATIENT DATA FUNCTIONS ==========
    
    // Helper function to determine status
    function getStatus(sensorName, value) {
        const thresholds = {
            temperature: { min: 35, max: 42, normal: 37 },
            heart_rate: { min: 60, max: 100, normal: 72 },
            spo2: { min: 90, max: 100, normal: 98 },
            air_quality: { normalValues: ["Good", "Fair", "Moderate"] },
            acceleration_x: { min: -20000, max: 20000, normal: 0 },
            acceleration_y: { min: -20000, max: 20000, normal: 0 },
            acceleration_z: { min: -20000, max: 20000, normal: 0 }
        };
        
        const threshold = thresholds[sensorName];
        if (!threshold) return "normal";
        
        // Special handling for air_quality (string)
        if (sensorName === 'air_quality') {
            return threshold.normalValues.includes(value) ? "normal" : "warning";
        }
        
        // For numeric sensors
        if (value < threshold.min || value > threshold.max) {
            return "warning";
        }
        return "normal";
    }

    // Helper function to get units
    function getUnit(sensorName) {
        const units = {
            temperature: "°C",
            heart_rate: "bpm",
            spo2: "%",
            air_quality: "",
            acceleration_x: "m/s²",
            acceleration_y: "m/s²",
            acceleration_z: "m/s²"
        };
        return units[sensorName] || "";
    }

    // Function to format patient data for dashboard
    function formatPatientData(patientData) {
        if (!patientData) {
            console.warn("No patient data provided");
            return {};
        }
        
        const formatted = {};
        let alertCount = 0;
        
        // Process each sensor
        Object.keys(patientData).forEach(key => {
            const rawValue = patientData[key];
            let displayKey = key;
            let cleanValue = rawValue;
            
            // Map keys to display names
            const keyMap = {
                'airQuality': 'air_quality',
                'heartRate': 'heart_rate',
                'spo2': 'spo2',
                'temperature': 'temperature',
                'ax': 'acceleration_x',
                'ay': 'acceleration_y',
                'az': 'acceleration_z'
            };
            
            displayKey = keyMap[key] || key;
            
            // Create sensor object
            if (typeof cleanValue === 'number' && !isNaN(cleanValue)) {
                const status = getStatus(displayKey, cleanValue);
                if (status === "warning") alertCount++;
                
                formatted[displayKey] = {
                    value: cleanValue,
                    status: status,
                    unit: getUnit(displayKey)
                };
            } else if (typeof cleanValue === 'string') {
                const status = cleanValue === "Poor" ? "warning" : "normal";
                if (status === "warning") alertCount++;
                
                formatted[displayKey] = {
                    value: cleanValue,
                    status: status,
                    unit: ""
                };
            }
        });
        
        // Update alert count
        document.getElementById('alert-count').textContent = alertCount;
        
        return formatted;
    }
    
    // Helper function for sensor icons
    function getSensorIcon(sensorName) {
        const icons = {
            temperature: 'fas fa-thermometer-half',
            heart_rate: 'fas fa-heartbeat',
            spo2: 'fas fa-lungs',
            air_quality: 'fas fa-wind',
            acceleration_x: 'fas fa-running',
            acceleration_y: 'fas fa-running',
            acceleration_z: 'fas fa-running',
            default: 'fas fa-stethoscope'
        };
        
        const name = sensorName.toLowerCase();
        for (const [key, icon] of Object.entries(icons)) {
            if (name.includes(key)) return icon;
        }
        return icons.default;
    }

    function formatSensorName(name) {
        const nameMap = {
            'temperature': 'Temperature',
            'heart_rate': 'Heart Rate',
            'spo2': 'SpO₂',
            'air_quality': 'Air Quality',
            'acceleration_x': 'Acceleration X',
            'acceleration_y': 'Acceleration Y',
            'acceleration_z': 'Acceleration Z'
        };
        
        return nameMap[name] || name.replace(/_/g, ' ')
                                   .replace(/\b\w/g, l => l.toUpperCase());
    }

    function getStatusBadge(data) {
        const status = data.status || "normal";
        
        const badges = {
            normal: '<span style="color:#2ecc71;">Normal</span>',
            warning: '<span style="color:#f39c12;">Warning</span>',
            alert: '<span style="color:#e74c3c;">Alert</span>',
            offline: '<span style="color:#95a5a6;">Offline</span>'
        };
        
        return badges[status] || badges.normal;
    }
    
    // Calculate averages for summary
    function calculateAverages(formattedData) {
        if (!formattedData || Object.keys(formattedData).length === 0) {
            document.getElementById('avg-heart-rate').textContent = '--';
            document.getElementById('avg-temperature').textContent = '--';
            document.getElementById('avg-spo2').textContent = '--';
            return;
        }
        
        // For now, just show current values (you can modify to calculate real averages)
        if (formattedData.heart_rate) {
            document.getElementById('avg-heart-rate').textContent = 
                Math.round(formattedData.heart_rate.value);
        }
        if (formattedData.temperature) {
            document.getElementById('avg-temperature').textContent = 
                Math.round(formattedData.temperature.value * 10) / 10 + '°C';
        }
        if (formattedData.spo2) {
            document.getElementById('avg-spo2').textContent = 
                Math.round(formattedData.spo2.value) + '%';
        }
    }

    // Function to update dashboard cards
    function updateDashboard(data, timestamp = 'Live') {
        const dashboard = document.querySelector('.dashboard');
        
        // Clear loading message
        const loading = document.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        // Remove old cards
        const oldCards = document.querySelectorAll('.sensor-card');
        oldCards.forEach(card => card.remove());
        
        // Check if we have data
        if (!data || Object.keys(data).length === 0) {
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data';
            noDataMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>No sensor data available</p>
                <small>Waiting for live sensor data...</small>
            `;
            dashboard.appendChild(noDataMsg);
            return;
        }
        
        // Create cards for each sensor
        Object.entries(data).forEach(([sensorName, sensorData]) => {
            const card = createSensorCard(sensorName, sensorData, timestamp);
            dashboard.appendChild(card);
        });
        
        // Update summary statistics
        calculateAverages(data);
    }

    // Function to create sensor card
    function createSensorCard(sensorName, sensorData, timestamp) {
        const card = document.createElement('div');
        card.className = 'sensor-card';
        
        // Get icon based on sensor type
        const icon = getSensorIcon(sensorName);
        
        // Format value display
        let displayValue = sensorData.value;
        if (typeof sensorData.value === 'number') {
            // Round to 2 decimal places for numbers
            displayValue = Math.round(sensorData.value * 100) / 100;
        }
        
        card.innerHTML = `
            <div class="sensor-header">
                <div class="sensor-title">
                    <i class="${icon} sensor-icon"></i>
                    <span>${formatSensorName(sensorName)}</span>
                </div>
                <span class="sensor-status">${getStatusBadge(sensorData)}</span>
            </div>
            <div class="sensor-value">
                ${displayValue}
                <span class="sensor-unit">${sensorData.unit || getUnit(sensorName)}</span>
            </div>
            <div class="sensor-footer">
                <span>Patient: 001</span>
                <span>${timestamp === 'Live' ? 'Live Now' : 'Time: ' + timestamp}</span>
            </div>
        `;
        
        return card;
    }

    // Function to update chart
    function updateChart(data, timestamp) {
        if (!data.heart_rate) return;
        
        const value = data.heart_rate.value;
        const timeLabel = timestamp === 'Live' ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : timestamp;
        
        // Add new data point
        sensorChart.data.labels.push(timeLabel);
        sensorChart.data.datasets[0].data.push(value);
        
        // Keep only last 20 points
        if (sensorChart.data.labels.length > 20) {
            sensorChart.data.labels.shift();
            sensorChart.data.datasets[0].data.shift();
        }
        
        sensorChart.update();
    }

    // Function to update timestamp display
    function updateTimestampDisplay() {
        const timestampElement = document.getElementById('current-timestamp');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (currentTimestamps.length > 0 && !isLiveMode) {
            timestampElement.textContent = currentTimestamps[currentTimestampIndex];
            
            // Enable/disable navigation buttons
            prevBtn.disabled = currentTimestampIndex === 0;
            nextBtn.disabled = currentTimestampIndex === currentTimestamps.length - 1;
        } else if (isLiveMode) {
            timestampElement.textContent = 'LIVE';
            timestampElement.style.color = '#2ecc71';
            timestampElement.style.fontWeight = 'bold';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        } else {
            timestampElement.textContent = '--:--:--';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // ========== LIVE MODE FUNCTIONS ==========
    
    // Start live updates
    function startLiveUpdates() {
        console.log("Starting live updates...");
        isLiveMode = true;
        updateTimestampDisplay();
        
        // Get reference to today's data
        const today = getCurrentDate();
        const patientRef = database.ref(`patients/patient_001/${today}`);
        
        // Listen for new data in real-time
        patientRef.on('child_added', (snapshot) => {
            const timestamp = snapshot.key;
            const sensorData = snapshot.val();
            
            console.log(`New data received at ${timestamp}:`, sensorData);
            
            // Format and display the new data
            const formattedData = formatPatientData(sensorData);
            updateDashboard(formattedData, 'Live');
            updateChart(formattedData, timestamp);
            
            // Update last updated time
            document.getElementById('last-updated').textContent = 
                new Date().toLocaleTimeString();
            
            // Update connection status
            document.getElementById('connection-status').textContent = "Live";
            document.querySelector('.status-dot').style.background = '#2ecc71';
            document.querySelector('.status-dot').style.animation = 'pulse 1s infinite';
        });
        
        // Also update when data changes
        patientRef.on('child_changed', (snapshot) => {
            console.log("Data updated:", snapshot.key, snapshot.val());
        });
        
        // Store the reference to turn off later if needed
        window.livePatientRef = patientRef;
    }
    
    // Stop live updates
    function stopLiveUpdates() {
        if (window.livePatientRef) {
            window.livePatientRef.off();
            console.log("Live updates stopped");
        }
        isLiveMode = false;
        updateTimestampDisplay();
    }
    
    // Function to load historical data
    function loadHistoricalData() {
        console.log(`Loading historical data for date: ${currentDate}`);
        stopLiveUpdates();
        
        const patientRef = database.ref(`patients/patient_001/${currentDate}`);
        
        patientRef.once('value').then((snapshot) => {
            const dateData = snapshot.val();
            
            if (dateData && typeof dateData === 'object') {
                // Get all timestamps
                currentTimestamps = Object.keys(dateData).sort();
                
                if (currentTimestamps.length > 0) {
                    // Start with the latest timestamp
                    currentTimestampIndex = currentTimestamps.length - 1;
                    
                    // Update timestamp display
                    updateTimestampDisplay();
                    
                    // Get sensor data for current timestamp
                    const sensorData = dateData[currentTimestamps[currentTimestampIndex]];
                    
                    // Format and display data
                    const formattedData = formatPatientData(sensorData);
                    updateDashboard(formattedData, currentTimestamps[currentTimestampIndex]);
                    updateChart(formattedData, currentTimestamps[currentTimestampIndex]);
                    
                    // Update last updated time
                    document.getElementById('last-updated').textContent = 
                        new Date().toLocaleTimeString();
                        
                    console.log(`Loaded ${currentTimestamps.length} historical readings`);
                } else {
                    console.error("No timestamps found for this date");
                    updateDashboard({});
                }
            } else {
                console.error("No data found for this date");
                updateDashboard({});
            }
        }).catch((error) => {
            console.error("Error loading data:", error);
            document.getElementById('connection-status').textContent = "Error";
            document.querySelector('.status-dot').style.background = '#e74c3c';
            updateDashboard({});
        });
    }

    // ========== EVENT LISTENERS ==========
    
    // Date selector change
    document.getElementById('date-select').addEventListener('change', function(e) {
        currentDate = e.target.value;
        if (currentDate === getCurrentDate()) {
            // If selecting today, switch to live mode
            startLiveUpdates();
        } else {
            // If selecting past date, load historical data
            loadHistoricalData();
        }
    });
    
    // Previous button
    document.getElementById('prev-btn').addEventListener('click', function() {
        if (!isLiveMode && currentTimestampIndex > 0) {
            currentTimestampIndex--;
            updateTimestampDisplay();
            loadDataForCurrentTimestamp();
        }
    });
    
    // Next button
    document.getElementById('next-btn').addEventListener('click', function() {
        if (!isLiveMode && currentTimestampIndex < currentTimestamps.length - 1) {
            currentTimestampIndex++;
            updateTimestampDisplay();
            loadDataForCurrentTimestamp();
        }
    });
    
    // Function to load data for current timestamp (historical mode)
    function loadDataForCurrentTimestamp() {
        const patientRef = database.ref(`patients/patient_001/${currentDate}`);
        
        patientRef.once('value').then((snapshot) => {
            const dateData = snapshot.val();
            if (dateData && currentTimestamps[currentTimestampIndex]) {
                const sensorData = dateData[currentTimestamps[currentTimestampIndex]];
                const formattedData = formatPatientData(sensorData);
                updateDashboard(formattedData, currentTimestamps[currentTimestampIndex]);
                updateChart(formattedData, currentTimestamps[currentTimestampIndex]);
            }
        });
    }
    
    // Live mode toggle button (we'll add this)
    function setupLiveModeToggle() {
        const liveToggle = document.createElement('button');
        liveToggle.id = 'live-toggle';
        liveToggle.innerHTML = '<i class="fas fa-satellite-dish"></i> LIVE MODE';
        liveToggle.className = 'live-toggle-btn active';
        
        // Add to time selector
        const timeSelector = document.querySelector('.time-selector');
        timeSelector.appendChild(liveToggle);
        
        // Toggle live mode
        liveToggle.addEventListener('click', function() {
            if (isLiveMode) {
                // Switch to historical mode
                isLiveMode = false;
                liveToggle.classList.remove('active');
                liveToggle.innerHTML = '<i class="fas fa-history"></i> HISTORICAL';
                loadHistoricalData();
            } else {
                // Switch to live mode
                isLiveMode = true;
                liveToggle.classList.add('active');
                liveToggle.innerHTML = '<i class="fas fa-satellite-dish"></i> LIVE MODE';
                startLiveUpdates();
            }
        });
    }

    // ========== INITIAL LOAD ==========
    console.log("=== Starting Patient Health Dashboard ===");
    
    // Update date selector with today's date
    const today = getCurrentDate();
    document.getElementById('date-select').value = today;
    currentDate = today;
    
    // Setup live mode toggle
    setupLiveModeToggle();
    
    // Start in live mode
    startLiveUpdates();
    
    // Update date options dynamically
    updateDateOptions();
    
    // Function to update date options
    function updateDateOptions() {
        const dateSelect = document.getElementById('date-select');
        
        // Check what dates are available in Firebase
        const patientsRef = database.ref('patients/patient_001');
        patientsRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dates = Object.keys(data).sort().reverse(); // Latest first
                
                // Clear existing options except first
                while (dateSelect.options.length > 1) {
                    dateSelect.remove(1);
                }
                
                // Add available dates
                dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = formatDateDisplay(date);
                    dateSelect.appendChild(option);
                });
            }
        });
    }
    
    // Format date for display
    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});
