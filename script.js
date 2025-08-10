// Configuration
const KEY_EXPIRY_DAYS = 7;

// DOM Elements
const getKeyBtn = document.getElementById('getKeyBtn');
const keyDisplay = document.getElementById('keyDisplay');

// Generate random key
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY_';
    for (let i = 0; i < 10; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Save key to localStorage
function saveKey(key) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + KEY_EXPIRY_DAYS);
    
    const keyData = {
        key: key,
        expiry: expiryDate.getTime()
    };
    
    localStorage.setItem('licenseKey', JSON.stringify(keyData));
}

// Load key from storage
function loadKey() {
    const keyData = localStorage.getItem('licenseKey');
    if (!keyData) return null;
    
    const parsedData = JSON.parse(keyData);
    const now = new Date().getTime();
    
    if (now < parsedData.expiry) {
        return parsedData;
    }
    localStorage.removeItem('licenseKey');
    return null;
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showTooltip('Copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed: ', err);
        showTooltip('Failed to copy');
    });
}

// Show tooltip notification
function showTooltip(message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        tooltip.remove();
    }, 2000);
}

// Display key on screen
function displayKey(keyData) {
    const expiryDate = new Date(keyData.expiry);
    const formattedDate = expiryDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    keyDisplay.innerHTML = `
        <div class="key-display">
            <div class="key-value">${keyData.key}</div>
            <div class="key-expiry">Valid until: ${formattedDate}</div>
            <button id="copyKeyBtn" class="copy-btn">
                <i class="fas fa-copy"></i> Copy Key
            </button>
        </div>
    `;

    // Add copy functionality
    document.getElementById('copyKeyBtn').addEventListener('click', () => {
        copyToClipboard(keyData.key);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load existing key
    const currentKey = loadKey();
    if (currentKey) {
        displayKey(currentKey);
    }

    // Generate new key
    getKeyBtn.addEventListener('click', () => {
        const newKey = generateKey();
        saveKey(newKey);
        displayKey({
            key: newKey,
            expiry: new Date().getTime() + (KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        });
    });
});