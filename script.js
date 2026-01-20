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
            // Your actual sensor names → Display names
            'temperature': 'temperature',
            'heartRate': 'heart_rate',
            'spo2': 'spo2',
            'airQuality': 'air_quality',
            'ax': 'acceleration_x',
            'ay': 'acceleration_y',
            'az': 'acceleration_z'
        };
        
        // Process each sensor
        Object.keys(patientData).forEach(key => {
            const value = patientData[key];
            const displayKey = sensorMapping[key] || key;
            
            // Clean up the value (remove % sign, etc.)
            let cleanValue = value;
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
            
            if (typeof cleanValue === 'number') {
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

       // Helper functions
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
       // Helper function to get units
    function getUnit(sensorName) {
        const units = {
            temperature: "°C",
            heart_rate: "bpm",
            spo2: "%",
            air_quality: "level",
            acceleration_x: "m/s²",
            acceleration_y: "m/s²",
            acceleration_z: "m/s²",
            bp_systolic: "mmHg",
            bp_diastolic: "mmHg",
            respiratory_rate: "bpm",
            glucose: "mg/dL"
        };
        return units[sensorName] || "units";
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
        
        card.innerHTML = `
            <div class="sensor-header">
                <div class="sensor-title">
                    <i class="${icon} sensor-icon"></i>
                    <span>${formatSensorName(sensorName)}</span>
                </div>
                <span class="sensor-status">${getStatusBadge(sensorData)}</span>
            </div>
            <div class="sensor-value">
                ${sensorData.value}
                <span class="sensor-unit">${sensorData.unit || getUnit(sensorName)}</span>
            </div>
            <div class="sensor-footer">
                <span>Patient: 001</span>
                <span>Updated: Just now</span>
            </div>
        `;
        
        return card;
    }

    // Helper functions
    function getSensorIcon(sensorName) {
        const icons = {
            temperature: 'fas fa-thermometer-half',
            heart_rate: 'fas fa-heartbeat',
            spo2: 'fas fa-lungs',
            bp_systolic: 'fas fa-tachometer-alt',
            bp_diastolic: 'fas fa-tachometer-alt',
            respiratory_rate: 'fas fa-wind',
            glucose: 'fas fa-tint',
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
                   .replace('Spo2', 'SpO₂');
    }

    function getSensorValue(data) {
        if (typeof data === 'object' && data.value !== undefined) {
            return data.value;
        }
        return typeof data === 'object' ? JSON.stringify(data) : data;
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

    // Function to update chart
    function updateChart(data) {
        const now = new Date();
        const timeLabel = now.getHours() + ':' + 
                         now.getMinutes().toString().padStart(2, '0') + ':' + 
                         now.getSeconds().toString().padStart(2, '0');
        
        // Get first sensor value for chart
        const firstSensor = Object.values(data)[0];
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

    // ========== FIREBASE LISTENER ==========
    console.log("=== Connecting to Firebase Patient Data ===");
    
    // Get reference to patient data
    // We'll get the LATEST timestamp data
    const patientRef = database.ref('patients/patient_001/2026-01-19');
    
    patientRef.on('value', (snapshot) => {
        const dateData = snapshot.val();
        console.log("Received date data:", dateData);
        
        if (dateData && typeof dateData === 'object') {
            // Get all timestamp keys (like "18:31:32")
            const timestamps = Object.keys(dateData);
            console.log("Available timestamps:", timestamps);
            
            if (timestamps.length > 0) {
                // Get the LATEST timestamp (last one in the object)
                const latestTimestamp = timestamps[timestamps.length - 1];
                console.log("Using latest timestamp:", latestTimestamp);
                
                // Get the actual sensor data from this timestamp
                const sensorData = dateData[latestTimestamp];
                console.log("Sensor data:", sensorData);
                
                // Remove loading message
                document.querySelector('.loading').style.display = 'none';
                
                // Format the data for our dashboard
                const formattedData = formatPatientData(sensorData);
                console.log("Formatted data:", formattedData);
                
                // Update dashboard
                updateDashboard(formattedData);
                
                // Update chart with latest values
                updateChart(formattedData);
                
                // Update last updated time
                document.getElementById('last-updated').textContent = 
                    `Today at ${latestTimestamp}`;
                    
                console.log("Dashboard updated successfully!");
            } else {
                console.error("No timestamps found in date data");
                showTestData();
            }
        } else {
            console.error("No data found for this date");
            showTestData();
        }
    }, (error) => {
        console.error("Firebase connection error:", error);
        document.getElementById('connection-status').textContent = "Disconnected";
        document.querySelector('.status-dot').style.background = '#e74c3c';
        
        console.log("Showing test data due to Firebase error");
        showTestData();
    });

