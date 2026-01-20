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
    
    // Helper function to determine status
    function getStatus(sensorName, value) {
        const thresholds = {
            temperature: { min: 36, max: 38, normal: 37 },
            heart_rate: { min: 60, max: 100, normal: 72 },
            spo2: { min: 95, max: 100, normal: 98 },
            air_quality: { min: 0, max: 50, normal: 25 },
            acceleration_x: { min: -10000, max: 10000, normal: 0 },
            acceleration_y: { min: -10000, max: 10000, normal: 0 },
            acceleration_z: { min: -10000, max: 10000, normal: 0 }
        };
        
        const threshold = thresholds[sensorName] || { min: 0, max: 100 };
        
        // Skip bad sensor values
        if (sensorName === 'heart_rate' && value === -999) return "offline";
        if (sensorName === 'spo2' && value === 0) return "offline";
        
        if (value < threshold.min || value > threshold.max) {
            return "alert";
        } else if (threshold.normal && Math.abs(value - threshold.normal) > (threshold.normal * 0.2)) {
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
            air_quality: "level",
            acceleration_x: "m/s²",
            acceleration_y: "m/s²",
            acceleration_z: "m/s²"
        };
        return units[sensorName] || "units";
    }

    // Function to format patient data for dashboard
    function formatPatientData(patientData) {
        console.log("Raw patient data:", patientData);
        
        // If data is null or empty
        if (!patientData) {
            console.warn("No patient data found");
            return {};
        }
        
        const formatted = {};
        
        // Map your sensor names to our expected format
        const sensorMapping = {
            'temperature': 'temperature',
            'heartRate': 'heart_rate',
            'spo2': 'spo2',
            'airQuality': 'air_quality',
            'ax': 'acceleration_x',
            'ay': 'acceleration_y',
            'az': 'acceleration_z'
        };
        
        // Bad values to filter out
        const badValues = {
            'heartRate': [-999],
            'spo2': [0]
        };
        
        // Process each sensor
        Object.keys(patientData).forEach(key => {
            const value = patientData[key];
            const displayKey = sensorMapping[key] || key;
            
            // Clean up the value (remove % sign, etc.)
            let cleanValue = value;
            
            // Skip if value is in bad values list
            if (badValues[key] && badValues[key].includes(value)) {
                console.log(`Skipping bad value for ${key}: ${value}`);
                return;
            }
            
            if (typeof value === 'string') {
                // Remove % sign from spo2
                if (key === 'spo2' && value.includes('%')) {
                    cleanValue = parseFloat(value.replace('%', ''));
                }
                // Try to convert string numbers
                else if (!isNaN(parseFloat(value))) {
                    cleanValue = parseFloat(value);
                }
            }
            
            if (typeof cleanValue === 'number' && !isNaN(cleanValue)) {
                formatted[displayKey] = {
                    value: cleanValue,
                    status: getStatus(displayKey, cleanValue),
                    unit: getUnit(displayKey)
                };
            } else if (typeof value === 'string') {
                // For string values like airQuality
                formatted[displayKey] = {
                    value: value,
                    status: value === "Poor" ? "alert" : "normal",
                    unit: ""
                };
            }
        });
        
        console.log("Formatted data keys:", Object.keys(formatted));
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
        return name.replace(/_/g, ' ')
                   .replace(/\b\w/g, l => l.toUpperCase())
                   .replace('Bp', 'BP')
                   .replace('Spo2', 'SpO₂')
                   .replace('Ax', 'Acceleration X')
                   .replace('Ay', 'Acceleration Y')
                   .replace('Az', 'Acceleration Z');
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
    }

    // Function to create sensor card
    function createSensorCard(sensorName, sensorData) {
        const card = document.createElement('div');
        card.className = 'sensor-card';
        
        // Get icon based on sensor type
        const icon = getSensorIcon(sensorName);
        
        // Format value display
        let displayValue = sensorData.value;
        if (typeof sensorData.value === 'string') {
            displayValue = sensorData.value;
        } else if (typeof sensorData.value === 'number') {
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
                <span>Updated: Just now</span>
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
        console.log("Date data received:", dateData);
        console.log("Date data type:", typeof dateData);
        
        if (dateData && typeof dateData === 'object') {
            // Get all timestamp keys (like "18:31:32")
            const timestamps = Object.keys(dateData);
            console.log("Available timestamps:", timestamps);
            
            if (timestamps.length > 0) {
                // Get the LATEST timestamp
                const latestTimestamp = timestamps[timestamps.length - 1];
                console.log("Latest timestamp:", latestTimestamp);
                
                // Get the actual sensor data
                const sensorData = dateData[latestTimestamp];
                console.log("Sensor data from timestamp:", sensorData);
                console.log("Sensor data keys:", Object.keys(sensorData || {}));
                
                if (sensorData && typeof sensorData === 'object') {
                    // Format the data
                    const formattedData = formatPatientData(sensorData);
                    console.log("Formatted data ready:", formattedData);
                    
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
            console.error("No date data found or wrong format");
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
.no-data {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    background: #f8f9fa;
    border-radius: 15px;
    border: 2px dashed #dee2e6;
}

.no-data i {
    font-size: 48px;
    color: #6c757d;
    margin-bottom: 20px;
}

.no-data p {
    font-size: 20px;
    color: #495057;
    margin-bottom: 10px;
}

.no-data small {
    color: #6c757d;
    font-size: 14px;
}
