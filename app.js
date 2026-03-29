let currentSession = null;
let sessions = [];

// Load sessions from localStorage
function loadSessions() {
    const saved = localStorage.getItem('timesheetSessions');
    if (saved) {
        sessions = JSON.parse(saved);
    }
}

// Save sessions to localStorage
function saveSessions() {
    localStorage.setItem('timesheetSessions', JSON.stringify(sessions));
}

// Update clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format datetime
function formatDateTime(date) {
    return date.toLocaleString('en-US', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// Calculate duration
function calculateDuration(start, end) {
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, text: `${hours}h ${minutes}m` };
}

// Punch In
function punchIn() {
    if (currentSession) {
        alert('You are already punched in! Please punch out first.');
        return;
    }
    
    currentSession = {
        punchInTime: new Date(),
        punchOutTime: null
    };
    
    updateStatus();
    showNotification('✓ Punched In Successfully', 'success');
}

// Punch Out
function punchOut() {
    if (!currentSession) {
        alert('You are not punched in! Please punch in first.');
        return;
    }
    
    currentSession.punchOutTime = new Date();
    
    sessions.push({
        date: currentSession.punchInTime.toLocaleDateString(),
        punchInTime: currentSession.punchInTime,
        punchOutTime: currentSession.punchOutTime,
        duration: calculateDuration(currentSession.punchInTime, currentSession.punchOutTime)
    });
    
    saveSessions();
    showNotification('✓ Punched Out Successfully', 'success');
    
    currentSession = null;
    updateStatus();
    renderSessions();
}

// Update Status Display
function updateStatus() {
    const statusBox = document.getElementById('statusBox');
    const statusText = document.getElementById('statusText');
    
    if (currentSession) {
        const elapsed = calculateDuration(currentSession.punchInTime, new Date());
        statusBox.className = 'status-box in';
        statusText.innerHTML = `
            <div>Status: <strong>PUNCHED IN</strong></div>
            <div style="font-size: 0.9em; margin-top: 8px;">
                Started: ${formatDateTime(currentSession.punchInTime)}<br>
                Elapsed: ${elapsed.text}
            </div>
        `;
    } else {
        statusBox.className = 'status-box out';
        statusText.textContent = '✓ Ready to Punch In';
    }
}

// Show Notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Render Sessions
function renderSessions() {
    const container = document.getElementById('sessionsContainer');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="empty-message">No sessions recorded yet</p>';
        return;
    }
    
    // Group by date
    const grouped = {};
    sessions.forEach(session => {
        if (!grouped[session.date]) grouped[session.date] = [];
        grouped[session.date].push(session);
    });
    
    let html = '';
    
    Object.keys(grouped).reverse().forEach(date => {
        let totalHours = 0, totalMinutes = 0;
        
        grouped[date].forEach(s => {
            totalHours += s.duration.hours;
            totalMinutes += s.duration.minutes;
        });
        
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
        
        html += `
            <div class="session-group">
                <div class="date-header">
                    <span>${date}</span>
                    <span class="daily-total">${totalHours}h ${totalMinutes}m</span>
                </div>
        `;
        
        grouped[date].forEach(session => {
            html += `
                <div class="session-item completed">
                    <div class="session-times">
                        <span><strong>In:</strong> ${formatDateTime(session.punchInTime)}</span>
                        <span><strong>Out:</strong> ${formatDateTime(session.punchOutTime)}</span>
                    </div>
                    <div class="session-duration">⏱️ Duration: ${session.duration.text}</div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Download CSV Report
function downloadCSV() {
    if (sessions.length === 0) {
        alert('No sessions to download');
        return;
    }
    
    let csv = 'Date,Punch In,Punch Out,Duration (Hours),Duration (Minutes)\n';
    
    sessions.forEach(session => {
        csv += \
            `"${session.date}","${formatDateTime(session.punchInTime)}","${formatDateTime(session.punchOutTime)}","${session.duration.hours}","${session.duration.minutes}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Download PDF Report
function downloadPDF() {
    if (sessions.length === 0) {
        alert('No sessions to download');
        return;
    }
    
    let html = `
        <h1>Timesheet Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #667eea; color: white;">
                    <th style="border: 1px solid #ddd; padding: 10px;">Date</th>
                    <th style="border: 1px solid #ddd; padding: 10px;">Punch In</th>
                    <th style="border: 1px solid #ddd; padding: 10px;">Punch Out</th>
                    <th style="border: 1px solid #ddd; padding: 10px;">Duration</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sessions.forEach(session => {
        html += `
            <tr style="background-color: ${sessions.indexOf(session) % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${session.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${formatDateTime(session.punchInTime)}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${formatDateTime(session.punchOutTime)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${session.duration.text}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
        margin: 10,
        filename: `timesheet-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Clear All Sessions
function clearAllSessions() {
    if (confirm('Are you sure you want to delete all sessions? This cannot be undone.')) {
        sessions = [];
        currentSession = null;
        saveSessions();
        renderSessions();
        updateStatus();
        showNotification('All sessions cleared', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    
    document.getElementById('punchInBtn').addEventListener('click', punchIn);
    document.getElementById('punchOutBtn').addEventListener('click', punchOut);
    document.getElementById('downloadCSVBtn').addEventListener('click', downloadCSV);
    document.getElementById('downloadPDFBtn').addEventListener('click', downloadPDF);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllSessions);
    
    setInterval(updateClock, 1000);
    setInterval(updateStatus, 1000);
    
    updateClock();
    updateStatus();
    renderSessions();
});
