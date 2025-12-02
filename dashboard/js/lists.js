async function loadLists(boardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/boards/${boardId}/lists`);
        const lists = await response.json();
        
        const listsContainer = document.getElementById('listsContainer');
        listsContainer.innerHTML = '';
        
        for (const list of lists) {
            await renderList(list);
        }
        
        const addListBtn = document.createElement('button');
        addListBtn.className = 'add-list-btn';
        addListBtn.textContent = '+ Add a list';
        addListBtn.onclick = showAddListForm;
        listsContainer.appendChild(addListBtn);
        
    } catch (error) {
        console.error('Error loading lists:', error);
        const listsContainer = document.getElementById('listsContainer');
        listsContainer.innerHTML = '<button class="add-list-btn" onclick="showAddListForm()">+ Add a list</button>';
    }
}

async function renderList(list) {
    const listsContainer = document.getElementById('listsContainer');
    
    const listEl = document.createElement('div');
    listEl.className = 'list';
    listEl.innerHTML = `
        <div class="list-header">
            <span>${list.name}</span>
            <div class="list-actions">
                <button class="btn-list-action" onclick="editList(event, ${list.id}, '${list.name}')" title="Edit">✏️</button>
                <button class="btn-list-action" onclick="deleteList(${list.id}, '${list.name}')" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="list-cards" id="list-cards-${list.id}">
        </div>
        <button class="add-card-btn" onclick="showAddCardForm('${list.id}')">+ Add a card</button>
    `;
    
    listsContainer.insertBefore(listEl, listsContainer.lastChild);

    makeListDraggable(listEl, list);
    const cardsContainer = listEl.querySelector('.list-cards');
    makeListCardsDroppable(cardsContainer, list.id);

    await loadCards(list.id);
}

function showAddListForm() {
    const listsContainer = document.getElementById('listsContainer');
    const addListBtn = listsContainer.querySelector('.add-list-btn');
    
    const listForm = document.createElement('div');
    listForm.className = 'list';
    listForm.innerHTML = `
        <input type="text" class="card-input" placeholder="Enter list title..." id="newListName" style="min-height: 40px;">
        <div class="btn-group">
            <button class="btn-small btn-primary-small" onclick="createList()">Add list</button>
            <button class="btn-small btn-cancel" onclick="cancelAddList()">✕</button>
        </div>
    `;
    
    listsContainer.insertBefore(listForm, addListBtn);
    addListBtn.style.display = 'none';
    document.getElementById('newListName').focus();
}

function cancelAddList() {
    const listsContainer = document.getElementById('listsContainer');
    const listForm = listsContainer.querySelector('.list:last-of-type');
    const addListBtn = listsContainer.querySelector('.add-list-btn');
    
    listForm.remove();
    addListBtn.style.display = 'block';
}

async function createList() {
    const listName = document.getElementById('newListName').value.trim();
    
    if (!listName) {
        alert('Please enter a list name');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/boards/${currentBoard.id}/lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: listName,
                position: Math.floor(Date.now() / 1000)
            })
        });
        
        if (response.ok) {
            const list = await response.json();
            cancelAddList();
            await renderList(list);
        }
    } catch (error) {
        console.error('Error creating list:', error);
        const demoList = {
            id: Date.now(),
            name: listName,
            board_id: currentBoard.id,
            position: Date.now()
        };
        cancelAddList();
        await renderList(demoList);
    }
}