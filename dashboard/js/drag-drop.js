let draggedElement = null;
let draggedType = null; // 'list' or 'card'
let draggedData = null;

// ==================== INITIALIZE DRAG & DROP ====================

function initializeDragAndDrop() {
    console.log('Drag & Drop initialized');
    
    // Add minimum height to all card containers to make them always droppable
    document.querySelectorAll('.list-cards').forEach(container => {
        container.style.minHeight = '60px';
    });
}

// ==================== LIST DRAG & DROP ====================

function makeListDraggable(listElement, list) {
    // IMPORTANT: Make only the header draggable, not the entire list
    const listHeader = listElement.querySelector('.list-header');
    
    if (!listHeader) {
        console.error('List header not found');
        return;
    }
    
    // Add drag handle to list header
    const listHeaderSpan = listHeader.querySelector('span');
    const dragHandle = document.createElement('span');
    dragHandle.className = 'list-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    listHeaderSpan.parentElement.insertBefore(dragHandle, listHeaderSpan);
    
    // Make the header draggable instead of the whole list
    listHeader.setAttribute('draggable', 'true');
    
    // Drag start - only from header
    listHeader.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Prevent bubbling
        
        draggedElement = listElement;
        draggedType = 'list';
        draggedData = list;
        
        listElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', listElement.innerHTML);
        
        // Add dragging class to container
        document.getElementById('listsContainer').classList.add('drag-active');
    });
    
    // Drag end
    listHeader.addEventListener('dragend', (e) => {
        e.stopPropagation(); // Prevent bubbling
        
        listElement.classList.remove('dragging');
        document.getElementById('listsContainer').classList.remove('drag-active');
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over-list').forEach(el => {
            el.classList.remove('drag-over-list');
        });
        
        draggedElement = null;
        draggedType = null;
        draggedData = null;
    });
    
    // Drag over (allow drop) - on list element
    listElement.addEventListener('dragover', (e) => {
        if (draggedType !== 'list') return;
        
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(listElement.parentElement, e.clientX, 'list');
        const listsContainer = document.getElementById('listsContainer');
        
        // Don't allow dropping after "Add new list" button
        if (afterElement == null) {
            // Check if there's an "Add new list" button and insert before it
            const addListButton = listsContainer.querySelector('.add-list-btn, [onclick*="showAddList"], .new-list-form');
            if (addListButton) {
                listsContainer.insertBefore(draggedElement, addListButton);
            } else {
                listsContainer.appendChild(draggedElement);
            }
        } else {
            listsContainer.insertBefore(draggedElement, afterElement);
        }
    });
    
    // Drag enter
    listElement.addEventListener('dragenter', (e) => {
        if (draggedType === 'list' && listElement !== draggedElement) {
            listElement.classList.add('drag-over-list');
        }
    });
    
    // Drag leave
    listElement.addEventListener('dragleave', (e) => {
        listElement.classList.remove('drag-over-list');
    });
    
    // Drop
    listElement.addEventListener('drop', async (e) => {
        if (draggedType !== 'list') return; // Only handle list drops
        
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling
        listElement.classList.remove('drag-over-list');
        
        await updateListPositions();
    });
}

// ==================== CARD DRAG & DROP ====================

function makeCardDraggable(cardElement, card) {
    cardElement.setAttribute('draggable', 'true');
    
    // Drag start
    cardElement.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // CRITICAL: Stop event from bubbling to list
        
        draggedElement = cardElement;
        draggedType = 'card';
        draggedData = card;
        
        cardElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', cardElement.innerHTML);
        
        // Add dragging class to all card containers and ensure they have min height
        document.querySelectorAll('.list-cards').forEach(container => {
            container.classList.add('drag-active');
            container.style.minHeight = '80px'; // Increase min height during drag
        });
    });
    
    // Drag end
    cardElement.addEventListener('dragend', (e) => {
        e.stopPropagation(); // CRITICAL: Stop event from bubbling to list
        
        cardElement.classList.remove('dragging');
        
        document.querySelectorAll('.list-cards').forEach(container => {
            container.classList.remove('drag-active');
            container.style.minHeight = '60px'; // Reset to normal min height
        });
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over-card, .drag-over-list').forEach(el => {
            el.classList.remove('drag-over-card', 'drag-over-list');
        });
        
        draggedElement = null;
        draggedType = null;
        draggedData = null;
    });
}

// Enable drop on card containers
function makeListCardsDroppable(cardsContainer, listId) {
    // Ensure container always has minimum height
    cardsContainer.style.minHeight = '60px';
    cardsContainer.style.padding = '4px';
    
    // Prevent default on entire list element to avoid red cursor
    const listElement = cardsContainer.closest('.list');
    if (listElement) {
        listElement.addEventListener('dragover', (e) => {
            if (draggedType === 'card') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        listElement.addEventListener('drop', (e) => {
            if (draggedType === 'card') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    // Drag over - ALWAYS allow drop when over a list
    cardsContainer.addEventListener('dragover', (e) => {
        if (draggedType !== 'card') return;
        
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const cards = [...cardsContainer.querySelectorAll('.card:not(.dragging)')];
        
        // If list is empty, just append to container
        if (cards.length === 0) {
            cardsContainer.classList.add('drag-over-list');
            // For empty lists, ensure dragged element is in the container
            if (draggedElement && !cardsContainer.contains(draggedElement)) {
                cardsContainer.appendChild(draggedElement);
            }
            return;
        }
        
        // Find the card to insert before
        const afterElement = cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
        
        // Insert the dragged card
        if (afterElement == null) {
            cardsContainer.appendChild(draggedElement);
        } else {
            cardsContainer.insertBefore(draggedElement, afterElement);
        }
    });
    
    // Drag enter - show visual feedback
    cardsContainer.addEventListener('dragenter', (e) => {
        if (draggedType === 'card') {
            e.preventDefault();
            e.stopPropagation();
            cardsContainer.classList.add('drag-over-list');
        }
    });
    
    // Drag leave - remove visual feedback only when leaving the container
    cardsContainer.addEventListener('dragleave', (e) => {
        if (draggedType === 'card') {
            // Only remove if we're actually leaving the container
            const rect = cardsContainer.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX >= rect.right ||
                e.clientY < rect.top ||
                e.clientY >= rect.bottom
            ) {
                cardsContainer.classList.remove('drag-over-list');
            }
        }
    });
    
    // Drop - ALWAYS allow drop
    cardsContainer.addEventListener('drop', async (e) => {
        if (draggedType !== 'card') return;
        
        e.preventDefault();
        e.stopPropagation();
        cardsContainer.classList.remove('drag-over-list');
        
        const newListId = parseInt(cardsContainer.id.replace('list-cards-', ''));
        const oldListId = draggedData.list_id;
        
        // Make sure the card is in the container
        if (!cardsContainer.contains(draggedElement)) {
            cardsContainer.appendChild(draggedElement);
        }
        
        // Update card's list_id if moved to different list
        if (newListId !== oldListId) {
            await moveCardToList(draggedData.id, newListId);
            // Update positions in both lists
            await updateCardPositions(newListId);
            await updateCardPositions(oldListId);
        } else {
            // Just update positions in the same list
            await updateCardPositions(newListId);
        }
    });
}

// ==================== HELPER FUNCTIONS ====================

function getDragAfterElement(container, position, type) {
    const draggableElements = [
        ...container.querySelectorAll(
            type === 'list' 
                ? '.list:not(.dragging)' 
                : '.card:not(.dragging)'
        )
    ];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = type === 'list' 
            ? position - box.left - box.width / 2
            : position - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ==================== UPDATE POSITIONS (API CALLS) ====================

async function updateListPositions() {
    const listsContainer = document.getElementById('listsContainer');
    const listElements = listsContainer.querySelectorAll('.list');
    
    const updates = [];
    listElements.forEach((listEl, index) => {
        const listId = listEl.querySelector('.list-cards').id.replace('list-cards-', '');
        if (listId && listId !== '') {
            updates.push({
                id: parseInt(listId),
                position: index
            });
        }
    });
    
    // Update positions in backend
    for (const update of updates) {
        try {
            await fetch(`${API_BASE_URL}/lists/${update.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    position: update.position
                })
            });
        } catch (error) {
            console.error('Error updating list position:', error);
        }
    }
    
    console.log('List positions updated');
}

async function updateCardPositions(listId) {
    const cardsContainer = document.getElementById(`list-cards-${listId}`);
    if (!cardsContainer) {
        console.error('Cards container not found for list:', listId);
        return;
    }
    
    const cardElements = cardsContainer.querySelectorAll('.card:not(.dragging)');
    
    const updates = [];
    cardElements.forEach((cardEl, index) => {
        const cardId = extractCardId(cardEl);
        if (cardId) {
            updates.push({
                id: cardId,
                position: index
            });
        }
    });
    
    // Update positions in backend
    for (const update of updates) {
        try {
            await fetch(`${API_BASE_URL}/cards/${update.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    position: update.position
                })
            });
        } catch (error) {
            console.error('Error updating card position:', error);
        }
    }
    
    console.log('Card positions updated for list:', listId);
}

async function moveCardToList(cardId, newListId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                list_id: newListId
            })
        });
        
        if (response.ok) {
            console.log('Card moved to new list');
            draggedData.list_id = newListId;
        }
    } catch (error) {
        console.error('Error moving card to list:', error);
    }
}

// Extract card ID from card element
function extractCardId(cardElement) {
    // Try to get from onclick attribute
    const onclickAttr = cardElement.getAttribute('onclick');
    if (onclickAttr) {
        const match = onclickAttr.match(/openCardDetail\((\{[^}]+\})\)/);
        if (match) {
            try {
                const cardData = JSON.parse(match[1].replace(/&quot;/g, '"'));
                return cardData.id;
            } catch (e) {
                console.error('Error parsing card data:', e);
            }
        }
    }
    
    // Fallback: try to get from data attribute if added
    return cardElement.dataset.cardId || null;
}

// Initialize drag and drop when page loads
initializeDragAndDrop();