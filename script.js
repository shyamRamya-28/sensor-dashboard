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
                label: 'Sensor Value',
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

        // TEMPORARY TEST DATA - Remove when connecting to real Firebase
    console.log("Using test data - Firebase not configured yet");
    
    const testData = {
        temperature_sensor: { 
            value: 24.5, 
            status: "normal",
            unit: "°C"
        },
        humidity_sensor: { 
            value: 65, 
            status: "normal",
            unit: "%"
        },
        pressure_sensor: { 
            value: 1013, 
            status: "normal",
            unit: "hPa"
        },
        co2_sensor: { 
            value: 420, 
            status: "normal",
            unit: "ppm"
        },
        water_level: { 
            value: 85, 
            status: "warning",
            unit: "%"
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
    
    /*
    // REAL FIREBASE CODE - Uncomment when ready
    const sensorRef = database.ref('sensors');
    
    sensorRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("Received data:", data);
        
        if (data) {
            document.querySelector('.loading').style.display = 'none';
            updateDashboard(data);
            updateChart(data);
            document.getElementById('last-updated').textContent = 
                new Date().toLocaleTimeString();
        }
    }, (error) => {
        console.error("Firebase error:", error);
        document.getElementById('connection-status').textContent = "Disconnected";
        document.querySelector('.status-dot').style.background = '#e74c3c';
    });
    */
    // Function to update dashboard cards
    function updateDashboard(data) {
        const dashboard = document.querySelector('.dashboard');
        
        // Clear existing cards except loading
        const loading = document.querySelector('.loading');
        loading.style.display = 'none';
        
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
                ${getSensorValue(sensorData)}
                <span class="sensor-unit">${getUnit(sensorName)}</span>
            </div>
            <div class="sensor-footer">
                <span>Sensor ID: ${sensorName}</span>
                <span>Updated: Just now</span>
            </div>
        `;
        
        return card;
    }

    // Helper functions
    function getSensorIcon(sensorName) {
        const icons = {
            temperature: 'fas fa-thermometer-half',
            humidity: 'fas fa-tint',
            pressure: 'fas fa-tachometer-alt',
            co2: 'fas fa-smog',
            motion: 'fas fa-running',
            light: 'fas fa-lightbulb',
            default: 'fas fa-microchip'
        };
        
        const name = sensorName.toLowerCase();
        for (const [key, icon] of Object.entries(icons)) {
            if (name.includes(key)) return icon;
        }
        return icons.default;
    }

    function formatSensorName(name) {
        return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function getSensorValue(data) {
        if (typeof data === 'object' && data.value !== undefined) {
            return data.value;
        }
        return typeof data === 'object' ? JSON.stringify(data) : data;
    }

    function getUnit(sensorName) {
        const units = {
            temperature: '°C',
            humidity: '%',
            pressure: 'hPa',
            co2: 'ppm',
            default: 'units'
        };
        
        const name = sensorName.toLowerCase();
        for (const [key, unit] of Object.entries(units)) {
            if (name.includes(key)) return unit;
        }
        return units.default;
    }

    function getStatusBadge(data) {
        const value = typeof data === 'object' ? data.value : data;
        const status = typeof data === 'object' ? data.status : 'normal';
        
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
        const value = typeof firstSensor === 'object' ? firstSensor.value : firstSensor;
        
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

});
