// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentDate = '2026-01-19';
    let currentTimestamps = [];
    let currentTimestampIndex = 0;
    
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
            temperature: { min: 20, max: 45, normal: 37 },
            heart_rate: { min: 30, max: 200, normal: 72 },
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
    function updateDashboard(data) {
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
                <small>Check sensor connections</small>
            `;
            dashboard.appendChild(noDataMsg);
            return;
        }
        
        // Create cards for each sensor
        Object.entries(data).forEach(([sensorName, sensorData]) => {
            const card = createSensorCard(sensorName, sensorData);
            dashboard.appendChild(card);
        });
        
        // Update summary statistics
        calculateAverages(data);
    }

    // Function to create sensor card
    function createSensorCard(sensorName, sensorData) {
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
                <span>Time: ${currentTimestamps[currentTimestampIndex] || '--:--:--'}</span>
            </div>
        `;
        
        return card;
    }

    // Function to update chart
    function updateChart(data) {
        if (!data.heart_rate) return;
        
        const value = data.heart_rate.value;
        
        // Add new data point
        const timeLabel = currentTimestamps[currentTimestampIndex] || '--:--:--';
        sensorChart.data.labels.push(timeLabel);
        sensorChart.data.datasets[0].data.push(value);
        
        // Keep only last 15 points
        if (sensorChart.data.labels.length > 15) {
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
        
        if (currentTimestamps.length > 0) {
            timestampElement.textContent = currentTimestamps[currentTimestampIndex];
            
            // Enable/disable navigation buttons
            prevBtn.disabled = currentTimestampIndex === 0;
            nextBtn.disabled = currentTimestampIndex === currentTimestamps.length - 1;
        } else {
            timestampElement.textContent = '--:--:--';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // Function to load data for selected date and timestamp
    function loadPatientData() {
        console.log(`Loading data for date: ${currentDate}`);
        
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
                    updateDashboard(formattedData);
                    updateChart(formattedData);
                    
                    // Update last updated time
                    document.getElementById('last-updated').textContent = 
                        new Date().toLocaleTimeString();
                        
                    console.log(`Loaded ${currentTimestamps.length} timestamps`);
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
        currentTimestampIndex = 0;
        loadPatientData();
    });
    
    // Previous button
    document.getElementById('prev-btn').addEventListener('click', function() {
        if (currentTimestampIndex > 0) {
            currentTimestampIndex--;
            updateTimestampDisplay();
            loadDataForCurrentTimestamp();
        }
    });
    
    // Next button
    document.getElementById('next-btn').addEventListener('click', function() {
        if (currentTimestampIndex < currentTimestamps.length - 1) {
            currentTimestampIndex++;
            updateTimestampDisplay();
            loadDataForCurrentTimestamp();
        }
    });
    
    // Function to load data for current timestamp
    function loadDataForCurrentTimestamp() {
        const patientRef = database.ref(`patients/patient_001/${currentDate}`);
        
        patientRef.once('value').then((snapshot) => {
            const dateData = snapshot.val();
            if (dateData && currentTimestamps[currentTimestampIndex]) {
                const sensorData = dateData[currentTimestamps[currentTimestampIndex]];
                const formattedData = formatPatientData(sensorData);
                updateDashboard(formattedData);
                updateChart(formattedData);
            }
        });
    }

    // ========== INITIAL LOAD ==========
    console.log("=== Starting Patient Health Dashboard ===");
    
    // Load initial data
    loadPatientData();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        console.log("Auto-refreshing data...");
        loadPatientData();
    }, 30000);
});
