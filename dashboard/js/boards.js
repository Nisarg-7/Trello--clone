// Board Management Functions

async function loadBoards() {
    try {
        const response = await fetch(`${API_BASE_URL}/boards?user_id=${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        }); 
        const boards = await response.json();
        
        const boardsGrid = document.getElementById('boardsGrid');
        const createBoardCard = boardsGrid.querySelector('.create-board-card');
        
        boardsGrid.innerHTML = '';
        
        if (boards.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
        } else {
            document.getElementById('emptyState').style.display = 'none';
            
            boards.forEach(board => {
                const boardCard = document.createElement('div');
                boardCard.className = 'board-card';
                boardCard.style.background = colorMap[board.name.split('_')[1]] || colorMap['blue'];
                boardCard.onclick = () => openBoard(board);
                
                boardCard.innerHTML = `
                    <div class="board-card-overlay"></div>
                    <div class="board-card-content">${board.name.split('_')[0]}</div>
                    <div class="board-actions">
                        <button class="btn-icon" onclick="editBoard(event, ${JSON.stringify(board).replace(/"/g, '&quot;')})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="deleteBoard(event, ${board.id}, '${board.name.split('_')[0]}')" title="Delete">🗑️</button>
                    </div>
                `;
                
                boardsGrid.appendChild(boardCard);
            });
        }
        
        boardsGrid.appendChild(createBoardCard);
        
    } catch (error) {
        console.error('Error loading boards:', error);
        const demoBoards = [
            { id: '1', name: 'Project Tasks_blue', owner_user_id: currentUser.id },
            { id: '2', name: 'Marketing_green', owner_user_id: currentUser.id }
        ];
        renderDemoBoards(demoBoards);
    }
}

function renderDemoBoards(boards) {
    const boardsGrid = document.getElementById('boardsGrid');
    const createBoardCard = boardsGrid.querySelector('.create-board-card');
    boardsGrid.innerHTML = '';
    
    boards.forEach(board => {
        const boardCard = document.createElement('div');
        boardCard.className = 'board-card';
        boardCard.style.background = colorMap[board.name.split('_')[1]] || colorMap['blue'];
        boardCard.onclick = () => openBoard(board);
        
        boardCard.innerHTML = `
            <div class="board-card-overlay"></div>
            <div class="board-card-content">${board.name.split('_')[0]}</div>
        `;
        
        boardsGrid.appendChild(boardCard);
    });
    
    boardsGrid.appendChild(createBoardCard);
}

function openCreateBoardModal() {
    document.getElementById('createBoardModal').classList.add('active');
    document.getElementById('boardName').value = '';
    selectedBoardColor = 'blue';
}

function closeCreateBoardModal() {
    document.getElementById('createBoardModal').classList.remove('active');
}

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedBoardColor = element.getAttribute('data-color');
}

async function createBoard(event) {
    event.preventDefault();
    
    const boardName = document.getElementById('boardName').value;
    const boardNameWithColor = `${boardName}_${selectedBoardColor}`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                name: boardNameWithColor,
                is_public: false
            })
        });
        
        if (response.ok) {
            const board = await response.json();
            closeCreateBoardModal();
            loadBoards();
        }
    } catch (error) {
        console.error('Error creating board:', error);
        alert('Demo: Board created successfully!');
        closeCreateBoardModal();
        loadBoards();
    }
}

async function openBoard(board) {
    currentBoard = board;
    const boardTitle = board.name.split('_')[0];
    const boardColor = board.name.split('_')[1] || 'blue';
    
    document.getElementById('currentBoardTitle').textContent = boardTitle;
    document.getElementById('boardView').style.background = colorMap[boardColor];
    
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('boardView').classList.add('active');
    
    await loadLists(board.id);
}

function goToDashboard() {
    document.getElementById('boardView').classList.remove('active');
    document.getElementById('dashboardView').style.display = 'block';
    currentBoard = null;
}