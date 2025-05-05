const axios = require('axios');

const COOKIE = process.env.ANIFX8_COOKIE; // 你的 Cookie
const PUSH_KEY = process.env.PUSH_KEY;    // Server酱推送Key

if (!COOKIE) {
    console.error('请先设置环境变量 ANIFX8_COOKIE');
    process.exit(1);
}

// 多账号支持，逗号分隔
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
        let msg = '';
        if (typeof res.data === 'object') {
            msg = JSON.stringify(res.data, null, 2);

            // 新增：美化输出累计签到天数和总积分
            const days = res.data.continuous_day;
            const credit = res.data.data && res.data.data.integral;
            const exp = res.data.data && res.data.data.points;
            if (days !== undefined && credit !== undefined && exp !== undefined) {
                if (res.data.error === false) {
                    console.log(`账号${index+1}签到成功：累计签到${days}天，总积分${credit}，经验值${exp}`);
                } else if (res.data.error === true && res.data.msg && res.data.msg.includes('今日已签到')) {
                    console.log(`账号${index+1}今日已签到：累计签到${days}天，总积分${credit}，经验值${exp}`);
                }
            }
        } else {
            msg = res.data;
        }
        console.log(`账号${index+1}签到返回：`, msg);
        return `账号${index+1}签到返回：${msg}`;
    } catch (e) {
        let errMsg = '';
        if (e.response) {
            errMsg = `账号${index+1}签到异常：${e.response.status} ${JSON.stringify(e.response.data)}`;
        } else {
            errMsg = `账号${index+1}签到异常：${e.message}`;
        }
        console.error(errMsg);
        return errMsg;
    }
}

async function sendServerChan(content) {
    if (!PUSH_KEY) {
        console.log('未设置PUSH_KEY，跳过Server酱推送');
        return;
    }
    try {
        await axios.post(
            `https://sctapi.ftqq.com/${PUSH_KEY}.send`,
            new URLSearchParams({ title: 'Anifx8签到通知', desp: content })
        );
        console.log('Server酱推送成功');
    } catch (e) {
        console.error('Server酱推送失败：', e.message);
    }
}

async function main() {
    let results = [];
    for (let i = 0; i < COOKIES.length; i++) {
        const result = await signInOne(COOKIES[i], i);
        results.push(result);
    }
    const allResult = results.join('\n\n');
    await sendServerChan(allResult);
}

main();
