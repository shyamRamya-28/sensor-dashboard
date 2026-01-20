// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
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
                label: 'Patient Health Data',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });

    // ========== PATIENT DATA FUNCTIONS ==========
    
       // Helper function to determine status - TESTING VERSION
    function getStatus(sensorName, value) {
        const thresholds = {
            temperature: { min: 20, max: 45, normal: 37 }, // Wider for testing
            heart_rate: { min: 30, max: 200, normal: 72 },  // Wider for testing
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
            return threshold.normalValues.includes(value) ? "normal" : "alert";
        }
        
        // For numeric sensors - show warning instead of alert for extreme values
        if (value < threshold.min || value > threshold.max) {
            return "warning"; // Changed from "alert" to "warning" for testing
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
        console.log("=== FORMAT PATIENT DATA ===");
        console.log("Input data:", patientData);
        
        if (!patientData) {
            console.warn("No patient data provided");
            return {};
        }
        
        const formatted = {};
        
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
                formatted[displayKey] = {
                    value: cleanValue,
                    status: getStatus(displayKey, cleanValue),
                    unit: getUnit(displayKey)
                };
                console.log(`Added ${displayKey}:`, formatted[displayKey]);
            } else if (typeof cleanValue === 'string') {
                formatted[displayKey] = {
                    value: cleanValue,
                    status: cleanValue === "Poor" ? "alert" : "normal",
                    unit: ""
                };
                console.log(`Added string ${displayKey}:`, formatted[displayKey]);
            }
        });
        
        console.log("Final formatted data keys:", Object.keys(formatted));
        console.log("Formatted data:", formatted);
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
    // ========== END PATIENT DATA FUNCTIONS ==========

    // Function to update dashboard cards
    function updateDashboard(data) {
        console.log("=== UPDATE DASHBOARD ===");
        console.log("Data to display:", data);
        
        const dashboard = document.querySelector('.dashboard');
        
        // Clear loading message
        const loading = document.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        // Remove old cards
        const oldCards = document.querySelectorAll('.sensor-card');
        oldCards.forEach(card => card.remove());
        
        // Check if we have data
        if (Object.keys(data).length === 0) {
            console.log("No valid sensor data to display");
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data';
            noDataMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>No valid sensor data available</p>
                <small>Check if sensors are connected and sending data</small>
            `;
            dashboard.appendChild(noDataMsg);
            return;
        }
        
        // Create cards for each sensor
        Object.entries(data).forEach(([sensorName, sensorData]) => {
            const card = createSensorCard(sensorName, sensorData);
            dashboard.appendChild(card);
        });
        
        console.log(`Displayed ${Object.keys(data).length} sensor cards`);
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
                <span>Time: 18:35:19</span>
            </div>
        `;
        
        return card;
    }

    // Function to update chart
    function updateChart(data) {
        const now = new Date();
        const timeLabel = now.getHours() + ':' + 
                         now.getMinutes().toString().padStart(2, '0') + ':' + 
                         now.getSeconds().toString().padStart(2, '0');
        
        // Get first valid sensor value for chart
        const sensors = Object.values(data);
        if (sensors.length === 0) return;
        
        const firstSensor = sensors.find(s => typeof s.value === 'number');
        if (!firstSensor) return;
        
        const value = firstSensor.value;
        
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

    // Test data fallback function
    function showTestData() {
        console.log("Showing test data");
        const testData = {
            temperature: { 
                value: 37.5, 
                status: "normal",
                unit: "°C"
            },
            heart_rate: { 
                value: 72, 
                status: "normal",
                unit: "bpm"
            },
            spo2: { 
                value: 98, 
                status: "normal",
                unit: "%"
            },
            air_quality: { 
                value: "Good", 
                status: "normal",
                unit: ""
            }
        };
        
        // Remove loading message
        const loading = document.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        // Update dashboard with test data
        updateDashboard(testData);
        
        // Add some history to chart
        for (let i = 0; i < 10; i++) {
            updateChart(testData);
        }
        
        // Update last updated time
        document.getElementById('last-updated').textContent = 
            new Date().toLocaleTimeString();
            
        console.log("Test data displayed");
    }

    // ========== FIREBASE LISTENER ==========
    console.log("=== Connecting to Firebase Patient Data ===");
    
    // Get reference to patient data
    const patientRef = database.ref('patients/patient_001/2026-01-19');
    
    patientRef.on('value', (snapshot) => {
        const dateData = snapshot.val();
        console.log("=== FIREBASE DATA ===");
        console.log("Date data received, timestamps:", Object.keys(dateData || {}));
        
        if (dateData && typeof dateData === 'object') {
            // Get all timestamp keys
            const timestamps = Object.keys(dateData);
            
            if (timestamps.length > 0) {
                // Get the LATEST timestamp
                const latestTimestamp = timestamps[timestamps.length - 1];
                console.log("Latest timestamp:", latestTimestamp);
                
                // Get the actual sensor data
                const sensorData = dateData[latestTimestamp];
                console.log("Sensor data:", sensorData);
                
                if (sensorData && typeof sensorData === 'object') {
                    // Format the data
                    const formattedData = formatPatientData(sensorData);
                    
                    // Update dashboard
                    updateDashboard(formattedData);
                    
                    // Update chart
                    updateChart(formattedData);
                    
                    // Update last updated time
                    document.getElementById('last-updated').textContent = 
                        `Today at ${latestTimestamp}`;
                        
                    console.log("Dashboard updated with real data!");
                } else {
                    console.error("No sensor data in timestamp");
                    showTestData();
                }
            } else {
                console.error("No timestamps found");
                showTestData();
            }
        } else {
            console.error("No date data found");
            showTestData();
        }
    }, (error) => {
        console.error("Firebase connection error:", error);
        document.getElementById('connection-status').textContent = "Disconnected";
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) statusDot.style.background = '#e74c3c';
        
        showTestData();
    });
    
    // Force test data after 5 seconds if nothing shows
    setTimeout(() => {
        const cards = document.querySelectorAll('.sensor-card');
        const noData = document.querySelector('.no-data');
        if (cards.length === 0 && !noData) {
            console.log("No data displayed after 5 seconds, showing test data");
            showTestData();
        }
    }, 5000);
});

