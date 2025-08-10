// Key Generator Configuration
const KEY_EXPIRY_DAYS = 7;

// Generate random key with format KEY_XXXXXXXXXX
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

// Load and validate key
function loadKey() {
    const keyData = localStorage.getItem('licenseKey');
    if (!keyData) return null;
    
    const parsedData = JSON.parse(keyData);
    if (new Date().getTime() < parsedData.expiry) {
        return parsedData;
    }
    localStorage.removeItem('licenseKey');
    return null;
}

// Display key on screen
function displayKey(keyData) {
    const expiryDate = new Date(keyData.expiry);
    const formattedDate = expiryDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    document.getElementById('keyDisplay').innerHTML = `
        <div class="key-display">
            <div>Your License Key:</div>
            <div style="color: #00c6ff; font-size: 1.4rem; margin-top: 0.5rem;">${keyData.key}</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem; color: rgba(255,255,255,0.7);">
                Expires on ${formattedDate}
            </div>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const currentKey = loadKey();
    if (currentKey) {
        displayKey(currentKey);
    }

    // Handle button click
    document.getElementById('getKeyBtn').addEventListener('click', () => {
        const newKey = generateKey();
        saveKey(newKey);
        displayKey({
            key: newKey,
            expiry: new Date().getTime() + (KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        });
        
        // Animation feedback
        const btn = document.getElementById('getKeyBtn');
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 300);
    });
});