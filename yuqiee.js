// @name         Zxlwq
// @title        宇柒云阁
// @version      1.0.0
// @description  支持多账号签到，积分查询，Telegram 推送
// @author       Zxlwq
// @cron         0 8 * * *  # 每天 8:00 执行
// @grant        none

const axios = require('axios');
const cheerio = require('cheerio');

const COOKIE = process.env.YUQIE_COOKIE;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

if (!COOKIE) {
    console.log('❌ 未配置环境变量 YUQIE_COOKIE，脚本终止');
    process.exit(1);
}

const COOKIES = COOKIE.split(',').map(c => c.trim()).filter(Boolean);

async function isCookieValid(cookie) {
    try {
        const res = await axios.get('https://www.yuqiee.com/wp-admin/admin-ajax.php?action=get_current_user', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        return res.data?.is_logged_in ? res.data?.user_data?.user_email || '未知账号' : false;
    } catch (e) {
        return false;
    }
}

async function signInOne(cookie, index) {
    try {
        const res = await axios.post(
            'https://www.yuqiee.com/wp-admin/admin-ajax.php',
            new URLSearchParams({ action: 'user_checkin' }),
            {
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://www.yuqiee.com/user-sign?tab=signin',
                },
                timeout: 10000,
            }
        );
        return res.data;
    } catch (e) {
        console.log(`账号${index + 1} 签到异常：${e.message}`);
        return null;
    }
}

async function fetchContinuousDays(cookie) {
    try {
        const res = await axios.get('https://www.yuqiee.com/wp-admin/admin-ajax.php?action=checkin_details_modal', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
        });
        const $ = cheerio.load(res.data);
        const match = $('div').text().match(/累计签到\s*(\d+)\s*天/);
        return match ? parseInt(match[1], 10) : null;
    } catch (e) {
        console.log(`获取连续签到天数失败：${e.message}`);
        return null;
    }
}

async function fetchTotalPoints(cookie) {
    try {
        const res = await axios.get('https://www.yuqiee.com/user/balance', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const $ = cheerio.load(res.data);
        const text = $('a[href="https://www.yuqiee.com/user/balance"] span.font-bold.c-yellow').first().text().trim();
        const points = parseInt(text, 10);
        return isNaN(points) ? null : points;
    } catch (e) {
        console.log(`获取总积分失败：${e.message}`);
        return null;
    }
}

async function sendTelegram(content) {
    if (!TG_BOT_TOKEN || !TG_USER_ID) return;
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: TG_USER_ID,
            text: content + '\n\nTelegram 消息推送成功',
            parse_mode: 'Markdown',
        });
        console.log('✅ Telegram 消息推送成功');
    } catch (e) {
        console.log('❌ Telegram 推送失败：', e.message);
    }
}

function formatSignInResult(results, invalidAccounts) {
    let text = `📢 *宇柒云阁签到通知*\n\n`;

    if (results.length > 0) {
        text += `✅ *签到情况：*\n`;
        results.forEach(line => {
            text += `- ${line}\n`;
        });
    } else {
        text += `⚠️ 无有效账号签到记录。\n`;
    }

    if (invalidAccounts.length > 0) {
        text += `\n🚨 *失效账号提醒：*\n`;
        invalidAccounts.forEach(line => {
            text += `- ❌ ${line}\n`;
        });
        text += `\n请尽快更新以上账号的 Cookie，否则将无法正常签到。`;
    }

    return text;
}

(async () => {
    let results = [];
    let invalidAccounts = [];

    for (let i = 0; i < COOKIES.length; i++) {
        const cookie = COOKIES[i];
        const userEmail = await isCookieValid(cookie);

        if (!userEmail) {
            invalidAccounts.push(`账号${i + 1} Cookie无效或已过期`);
            continue;
        }

        const signInRes = await signInOne(cookie, i);
        if (!signInRes) {
            results.push(`❌ ${userEmail} 签到失败`);
            continue;
        }

        const continuousDays = await fetchContinuousDays(cookie);
        const totalPoints = await fetchTotalPoints(cookie);
        const gainedPoints = signInRes.data?.integral || 0;
        const gainedExp = signInRes.data?.points || 0;

        let statusText = '';
        if (signInRes.error === false || (signInRes.error === true && signInRes.msg.includes('今日已签到'))) {
            statusText = `${userEmail} 今日已签到：连续签到 ${continuousDays ?? '未知'} 天，积分 +${gainedPoints}，经验 +${gainedExp}，总积分 ${totalPoints ?? '未知'}`;
        } else {
            statusText = `${userEmail} 签到异常：${signInRes.msg || '未知错误'}`;
        }

        results.push(statusText);
    }

    const message = formatSignInResult(results, invalidAccounts);
    console.log(message);
    await sendTelegram(message);
})();
