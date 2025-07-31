#!/usr/bin/env bash
# cron: 0 8 * * *
# new Env("爱工作论坛")

const axios = require('axios');
const cheerio = require('cheerio');

const COOKIE = process.env.ANIFX8_COOKIE;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

if (!COOKIE) {
    console.log('❌ 未配置环境变量 ANIFX8_COOKIE，脚本终止');
    process.exit(1);
}

const COOKIES = COOKIE.split(',').map(c => c.trim()).filter(Boolean);

async function checkCookieValid(cookie, index) {
    try {
        const res = await axios.get('https://anifx8.com/wp-admin/admin-ajax.php?action=get_current_user', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        if (res.data && res.data.is_logged_in) {
            const user = res.data.user_data;
            const username = user.user_email || user.user_nicename || `账号${index + 1}`;
            return { valid: true, username };
        }
    } catch (e) {
        console.log(`账号${index + 1} Cookie检测异常：${e.message}`);
    }
    return { valid: false };
}

async function signInOne(cookie, index) {
    try {
        const res = await axios.post(
            'https://anifx8.com/wp-admin/admin-ajax.php',
            new URLSearchParams({ action: 'user_checkin' }),
            {
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://anifx8.com/user-sign?tab=signin',
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
        const res = await axios.get('https://anifx8.com/wp-admin/admin-ajax.php?action=checkin_details_modal', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const $ = cheerio.load(res.data);
        const text = $('div').text();
        const match = text.match(/累计签到\s*(\d+)\s*天/);
        if (match) return parseInt(match[1], 10);
    } catch (e) {
        console.log(`获取连续签到天数失败：${e.message}`);
    }
    return null;
}

async function fetchTotalPoints(cookie) {
    try {
        const res = await axios.get('https://anifx8.com/user/balance', {
            headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const $ = cheerio.load(res.data);
        const pointText = $('a[href="https://anifx8.com/user/balance"] span.font-bold.c-yellow').first().text().trim();
        const points = parseInt(pointText, 10);
        if (!isNaN(points)) {
            return points;
        }
    } catch (e) {
        console.log(`获取总积分失败：${e.message}`);
    }
    return null;
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
    let text = `📢 *爱工作论坛签到通知*\n\n`;

    if (results.length > 0) {
        text += `✅ *签到情况：*\n`;
        results.forEach((line) => {
            text += `- ${line}\n`;
        });
    } else {
        text += `⚠️ 无有效账号签到记录。\n`;
    }

    if (invalidAccounts.length > 0) {
        text += `\n🚨 *失效账号提醒：*\n`;
        invalidAccounts.forEach((line) => {
            text += `- ❌ ${line}\n`;
        });
        text += `\n请尽快更新以上账号的 Cookie，否则将无法正常签到。`;
    }

    return text;
}

!(async () => {
    let results = [];
    let invalidAccounts = [];

    for (let i = 0; i < COOKIES.length; i++) {
        const cookie = COOKIES[i];
        const checkRes = await checkCookieValid(cookie, i);

        if (!checkRes.valid) {
            const userLabel = checkRes.username || `账号${i + 1}`;
            invalidAccounts.push(`${userLabel} Cookie无效或已过期`);
            continue;
        }

        const username = checkRes.username;
        const signInRes = await signInOne(cookie, i);
        if (!signInRes) {
            results.push(`${username} 签到失败`);
            continue;
        }

        const continuousDays = await fetchContinuousDays(cookie);
        const totalPoints = await fetchTotalPoints(cookie);

        let gainedPoints = 0, gainedExp = 0;
        if (signInRes.data) {
            gainedPoints = signInRes.data.integral || 0;
            gainedExp = signInRes.data.points || 0;
        }

        let statusText = '';
        if (signInRes.error === false || (signInRes.error === true && signInRes.msg.includes('今日已签到'))) {
            statusText = `${username} 今日已签到：连续签到 ${continuousDays ?? '未知'} 天，积分 +${gainedPoints}，经验 +${gainedExp}，总积分 ${totalPoints ?? '未知'}`;
        } else {
            statusText = `${username} 签到异常：${signInRes.msg || '未知错误'}`;
        }

        results.push(statusText);
    }

    const message = formatSignInResult(results, invalidAccounts);
    console.log(message);
    await sendTelegram(message);
})();
