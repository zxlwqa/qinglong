const axios = require('axios');
const cheerio = require('cheerio');

const COOKIE = process.env.ANIFX8_COOKIE;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

if (!COOKIE) {
    console.log('【ANIFX8】未配置环境变量 ANIFX8_COOKIE，脚本退出');
    return;
}

const COOKIES = COOKIE.split(',').map(c => c.trim()).filter(Boolean);

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
                }
            }
        );
        return res.data;
    } catch (e) {
        if (e.response) {
            console.log(`账号${index + 1} 签到异常：${e.response.status} ${JSON.stringify(e.response.data)}`);
        } else {
            console.log(`账号${index + 1} 签到异常：${e.message}`);
        }
        return null;
    }
}

async function fetchContinuousDays(cookie) {
    try {
        const res = await axios.get(
            'https://anifx8.com/wp-admin/admin-ajax.php?action=checkin_details_modal',
            {
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0',
                }
            }
        );
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
        const res = await axios.get(
            'https://anifx8.com/user/balance',
            {
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0',
                },
                timeout: 10000,
            }
        );
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
            text: `📢 爱工作论坛签到通知\n\n${content}`,
            parse_mode: 'Markdown',
        });
    } catch (e) {
        console.log('Telegram推送失败：', e.message);
    }
}

async function main() {
    let results = [];

    for (let i = 0; i < COOKIES.length; i++) {
        const cookie = COOKIES[i];
        const signInRes = await signInOne(cookie, i);
        if (!signInRes) {
            results.push(`账号${i + 1} 签到失败`);
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
            statusText = `账号${i + 1} 今日已签到：连续签到 ${continuousDays ?? '未知'} 天，本次获得积分 ${gainedPoints}，经验值 ${gainedExp}，总积分 ${totalPoints ?? '未知'}`;
        } else {
            statusText = `账号${i + 1} 签到异常：${signInRes.msg || '未知错误'}`;
        }

        results.push(statusText);
    }

    const allResult = results.join('\n');
    console.log(allResult);
    await sendTelegram(allResult);
}

main();
