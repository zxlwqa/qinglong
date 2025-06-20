const axios = require("axios");
const cheerio = require("cheerio");

// 环境变量
const HF_USERNAME = process.env.HF_USERNAME || 'your_username';
const HF_SPACE_NAMES = process.env.HF_SPACE_NAME || '';  // 多个用英文逗号分隔
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

const TELEGRAM_API = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;

async function checkSpaces() {
    const spaceList = HF_SPACE_NAMES.split(',').map(s => s.trim()).filter(Boolean);
    if (spaceList.length === 0) {
        console.error("[ERROR] 未配置 HF_SPACE_NAME 环境变量");
        return;
    }

    for (const spaceName of spaceList) {
        const appUrl = `https://huggingface.co/spaces/${HF_USERNAME}/${spaceName}`;
        try {
            const res = await axios.get(appUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Node.js Monitor)',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            const $ = cheerio.load(res.data);
            const bodyText = $('body').text();
            const isPaused = bodyText.includes("This Space is paused");

            if (isPaused) {
                await sendTelegram(`🚨 ${spaceName} 空间已暂停 ❗`, true);
            } else {
                await sendTelegram(`✅ ${spaceName} 空间运行正常`);
            }
        } catch (err) {
            console.error(`[ERROR] ${spaceName} 页面访问失败：`, err.message);
            await sendTelegram(`❌ ${spaceName} 空间状态检查失败：${err.message}`, true);
        }
    }
}

async function sendTelegram(message, isAlert = false) {
    if (!TG_BOT_TOKEN || !TG_USER_ID) {
        console.warn("[WARN] 缺少 Telegram 配置，无法发送通知");
        return;
    }

    try {
        await axios.post(TELEGRAM_API, {
            chat_id: TG_USER_ID,
            text: message,
            parse_mode: "Markdown",
            disable_notification: !isAlert
        });
        console.log("[INFO] Telegram 消息已发送：", message);
    } catch (err) {
        console.error("[ERROR] Telegram 发送失败: ", err.message);
    }
}

// 启动
checkSpaces();
