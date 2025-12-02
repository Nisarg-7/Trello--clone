async function loadCards(listId) {
    try {
        const response = await fetch(`${API_BASE_URL}/lists/${listId}/cards`);
        const cards = await response.json();
        
        const cardsContainer = document.getElementById(`list-cards-${listId}`);
        cardsContainer.innerHTML = '';
        
        cards.forEach(card => {
            renderCard(card, cardsContainer);
        });
        
    } catch (error) {
        console.error('Error loading cards:', error);
    }
}

function renderCard(card, container) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.onclick = () => openCardDetail(card);

    cardEl.dataset.cardId = card.id;
    
    let badgesHTML = '<div class="card-badges">';
    
    if (card.description) {
        badgesHTML += '<span class="card-badge">📝</span>';
    }

    // Due date badge with status
    if (card.due_date) {
        const dueDate = new Date(card.due_date);
        const now = new Date();
        const isOverdue = dueDate < now;
        const diffHours = (dueDate - now) / (1000 * 60 * 60);
        const isDueSoon = diffHours > 0 && diffHours < 24;
        
        let statusClass = 'on-time';
        if (isOverdue) statusClass = 'overdue';
        else if (isDueSoon) statusClass = 'due-soon';
        
        badgesHTML += `<span class="card-badge due-date-badge ${statusClass}">🗓️ ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
    }
    
    if (card.comments_count > 0) {
        badgesHTML += `<span class="card-badge card-badge-comments">💬 ${card.comments_count}</span>`;
    }
    
    
    
    badgesHTML += '</div>';
    
    cardEl.innerHTML = `
        <div class="card-title">${card.title}</div>
        ${badgesHTML}
        <div class="card-actions">
            <button class="btn-card-action" onclick="editCard(event, ${JSON.stringify(card).replace(/"/g, '&quot;')})" title="Edit">✏️</button>
            <button class="btn-card-action" onclick="deleteCard(event, ${card.id}, '${card.title}', ${card.list_id})" title="Delete">🗑️</button>
        </div>
    `;
    
    container.appendChild(cardEl);

    makeCardDraggable(cardEl, card);
}

function showAddCardForm(listId) {
    const cardsContainer = document.getElementById(`list-cards-${listId}`);
    const list = cardsContainer.closest('.list');
    const addCardBtn = list.querySelector('.add-card-btn');
    
    const cardForm = document.createElement('div');
    cardForm.innerHTML = `
        <textarea class="card-input" placeholder="Enter a title for this card..." id="newCardTitle-${listId}"></textarea>
        <div class="btn-group">
            <button class="btn-small btn-primary-small" onclick="createCard('${listId}')">Add card</button>
            <button class="btn-small btn-cancel" onclick="cancelAddCard('${listId}')">✕</button>
        </div>
    `;
    
    cardsContainer.appendChild(cardForm);
    addCardBtn.style.display = 'none';
    document.getElementById(`newCardTitle-${listId}`).focus();
}

function cancelAddCard(listId) {
    const cardsContainer = document.getElementById(`list-cards-${listId}`);
    const list = cardsContainer.closest('.list');
    const cardForm = cardsContainer.lastChild;
    const addCardBtn = list.querySelector('.add-card-btn');
    
    cardForm.remove();
    addCardBtn.style.display = 'block';
}

async function createCard(listId) {
    const cardTitle = document.getElementById(`newCardTitle-${listId}`).value.trim();
    
    if (!cardTitle) {
        alert('Please enter a card title');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/lists/${listId}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: cardTitle,
                description: '',
                is_active: true
            })
        });
        
        if (response.ok) {
            const card = await response.json();
            cancelAddCard(listId);
            const cardsContainer = document.getElementById(`list-cards-${listId}`);
            renderCard(card, cardsContainer);
        }
    } catch (error) {
        console.error('Error creating card:', error);
        const demoCard = {
            id: Date.now(),
            title: cardTitle,
            description: '',
            list_id: listId,
            labels: [],
            comments_count: 0,
            checklist_total: 0,
            checklist_completed: 0,
            attachments_count: 0
        };
        cancelAddCard(listId);
        const cardsContainer = document.getElementById(`list-cards-${listId}`);
        renderCard(demoCard, cardsContainer);
    }
}

// ==================== DESCRIPTION SECTION ====================

async function renderDescriptionSection(card, container) {
    const hasDescription = card.description && card.description.trim() !== '';
    
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 8px; color: #172b4d; display: flex; align-items: center; gap: 8px;">
                <span>📝</span> Description
            </h4>
            
            ${!hasDescription ? `
                <button 
                    onclick="showDescriptionEditor(${card.id})"
                    style="
                        width: 100%;
                        padding: 12px;
                        background: #f4f5f7;
                        border: none;
                        border-radius: 4px;
                        color: #5e6c84;
                        cursor: pointer;
                        text-align: left;
                        font-size: 14px;
                        transition: background 0.2s;
                    "
                    onmouseover="this.style.background='#e4e6ea'"
                    onmouseout="this.style.background='#f4f5f7'"
                >
                    Add a more detailed description...
                </button>
            ` : `
                <div id="descriptionDisplay-${card.id}" style="position: relative;">
                    <div 
                        style="
                            padding: 12px;
                            background: #f4f5f7;
                            border-radius: 4px;
                            color: #172b4d;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                            cursor: pointer;
                            transition: background 0.2s;
                        "
                        onclick="showDescriptionEditor(${card.id})"
                        onmouseover="this.style.background='#e4e6ea'"
                        onmouseout="this.style.background='#f4f5f7'"
                    >${card.description}</div>
                    <button
                        onclick="showDescriptionEditor(${card.id})"
                        style="
                            margin-top: 8px;
                            padding: 6px 12px;
                            background: #0079bf;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.background='#026aa7'"
                        onmouseout="this.style.background='#0079bf'"
                    >
                        Edit
                    </button>
                </div>
            `}
            
            <!-- Description Editor (Hidden by default) -->
            <div id="descriptionEditor-${card.id}" style="display: none;">
                <textarea
                    id="descriptionInput-${card.id}"
                    placeholder="Add a more detailed description..."
                    style="
                        width: 100%;
                        min-height: 120px;
                        padding: 12px;
                        border: 2px solid #0079bf;
                        border-radius: 4px;
                        font-size: 14px;
                        font-family: inherit;
                        resize: vertical;
                        box-sizing: border-box;
                    "
                >${card.description || ''}</textarea>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button
                        onclick="saveDescription(${card.id})"
                        style="
                            padding: 8px 16px;
                            background: #0079bf;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.background='#026aa7'"
                        onmouseout="this.style.background='#0079bf'"
                    >
                        Save
                    </button>
                    <button
                        onclick="cancelDescriptionEdit(${card.id})"
                        style="
                            padding: 8px 16px;
                            background: #f4f5f7;
                            color: #172b4d;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.background='#e4e6ea'"
                        onmouseout="this.style.background='#f4f5f7'"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showDescriptionEditor(cardId) {
    const editor = document.getElementById(`descriptionEditor-${cardId}`);
    const display = document.getElementById(`descriptionDisplay-${cardId}`);
    
    if (editor) {
        editor.style.display = 'block';
        const textarea = document.getElementById(`descriptionInput-${cardId}`);
        if (textarea) {
            textarea.focus();
            // Move cursor to end
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }
    
    if (display) {
        display.style.display = 'none';
    }
}

function cancelDescriptionEdit(cardId) {
    const editor = document.getElementById(`descriptionEditor-${cardId}`);
    const display = document.getElementById(`descriptionDisplay-${cardId}`);
    
    if (editor) {
        editor.style.display = 'none';
    }
    
    if (display) {
        display.style.display = 'block';
    }
}

async function saveDescription(cardId) {
    const textarea = document.getElementById(`descriptionInput-${cardId}`);
    const description = textarea.value.trim();
    
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                description: description
            })
        });
        
        if (response.ok) {
            const updatedCard = await response.json();
            
            // Update the card in the board view
            const cardElement = document.querySelector(`[onclick*="openCardDetail"][onclick*='"id":${cardId}']`);
            if (cardElement) {
                // Update card data if stored
                const cardData = extractCardDataFromElement(cardElement);
                if (cardData) {
                    cardData.description = description;
                }
            }
            
            // Refresh the description section
            const container = document.getElementById(`descriptionEditor-${cardId}`).parentElement;
            await renderDescriptionSection({ id: cardId, description: description }, container);
            
            console.log('Description saved successfully');
        } else {
            alert('Failed to save description. Please try again.');
        }
    } catch (error) {
        console.error('Error saving description:', error);
        alert('Error saving description. Please try again.');
    }
}

// Helper function to extract card data from element
function extractCardDataFromElement(element) {
    const onclickAttr = element.getAttribute('onclick');
    if (onclickAttr) {
        const match = onclickAttr.match(/openCardDetail\((\{[^}]+\})\)/);
        if (match) {
            try {
                return JSON.parse(match[1].replace(/&quot;/g, '"'));
            } catch (e) {
                console.error('Error parsing card data:', e);
            }
        }
    }
    return null;
}

// ==================== openCardDetail FUNCTION ====================

async function openCardDetail(card) {
    document.getElementById('cardDetailTitle').textContent = card.title;
    
    try {
        const [comments] = await Promise.all([
            fetch(`${API_BASE_URL}/cards/${card.id}/comments`).then(r => r.json()).catch(() => []),
        ]);
        
        const detailBody = document.getElementById('cardDetailBody');
        detailBody.innerHTML = `
            <div id="descriptionSectionContainer">
                <!-- Description section will be loaded here -->
            </div>
           
            <div id="dueDateSectionContainer">
                <!-- Due date section will be loaded here -->
            </div>
            
            <div>
                <h4 style="margin-bottom: 8px; color: #172b4d;">Comments</h4>
                ${comments.map(comment => `
                    <div style="padding: 12px; background: #f4f5f7; border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #172b4d; margin-bottom: 4px;">User</div>
                        <div style="color: #5e6c84; font-size: 14px;">${comment.comment}</div>
                        <div style="color: #a5adba; font-size: 12px; margin-top: 4px;">
                            ${new Date(comment.created_at).toLocaleString()}
                        </div>
                    </div>
                `).join('') || '<span style="color: #5e6c84;">No comments yet</span>'}
            </div>

            <div id="commentsSectionContainer">
                <!-- Comments will be loaded here -->
            </div>
        `;

        // ✅ Load description section
        const descriptionContainer = document.getElementById('descriptionSectionContainer');
        if (descriptionContainer) {
            await renderDescriptionSection(card, descriptionContainer);
        }

        // ✅ Load due date section
        const dueDateContainer = document.getElementById('dueDateSectionContainer');
        if (dueDateContainer) {
            await renderDueDateSection(card, dueDateContainer);
        }

        const commentsContainer = document.getElementById('commentsSectionContainer');
        await renderCommentsSection(card.id, commentsContainer);
        
    } catch (error) {
        console.error('Error loading card details:', error);
        const detailBody = document.getElementById('cardDetailBody');
        detailBody.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 8px; color: #172b4d;">Description</h4>
                <p style="color: #5e6c84;">${card.description || 'No description added yet.'}</p>
            </div>
            <p style="color: #5e6c84;">Card details will be loaded from the API.</p>
        `;
    }
    
    document.getElementById('cardDetailModal').classList.add('active');
}

function closeCardDetailModal() {
    document.getElementById('cardDetailModal').classList.remove('active');
}