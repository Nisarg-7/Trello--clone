// Comments Management Functions

let currentCardForComments = null;
let editingCommentId = null;

// ==================== LOAD COMMENTS ====================

async function loadComments(cardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cards/${cardId}/comments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load comments');
        }
        
        const comments = await response.json();
        return comments;
        
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

// ==================== RENDER COMMENTS SECTION ====================

async function renderCommentsSection(cardId, container) {
    currentCardForComments = cardId;
    
    const comments = await loadComments(cardId);
    const userName = localStorage.getItem('userName') || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    
    const commentsHTML = `
        <div class="comments-section">
            <div class="comments-header">
                <div class="comments-title">
                    <span>💬 Comments</span>
                    ${comments.length > 0 ? `<span class="comments-count">${comments.length}</span>` : ''}
                </div>
            </div>
            
            <div class="comments-list" id="commentsListContainer">
                ${comments.length > 0 ? renderCommentsList(comments) : renderEmptyComments()}
            </div>
            
            <div class="add-comment-form">
                <div class="add-comment-header">
                    <div class="current-user-avatar">${userInitial}</div>
                    <span style="font-weight: 600; color: #172b4d; font-size: 14px;">Add a comment</span>
                </div>
                <textarea 
                    class="add-comment-textarea" 
                    id="newCommentText" 
                    placeholder="Write a comment..."
                    rows="3"
                ></textarea>
                <div class="add-comment-buttons">
                    <button class="btn-post-comment" onclick="postComment()" id="postCommentBtn">
                        Post
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = commentsHTML;
    
    // Add input listener for character count or validation
    const textarea = document.getElementById('newCommentText');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const btn = document.getElementById('postCommentBtn');
            btn.disabled = textarea.value.trim().length === 0;
        });
    }
}

// ==================== RENDER COMMENTS LIST ====================

function renderCommentsList(comments) {
    // Sort by created_at descending (newest first)
    comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return comments.map(comment => {
        const userName = 'User'; // You can fetch from user_id if needed
        const userInitial = userName.charAt(0).toUpperCase();
        const timeAgo = getTimeAgo(comment.created_at);
        const isCurrentUser = parseInt(comment.user_id) === parseInt(currentUser.id);
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${userInitial}</div>
                        <div class="comment-author-info">
                            <span class="comment-author-name">${userName}</span>
                            <span class="comment-timestamp" title="${new Date(comment.created_at).toLocaleString()}">
                                ${timeAgo}
                            </span>
                        </div>
                    </div>
                    ${isCurrentUser ? `
                        <div class="comment-actions">
                            <button class="btn-comment-action" onclick="editComment(${comment.id}, '${escapeHtml(comment.comment)}')" title="Edit">
                                ✏️ Edit
                            </button>
                            <button class="btn-comment-action" onclick="deleteComment(${comment.id})" title="Delete">
                                🗑️ Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-text" id="comment-text-${comment.id}">${escapeHtml(comment.comment)}</div>
            </div>
        `;
    }).join('');
}

// ==================== RENDER EMPTY COMMENTS ====================

function renderEmptyComments() {
    return `
        <div class="comments-empty">
            <div class="comments-empty-icon">💬</div>
            <div class="comments-empty-text">No comments yet</div>
            <div class="comments-empty-subtext">Be the first to comment!</div>
        </div>
    `;
}

// ==================== POST COMMENT ====================

async function postComment() {
    const textarea = document.getElementById('newCommentText');
    const commentText = textarea.value.trim();
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }
    
    const postBtn = document.getElementById('postCommentBtn');
    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/cards/${currentCardForComments}/comments?user_id=${currentUser.id}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    comment: commentText
                })
            }
        );
        
        if (response.ok) {
            textarea.value = '';
            await refreshCommentsSection();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not post comment'));
        }
        
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Error posting comment');
    } finally {
        postBtn.disabled = false;
        postBtn.textContent = 'Post';
    }
}

// ==================== EDIT COMMENT ====================

function editComment(commentId, currentText) {
    editingCommentId = commentId;
    
    const commentTextElement = document.getElementById(`comment-text-${commentId}`);
    const commentItem = commentTextElement.closest('.comment-item');
    
    const editForm = document.createElement('div');
    editForm.className = 'comment-edit-form';
    editForm.innerHTML = `
        <textarea class="comment-edit-textarea" id="edit-comment-${commentId}">${currentText}</textarea>
        <div class="comment-edit-buttons">
            <button class="btn-small btn-primary-small" onclick="saveCommentEdit(${commentId})">Save</button>
            <button class="btn-small btn-cancel" onclick="cancelCommentEdit(${commentId}, '${escapeHtml(currentText)}')">Cancel</button>
        </div>
    `;
    
    commentTextElement.replaceWith(editForm);
    
    const textarea = document.getElementById(`edit-comment-${commentId}`);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

async function saveCommentEdit(commentId) {
    const textarea = document.getElementById(`edit-comment-${commentId}`);
    const newText = textarea.value.trim();
    
    if (!newText) {
        alert('Comment cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                comment: newText
            })
        });
        
        if (response.ok) {
            await refreshCommentsSection();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not update comment'));
        }
        
    } catch (error) {
        console.error('Error updating comment:', error);
        alert('Error updating comment');
    }
}

function cancelCommentEdit(commentId, originalText) {
    const editForm = document.querySelector(`#edit-comment-${commentId}`).closest('.comment-edit-form');
    
    const commentText = document.createElement('div');
    commentText.className = 'comment-text';
    commentText.id = `comment-text-${commentId}`;
    commentText.textContent = originalText;
    
    editForm.replaceWith(commentText);
}

// ==================== DELETE COMMENT ====================

async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
    commentItem.classList.add('deleting');
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            await refreshCommentsSection();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Could not delete comment'));
            commentItem.classList.remove('deleting');
        }
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
        commentItem.classList.remove('deleting');
    }
}

// ==================== REFRESH COMMENTS SECTION ====================

async function refreshCommentsSection() {
    if (!currentCardForComments) return;
    
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
        await renderCommentsSection(currentCardForComments, commentsSection.parentElement);
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    
    return 'just now';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== GET COMMENTS COUNT FOR CARD BADGES ====================

async function getCommentsCount(cardId) {
    const comments = await loadComments(cardId);
    return comments.length;
}

console.log('Comments module loaded');