// Configuration and Constants

const API_BASE_URL = 'http://localhost:8000';

const colorMap = {
    'blue': 'linear-gradient(135deg, #0079bf 0%, #5067c5 100%)',
    'green': 'linear-gradient(135deg, #61bd4f 0%, #8fce00 100%)',
    'red': 'linear-gradient(135deg, #eb5a46 0%, #ff7066 100%)',
    'yellow': 'linear-gradient(135deg, #f2d600 0%, #ffeb3b 100%)',
    'orange': 'linear-gradient(135deg, #ff9f1a 0%, #ffb347 100%)',
    'purple': 'linear-gradient(135deg, #c377e0 0%, #d291ff 100%)',
    'cyan': 'linear-gradient(135deg, #00c2e0 0%, #51e5ff 100%)',
    'grey': 'linear-gradient(135deg, #838c91 0%, #a3afb7 100%)',
    'dark': 'linear-gradient(135deg, #344563 0%, #4a5f7f 100%)',
    'pink': 'linear-gradient(135deg, #cd5a91 0%, #e879b9 100%)'
};

// Global state
let currentUser = null;
let currentBoard = null;
let selectedBoardColor = 'blue';
let selectedEditColor = 'blue';
let editingBoardId = null;
let editingListId = null;
let editingCardId = null;
let deleteCallback = null;