// Due Dates Management Functions

let currentCardForDueDate = null;
let showingDueDatePicker = false;

// ==================== RENDER DUE DATE SECTION ====================

async function renderDueDateSection(card, container) {
    currentCardForDueDate = card;
    
    const dueDateHTML = `
        <div class="due-date-section">
            <div class="due-date-header">
                <div class="due-date-title">
                    <span>📅 Due Date</span>
                </div>
            </div>
            
            <div id="dueDateDisplayContainer">
                ${renderDueDateDisplay(card.due_date)}
            </div>
            
            <div id="dueDatePickerContainer" style="display: none;">
                ${renderDueDatePicker(card.due_date)}
            </div>
        </div>
    `;
    
    container.innerHTML = dueDateHTML;
}

// ==================== RENDER DUE DATE DISPLAY ====================

function renderDueDateDisplay(dueDate) {
    if (!dueDate) {
        return `
            <div class="due-date-display">
                <div class="due-date-empty">
                    <div class="due-date-empty-icon">📅</div>
                    <div class="due-date-empty-text">No due date set</div>
                </div>
                <button class="btn-due-date-action btn-set-due-date" onclick="showDueDatePicker()">
                    Set Due Date
                </button>
            </div>
        `;
    }
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    let statusClass = 'on-time';
    let statusText = 'On Time';
    
    if (diffMs < 0) {
        statusClass = 'overdue';
        statusText = 'Overdue';
    } else if (diffHours < 24) {
        statusClass = 'due-soon';
        statusText = 'Due Soon';
    }
    
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="due-date-display has-date ${statusClass}">
            <div class="due-date-info">
                <div class="due-date-icon">📅</div>
                <div class="due-date-text">
                    <div class="due-date-label">Due Date</div>
                    <div class="due-date-value ${statusClass}">
                        ${formattedDate} at ${formattedTime}
                    </div>
                    <span class="due-date-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="due-date-actions">
                <button class="btn-due-date-action" onclick="showDueDatePicker()">
                    Edit
                </button>
                <button class="btn-due-date-action" onclick="removeDueDate()">
                    Remove
                </button>
            </div>
        </div>
    `;
}

// ==================== RENDER DUE DATE PICKER ====================

function renderDueDatePicker(currentDueDate) {
    const now = new Date();
    const defaultDate = currentDueDate ? new Date(currentDueDate) : now;
    
    const dateString = defaultDate.toISOString().split('T')[0];
    const timeString = defaultDate.toTimeString().slice(0, 5);
    
    return `
        <div class="due-date-picker">
            <div class="due-date-picker-header">Set Due Date</div>
            
            <div class="quick-date-buttons">
                <button class="btn-quick-date" onclick="setQuickDate('today')">Today</button>
                <button class="btn-quick-date" onclick="setQuickDate('tomorrow')">Tomorrow</button>
                <button class="btn-quick-date" onclick="setQuickDate('next-week')">Next Week</button>
                <button class="btn-quick-date" onclick="setQuickDate('next-month')">Next Month</button>
            </div>
            
            <div class="due-date-input-group">
                <label class="due-date-input-label">Date</label>
                <input 
                    type="date" 
                    id="dueDateInput" 
                    class="due-date-input"
                    value="${dateString}"
                >
            </div>
            
            <div class="due-date-input-group">
                <label class="due-date-input-label">Time</label>
                <input 
                    type="time" 
                    id="dueTimeInput" 
                    class="due-date-time-input"
                    value="${timeString}"
                >
            </div>
            
            <div class="due-date-picker-buttons">
                <button class="btn-save-due-date" onclick="saveDueDate()">
                    Save
                </button>
                <button class="btn-cancel-due-date" onclick="hideDueDatePicker()">
                    Cancel
                </button>
            </div>
        </div>
    `;
}

// ==================== SHOW/HIDE PICKER ====================

function showDueDatePicker() {
    const displayContainer = document.getElementById('dueDateDisplayContainer');
    const pickerContainer = document.getElementById('dueDatePickerContainer');
    
    displayContainer.style.display = 'none';
    pickerContainer.style.display = 'block';
    pickerContainer.innerHTML = renderDueDatePicker(currentCardForDueDate.due_date);
    
    showingDueDatePicker = true;
}

function hideDueDatePicker() {
    const displayContainer = document.getElementById('dueDateDisplayContainer');
    const pickerContainer = document.getElementById('dueDatePickerContainer');
    
    displayContainer.style.display = 'block';
    pickerContainer.style.display = 'none';
    
    showingDueDatePicker = false;
}

// ==================== QUICK DATE SETTERS ====================

function setQuickDate(option) {
    const now = new Date();
    let targetDate = new Date();
    
    switch(option) {
        case 'today':
            targetDate.setHours(17, 0, 0, 0); // 5 PM today
            break;
        case 'tomorrow':
            targetDate.setDate(now.getDate() + 1);
            targetDate.setHours(9, 0, 0, 0); // 9 AM tomorrow
            break;
        case 'next-week':
            targetDate.setDate(now.getDate() + 7);
            targetDate.setHours(9, 0, 0, 0);
            break;
        case 'next-month':
            targetDate.setMonth(now.getMonth() + 1);
            targetDate.setHours(9, 0, 0, 0);
            break;
    }
    
    const dateString = targetDate.toISOString().split('T')[0];
    const timeString = targetDate.toTimeString().slice(0, 5);
    
    document.getElementById('dueDateInput').value = dateString;
    document.getElementById('dueTimeInput').value = timeString;
}

// ==================== SAVE DUE DATE ====================

async function saveDueDate() {
    const dateInput = document.getElementById('dueDateInput').value;
    const timeInput = document.getElementById('dueTimeInput').value;
    
    if (!dateInput || !timeInput) {
        alert('Please select both date and time');
        return;
    }
    
    const dueDateString = `${dateInput}T${timeInput}:00`;
    const dueDate = new Date(dueDateString);
    
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${currentCardForDueDate.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                due_date: dueDate.toISOString()
            })
        });
        
        if (response.ok) {
            const updatedCard = await response.json();
            currentCardForDueDate.due_date = updatedCard.due_date;
            
            hideDueDatePicker();
            
            // Update display
            const displayContainer = document.getElementById('dueDateDisplayContainer');
            displayContainer.innerHTML = renderDueDateDisplay(updatedCard.due_date);
            
            // Reload the card to update badges
            await loadCards(currentCardForDueDate.list_id);
            
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not save due date'));
        }
        
    } catch (error) {
        console.error('Error saving due date:', error);
        alert('Error saving due date');
    }
}

// ==================== REMOVE DUE DATE ====================

async function removeDueDate() {
    if (!confirm('Are you sure you want to remove the due date?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${currentCardForDueDate.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                due_date: null
            })
        });
        
        if (response.ok) {
            currentCardForDueDate.due_date = null;
            
            // Update display
            const displayContainer = document.getElementById('dueDateDisplayContainer');
            displayContainer.innerHTML = renderDueDateDisplay(null);
            
            // Reload the card to update badges
            await loadCards(currentCardForDueDate.list_id);
            
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not remove due date'));
        }
        
    } catch (error) {
        console.error('Error removing due date:', error);
        alert('Error removing due date');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getDueDateStatus(dueDate) {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) {
        return 'overdue';
    } else if (diffHours < 24) {
        return 'due-soon';
    }
    
    return 'on-time';
}

function formatDueDateForBadge(dueDate) {
    const date = new Date(dueDate);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    
    return `${month} ${day}`;
}

console.log('Due dates module loaded');