// ====== Cấu hình ======
const GITHUB_URL = "https://xfearyzer.github.io";
const KEY_SESSION_KEY = "xfearyzer_generated_key";
const KEY_EXP_SESSION = "xfearyzer_key_expiry";
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/your-webhook-url";

// Dịch ngôn ngữ
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
        reload_warning: "You haven't saved your key! If you reload the page you will lose this key. Do you want to continue?"
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
        reload_warning: "Bạn chưa lưu key! Nếu làm mới trang (reload) bạn sẽ mất key này. Bạn có muốn tiếp tục?"
    }
};

let currentLang = 'en';

// ====== Tiện ích ======
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

async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("IP fetch error:", error);
        return "Unknown";
    }
}

async function sendToDiscord(keyData, action) {
    const embed = {
        title: action === "KEY_CREATED" ? "🔑 New Key Generated" : "📊 Daily Key Report",
        color: action === "KEY_CREATED" ? 0x00FF00 : 0x0099FF,
        fields: [
            {
                name: "Key",
                value: `\`\`\`${keyData.key}\`\`\``,
                inline: true
            },
            {
                name: "Expiry Date",
                value: new Date(keyData.expiry).toLocaleString(),
                inline: true
            },
            {
                name: "User IP",
                value: keyData.ip,
                inline: true
            }
        ],
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error("Discord webhook error:", error);
    }
}

// ====== Chính ======
document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra token từ URL hoặc localStorage
    const q = parseQuery();
    const now = Date.now();
    
    // Lấy token từ localStorage
    const storedToken = localStorage.getItem('xfearyzer_access_token');
    const storedExp = localStorage.getItem('xfearyzer_token_expiry');
    
    // Kiểm tra token hợp lệ
    if ((!q.token || !q.exp || parseInt(q.exp, 10) < now) && 
        (!storedToken || !storedExp || parseInt(storedExp, 10) < now)) {
        redirectToGitHub();
        return;
    }
    
    // Nếu token từ URL hợp lệ, lưu vào localStorage
    if (q.token && q.exp && parseInt(q.exp, 10) > now) {
        localStorage.setItem('xfearyzer_access_token', q.token);
        localStorage.setItem('xfearyzer_token_expiry', q.exp);
    }
    
    // Hiển thị giao diện key
    const expiryDate = parseInt(localStorage.getItem('xfearyzer_token_expiry'), 10);
    const newKey = generateKey();
    
    sessionStorage.setItem(KEY_SESSION_KEY, newKey);
    sessionStorage.setItem(KEY_EXP_SESSION, expiryDate.toString());
    
    const userIP = await getPublicIP();
    const keyData = {
        key: newKey,
        expiry: expiryDate,
        ip: userIP,
        created: new Date().toISOString()
    };
    
    await sendToDiscord(keyData, "KEY_CREATED");
    showKey(newKey, expiryDate);
    
    // Kiểm tra thời hạn token mỗi giây
    setInterval(() => {
        const tokenExp = parseInt(localStorage.getItem('xfearyzer_token_expiry') || "0", 10);
        if (!tokenExp || Date.now() > tokenExp) {
            localStorage.removeItem('xfearyzer_access_token');
            localStorage.removeItem('xfearyzer_token_expiry');
            sessionStorage.removeItem(KEY_SESSION_KEY);
            sessionStorage.removeItem(KEY_EXP_SESSION);
            redirectToGitHub();
        } else {
            updateExpiryDisplay(tokenExp);
        }
    }, 1000);
    
    // Chuyển đổi ngôn ngữ
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.language-btn.active').classList.remove('active');
            this.classList.add('active');
            currentLang = this.getAttribute('data-lang');
            translatePage();
            updateExpiryDisplay(parseInt(sessionStorage.getItem(KEY_EXP_SESSION) || "0", 10));
        });
    });

    // Xử lý nút back
    document.getElementById('backBtn').addEventListener('click', goBack);

    // Xử lý nút copy
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

function goBack() {
    sessionStorage.removeItem(KEY_SESSION_KEY);
    sessionStorage.removeItem(KEY_EXP_SESSION);
    window.location.href = GITHUB_URL;
}

// Cảnh báo khi tải lại trang
window.addEventListener('beforeunload', function(e) {
    if (sessionStorage.getItem(KEY_SESSION_KEY)) {
        const confirmationMessage = translations[currentLang].reload_warning;
        (e || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
    }
});