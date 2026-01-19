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
    // Function to format patient data for dashboard
    function formatPatientData(patientData) {
        console.log("Raw patient data:", patientData);
        
        // If data is null or empty
        if (!patientData) {
            console.warn("No patient data found");
            return {};
        }
        
        // Try different possible structures
        const formatted = {};
        
        // Structure 1: Direct values (temperature: 37.5)
        Object.keys(patientData).forEach(key => {
            const value = patientData[key];
            
            if (typeof value === 'number') {
                formatted[key] = {
                    value: value,
                    status: getStatus(key, value),
                    unit: getUnit(key)
                };
            }
            // Structure 2: Object values (temperature: {value: 37.5})
            else if (value && typeof value === 'object' && value.value !== undefined) {
                formatted[key] = {
                    value: value.value,
                    status: value.status || getStatus(key, value.value),
                    unit: value.unit || getUnit(key)
                };
            }
        });
        
        console.log("Formatted data:", formatted);
        return formatted;
    }

    // Helper function to determine status
    function getStatus(sensorName, value) {
        const thresholds = {
            temperature: { min: 36, max: 38, normal: 37 },
            heart_rate: { min: 60, max: 100, normal: 72 },
            spo2: { min: 95, max: 100, normal: 98 },
            bp_systolic: { min: 90, max: 120, normal: 110 },
            bp_diastolic: { min: 60, max: 80, normal: 70 },
            respiratory_rate: { min: 12, max: 20, normal: 16 },
            glucose: { min: 70, max: 140, normal: 100 }
        };
        
        const threshold = thresholds[sensorName] || { min: 0, max: 100 };
        
        if (value < threshold.min || value > threshold.max) {
            return "alert";
        } else if (threshold.normal && Math.abs(value - threshold.normal) > (threshold.normal * 0.1)) {
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
    // CHANGE THIS PATH TO MATCH YOUR DATA
    const patientRef = database.ref('patients/patient_001/2026-01-19');
    
    patientRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("Received patient data:", data);
        
        if (data) {
            // Remove loading message
            document.querySelector('.loading').style.display = 'none';
            
            // Format the data for our dashboard
            const formattedData = formatPatientData(data);
            
            // Update dashboard
            updateDashboard(formattedData);
            
            // Update chart
            updateChart(formattedData);
            
            // Update last updated time
            document.getElementById('last-updated').textContent = 
                new Date().toLocaleTimeString();
        }
    }, (error) => {
        console.error("Firebase error:", error);
        document.getElementById('connection-status').textContent = "Disconnected";
        document.querySelector('.status-dot').style.background = '#e74c3c';
        
        // Show test data if Firebase fails
        console.log("Showing test data due to Firebase error");
        showTestData();
    });

    // Test data fallback function
    function showTestData() {
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
            bp_systolic: { 
                value: 120, 
                status: "normal",
                unit: "mmHg"
            },
            bp_diastolic: { 
                value: 80, 
                status: "normal",
                unit: "mmHg"
            }
        };
        
        // Remove loading message
        document.querySelector('.loading').style.display = 'none';
        
        // Update dashboard with test data
        updateDashboard(testData);
        
        // Add some history to chart
        for (let i = 0; i < 10; i++) {
            updateChart(testData);
        }
        
        // Update last updated time
        document.getElementById('last-updated').textContent = 
            new Date().toLocaleTimeString();
    }
});
