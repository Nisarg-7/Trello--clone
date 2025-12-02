// Edit and Delete Functionality

// ========== BOARD EDIT/DELETE ==========

function editBoard(event, board) {
    event.stopPropagation();
    
    editingBoardId = board.id;
    const boardName = board.name.split('_')[0];
    const boardColor = board.name.split('_')[1] || 'blue';
    
    document.getElementById('editBoardName').value = boardName;
    selectedEditColor = boardColor;
    
    document.querySelectorAll('#editColorPicker .color-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`#editColorPicker .color-option[data-color="${boardColor}"]`)?.classList.add('selected');
    
    document.getElementById('editBoardModal').classList.add('active');
}

function selectEditColor(element) {
    document.querySelectorAll('#editColorPicker .color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedEditColor = element.getAttribute('data-color');
}

async function saveEditBoard() {
    const boardName = document.getElementById('editBoardName').value.trim();
    
    if (!boardName) {
        alert('Please enter a board name');
        return;
    }
    
    const boardNameWithColor = `${boardName}_${selectedEditColor}`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/boards/${editingBoardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                name: boardNameWithColor
            })
        });
        
        if (response.ok) {
            closeEditBoardModal();
            loadBoards();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not update board'));
        }
    } catch (error) {
        console.error('Error updating board:', error);
        alert('Error updating board');
    }
}

function closeEditBoardModal() {
    document.getElementById('editBoardModal').classList.remove('active');
    editingBoardId = null;
}

function deleteBoard(event, boardId, boardName) {
    event.stopPropagation();
    
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${boardName}"? This will delete all lists and cards in this board.`;
    document.getElementById('confirmDeleteModal').classList.add('active');
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                closeConfirmDeleteModal();
                loadBoards();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'Could not delete board'));
            }
        } catch (error) {
            console.error('Error deleting board:', error);
            alert('Error deleting board');
        }
    };
}

// ========== LIST EDIT/DELETE ==========

function editList(event, listId, listName) {
    event.stopPropagation();
    
    editingListId = listId;
    document.getElementById('editListName').value = listName;
    document.getElementById('editListModal').classList.add('active');
}

async function saveEditList() {
    const listName = document.getElementById('editListName').value.trim();
    
    if (!listName) {
        alert('Please enter a list name');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/lists/${editingListId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                name: listName
            })
        });
        
        if (response.ok) {
            closeEditListModal();
            await loadLists(currentBoard.id);
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not update list'));
        }
    } catch (error) {
        console.error('Error updating list:', error);
        alert('Error updating list');
    }
}

function closeEditListModal() {
    document.getElementById('editListModal').classList.remove('active');
    editingListId = null;
}

function deleteList(listId, listName) {
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${listName}"? This will delete all cards in this list.`;
    document.getElementById('confirmDeleteModal').classList.add('active');
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                closeConfirmDeleteModal();
                await loadLists(currentBoard.id);
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'Could not delete list'));
            }
        } catch (error) {
            console.error('Error deleting list:', error);
            alert('Error deleting list');
        }
    };
}

// ========== CARD EDIT/DELETE ==========

function editCard(event, card) {
    event.stopPropagation();
    
    editingCardId = card.id;
    document.getElementById('editCardTitle').value = card.title;
    document.getElementById('editCardDescription').value = card.description || '';
    document.getElementById('editCardModal').classList.add('active');
}

async function saveEditCard() {
    const title = document.getElementById('editCardTitle').value.trim();
    const description = document.getElementById('editCardDescription').value.trim();
    
    if (!title) {
        alert('Please enter a card title');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${editingCardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                title: title,
                description: description
            })
        });
        
        if (response.ok) {
            closeEditCardModal();
            const card = await response.json();
            await loadCards(card.list_id);
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not update card'));
        }
    } catch (error) {
        console.error('Error updating card:', error);
        alert('Error updating card');
    }
}

function closeEditCardModal() {
    document.getElementById('editCardModal').classList.remove('active');
    editingCardId = null;
}

function deleteCard(event, cardId, cardTitle, listId) {
    event.stopPropagation();
    
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${cardTitle}"?`;
    document.getElementById('confirmDeleteModal').classList.add('active');
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                closeConfirmDeleteModal();
                await loadCards(listId);
            } else {
                const error = await response.json();
                alert('Error: ' + (error.detail || 'Could not delete card'));
            }
        } catch (error) {
            console.error('Error deleting card:', error);
            alert('Error deleting card');
        }
    };
}

// ========== CONFIRM DELETE MODAL ==========

function confirmDelete() {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
    }
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').classList.remove('active');
    deleteCallback = null;
}