// ====== Configuration ======
const GITHUB_URL = "https://xfearyzer.github.io";
const KEY_SESSION_KEY = "xfearyzer_generated_key";
const KEY_EXP_SESSION = "xfearyzer_key_expiry";
const TOKEN_KEY = "xfearyzer_access_token";
const TOKEN_EXPIRY_KEY = "xfearyzer_token_expiry";

// Translations
const translations = {
    en: {
        title: "Key Generator",
        checking: "Checking access...",
        your_key: "Your key (save carefully, reload will lose this key):",
        copy: "Copy Key",
        back: "Back",
        expires_in: "Expires in:",
        expired: "Expired",
        copied: "Key copied to clipboard",
        copy_failed: "Could not copy automatically. Please copy manually.",
        reload_warning: "You haven't saved your key! If you reload the page you will lose this key. Do you want to continue?",
        invalid_token: "Invalid or expired access token. Redirecting..."
    },
    vi: {
        title: "Trình tạo Key",
        checking: "Đang kiểm tra quyền truy cập...",
        your_key: "Key của bạn (lưu cẩn thận, reload sẽ mất key này):",
        copy: "Sao chép Key",
        back: "Quay lại",
        expires_in: "Hết hạn sau:",
        expired: "Đã hết hạn",
        copied: "Đã copy key vào clipboard",
        copy_failed: "Không thể copy tự động. Hãy copy thủ công.",
        reload_warning: "Bạn chưa lưu key! Nếu làm mới trang (reload) bạn sẽ mất key này. Bạn có muốn tiếp tục?",
        invalid_token: "Token không hợp lệ hoặc đã hết hạn. Đang chuyển hướng..."
    }
};

let currentLang = 'en';

// ====== Utilities ======
function parseQuery() {
    const params = new URLSearchParams(window.location.search);
    return {
        token: params.get('token'),
        exp: params.has('exp') ? parseInt(params.get('exp'), 10) : null
    };
}

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY_';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 2) key += '-';
    }
    return key;
}

function redirectToGitHub() {
    window.location.href = GITHUB_URL;
}

function translatePage() {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });
}

// ====== Main Logic ======
document.addEventListener('DOMContentLoaded', async () => {
    // Check token from URL or localStorage
    const q = parseQuery();
    const now = Date.now();
    
    // Get from localStorage
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedExp = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // Validate token
    if ((!q.token || !q.exp || q.exp < now) && 
        (!storedToken || !storedExp || parseInt(storedExp, 10) < now)) {
        alert(translations[currentLang].invalid_token);
        setTimeout(redirectToGitHub, 2000);
        return;
    }
    
    // If URL token is valid, store it
    if (q.token && q.exp && q.exp > now) {
        localStorage.setItem(TOKEN_KEY, q.token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, q.exp.toString());
    }
    
    // Generate and display key
    const expiryDate = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY), 10);
    const newKey = generateKey();
    
    sessionStorage.setItem(KEY_SESSION_KEY, newKey);
    sessionStorage.setItem(KEY_EXP_SESSION, expiryDate.toString());
    
    showKey(newKey, expiryDate);
    
    // Check token expiry every second
    const expiryCheck = setInterval(() => {
        const tokenExp = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || "0", 10);
        if (!tokenExp || Date.now() > tokenExp) {
            clearInterval(expiryCheck);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            sessionStorage.removeItem(KEY_SESSION_KEY);
            sessionStorage.removeItem(KEY_EXP_SESSION);
            alert(translations[currentLang].expired);
            redirectToGitHub();
        } else {
            updateExpiryDisplay(tokenExp);
        }
    }, 1000);
    
    // Language switching
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.language-btn.active').classList.remove('active');
            this.classList.add('active');
            currentLang = this.getAttribute('data-lang');
            translatePage();
            updateExpiryDisplay(parseInt(sessionStorage.getItem(KEY_EXP_SESSION) || "0", 10));
        });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        sessionStorage.removeItem(KEY_SESSION_KEY);
        sessionStorage.removeItem(KEY_EXP_SESSION);
        redirectToGitHub();
    });

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
        const key = document.getElementById('keyDisplay').textContent;
        navigator.clipboard.writeText(key).then(() => {
            alert(translations[currentLang].copied);
        }).catch(() => {
            alert(translations[currentLang].copy_failed);
        });
    });
});

function showKey(key, expiry) {
    document.getElementById('loadingText').style.display = 'none';
    const keySection = document.getElementById('keySection');
    const keyDisplay = document.getElementById('keyDisplay');
    const expiryDisplay = document.getElementById('expiryDisplay');

    keyDisplay.textContent = key;
    updateExpiryDisplay(expiry);
    keySection.style.display = 'block';
}

function updateExpiryDisplay(expiry) {
    const expiryDisplay = document.getElementById('expiryDisplay');
    if (!expiryDisplay) return;
    
    const rem = expiry - Date.now();
    if (rem <= 0) {
        expiryDisplay.textContent = translations[currentLang].expired;
        return;
    }
    
    const mins = Math.floor(rem / (1000 * 60));
    const secs = Math.floor((rem % (1000 * 60)) / 1000);
    
    expiryDisplay.textContent = `${translations[currentLang].expires_in} ${mins}m ${secs}s`;
}

// Warn before reload
window.addEventListener('beforeunload', function(e) {
    if (sessionStorage.getItem(KEY_SESSION_KEY)) {
        const confirmationMessage = translations[currentLang].reload_warning;
        (e || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
    }
});