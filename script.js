// Cấu hình hệ thống key
const KEY_EXPIRY_DAYS = 7; // Key hết hạn sau 7 ngày

// Hàm tạo key ngẫu nhiên (định dạng KEY_XXXXXXX)
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY_';
    for (let i = 0; i < 10; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Lưu key vào localStorage
function saveKey(key) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + KEY_EXPIRY_DAYS);
    
    const keyData = {
        key: key,
        expiry: expiryDate.getTime()
    };
    
    localStorage.setItem('licenseKey', JSON.stringify(keyData));
}

// Kiểm tra key còn hạn hay không
function loadKey() {
    const keyData = localStorage.getItem('licenseKey');
    if (!keyData) return null;
    
    const parsedData = JSON.parse(keyData);
    const now = new Date().getTime();
    
    if (now < parsedData.expiry) {
        return {
            key: parsedData.key,
            expiry: parsedData.expiry
        };
    }
    return null; // Key đã hết hạn
}

// Hiển thị key lên giao diện
function displayKey(key, expiry) {
    const expiryDate = new Date(expiry);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = expiryDate.toLocaleDateString('en-US', options);
    
    document.getElementById('keyDisplay').innerHTML = `
        <div class="key-display">
            <div>Your License Key:</div>
            <div style="color: #00c6ff; font-size: 1.4rem; margin-top: 0.5rem;">${key}</div>
            <div style="font-size: 0.8rem; margin-top: 0.5rem; color: rgba(255,255,255,0.7);">
                Expires on ${formattedDate} (Valid for ${KEY_EXPIRY_DAYS} days)
            </div>
        </div>
    `;
}

// Khi trang web tải xong
document.addEventListener('DOMContentLoaded', function() {
    const existingKey = loadKey();
    const getKeyBtn = document.getElementById('getKeyBtn');
    
    // Nếu đã có key hợp lệ
    if (existingKey) {
        displayKey(existingKey.key, existingKey.expiry);
    }
    
    // Bấm nút Get Key
    getKeyBtn.addEventListener('click', function() {
        const newKey = generateKey();
        saveKey(newKey);
        displayKey(newKey, new Date().getTime() + (KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
        alert('Key generated successfully!');
    });
});