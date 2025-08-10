// Configuration
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1403667787943120996/PA-03eIqcD8f8zT5YQD8eN0T9afY7wI6S5rT-ra1BU_9SfI4FVgQdnrAQ8z0a52jtYSs";
const KEY_EXPIRY_DAYS = 7;
const REPORT_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// DOM Elements
const getKeyBtn = document.getElementById('getKeyBtn');
const keyDisplay = document.getElementById('keyDisplay');

// Generate random key (format: KEY_XXXX-XXXX-XXXX)
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY_';
    
    // Generate 3 segments of 4 characters
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 2) key += '-';
    }
    
    return key;
}

// Save key to localStorage
async function saveKey(key) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + KEY_EXPIRY_DAYS);
    
    const userIP = await getPublicIP();
    const keyData = {
        key,
        expiry: expiryDate.getTime(),
        ip: userIP,
        created: new Date().toISOString()
    };
    
    // Get existing keys or initialize empty array
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    keys.push(keyData);
    localStorage.setItem('keys', JSON.stringify(keys));
    
    // Send creation notice to Discord
    await sendToDiscord(keyData, "KEY_CREATED");
    
    return keyData;
}

// Get public IP address
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

// Send data to Discord
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

    if (action === "REPORT") {
        embed.fields.push({
            name: "Status",
            value: keyData.expiry > Date.now() ? "🟢 Active" : "🔴 Expired",
            inline: true
        });
    }

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

// Get all active keys
function getActiveKeys() {
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    return keys.filter(key => key.expiry > Date.now());
}

// Send daily report to Discord
async function sendDailyReport() {
    const activeKeys = getActiveKeys();
    
    if (activeKeys.length === 0) {
        await sendToDiscord({
            key: "No active keys",
            expiry: Date.now(),
            ip: "N/A"
        }, "REPORT");
        return;
    }

    const embed = {
        title: "📊 Daily Key Report",
        description: `**Total Active Keys:** ${activeKeys.length}\n` +
                    `**Expiring Today:** ${activeKeys.filter(k => 
                        new Date(k.expiry).toDateString() === new Date().toDateString()
                    ).length}`,
        color: 0xFFA500,
        fields: [],
        timestamp: new Date().toISOString()
    };

    // Add first 5 keys to the embed (Discord limit)
    activeKeys.slice(0, 5).forEach(key => {
        embed.fields.push({
            name: `Key: ${key.key}`,
            value: `IP: ${key.ip}\nExpires: ${new Date(key.expiry).toLocaleString()}`,
            inline: true
        });
    });

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error("Report send error:", error);
    }
}

// Display key on page
function displayKey(keyData) {
    const expiryDate = new Date(keyData.expiry);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    
    keyDisplay.innerHTML = `
        <div class="key-display">
            <div class="key-value">${keyData.key}</div>
            <div class="key-expiry">
                <i class="fas fa-clock"></i> Expires: ${expiryDate.toLocaleString('en-US', options)}
            </div>
            <div class="key-ip">
                <i class="fas fa-network-wired"></i> IP: ${keyData.ip}
            </div>
            <button id="copyKeyBtn" class="copy-btn">
                <i class="fas fa-copy"></i> Copy Key
            </button>
        </div>
    `;

    // Add copy functionality
    document.getElementById('copyKeyBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(keyData.key);
        alert('Key copied to clipboard!');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load existing active keys
    const activeKeys = getActiveKeys();
    if (activeKeys.length > 0) {
        displayKey(activeKeys[activeKeys.length - 1]); // Show most recent key
    }

    // Generate new key button
    getKeyBtn.addEventListener('click', async () => {
        const newKey = generateKey();
        const keyData = await saveKey(newKey);
        displayKey(keyData);
    });

    // Send initial report
    await sendDailyReport();
    
    // Schedule daily reports
    setInterval(sendDailyReport, REPORT_INTERVAL);
});