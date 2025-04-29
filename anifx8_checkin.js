const axios = require('axios');

const COOKIE = process.env.ANIFX8_COOKIE; // 你的 Cookie

if (!COOKIE) {
    console.error('请先设置环境变量 ANIFX8_COOKIE');
    process.exit(1);
}

async function signIn() {
    try {
        const res = await axios.post(
            'https://anifx8.com/wp-admin/admin-ajax.php',
            new URLSearchParams({ action: 'user_checkin' }),
            {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://anifx8.com/user-sign?tab=signin',
                }
            }
        );
        // 输出签到结果
        if (typeof res.data === 'object') {
            console.log('签到返回：', JSON.stringify(res.data, null, 2));
        } else {
            console.log('签到返回：', res.data);
        }
    } catch (e) {
        if (e.response) {
            console.error('签到异常：', e.response.status, e.response.data);
        } else {
            console.error('签到异常：', e.message);
        }
    }
}

signIn();
