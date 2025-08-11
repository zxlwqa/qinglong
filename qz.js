/*
QQ空间农场签到脚本
简洁版：多账号汇总推送 Telegram，先判断是否签到，未签到才执行签到，签到后延迟更新状态，自动领取奖励（只显示是否已领取），领取级别评估奖励（仅显示成功或已领取）
Node.js 环境，适用于青龙等平台
Cron示例：15 9 * * *
*/

const https = require('https');
const { URL } = require('url');

const MONTH_HOME_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_home';
const DAY_SIGN_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_day';
const JUDGE_SCORE_DRAW_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_judge_score_draw';

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

const UA = process.env.QZ_UA || 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.0.0';

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getTimeSec(start) {
  return Math.round((Date.now() - start) / 1000);
}

function computeGtk(cookie) {
  const skey = getCookieValue(cookie, 'p_skey') || getCookieValue(cookie, 'skey');
  if (!skey) return null;
  let hash = 5381;
  for (let i = 0; i < skey.length; i++) {
    hash += (hash << 5) + skey.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}

function getCookieValue(cookie, key) {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function parseUin(cookie) {
  let uin = getCookieValue(cookie, 'p_uin') || getCookieValue(cookie, 'uin') || process.env.QZ_UIN;
  if (!uin) return null;
  uin = uin.replace(/^o/, '');
  return /^\d+$/.test(uin) ? uin : null;
}

function buildHeaders(cookie) {
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Origin': 'https://nc.qzone.qq.com',
    'Referer': 'https://nc.qzone.qq.com/',
    'Cookie': cookie,
    'Connection': 'keep-alive'
  };
}

function requestPost(urlStr, headers, body, timeout = 10000) {
  const url = new URL(urlStr);
  const options = { method: 'POST', headers, timeout };
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          let body = data.trim().replace(/^[^(]*\(/, '').replace(/\)\s*;?$/, '');
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Request timeout')));
    req.write(body);
    req.end();
  });
}

async function monthHome(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  };
  return await requestPost(MONTH_HOME_URL, headers, postData);
}

async function daySignin(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  };
  return await requestPost(DAY_SIGN_URL, headers, postData);
}

async function queryRewards(cookie, uin, gtk) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=index`;
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  };
  return await requestPost(url, headers, postData);
}

async function getReward(cookie, uin, gtk, rewardId) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=get`;
  const postData = `g_tk=${gtk}&uin=${uin}&id=${rewardId}&format=json&_=${Date.now()}`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  };
  return await requestPost(url, headers, postData);
}

async function getJudgeScoreDraw(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  };
  return await requestPost(JUDGE_SCORE_DRAW_URL, headers, postData);
}

async function drawWish(cookie, uin, gtk) {
  const postData = `version=4.1.0&uinY=${uin}&id=0&act=day7Login_draw&platform=14&farmTime=${Math.floor(Date.now() / 1000)}&appid=353`;
  const headers = {
    ...buildHeaders(cookie),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'Origin': 'https://game.qqnc.qq.com',
    'Referer': 'https://game.qqnc.qq.com/',
  };
  return await requestPost('https://nc.qzone.qq.com/cgi-bin/cgi_common_activity?', headers, postData);
}

function pickMsg(obj) {
  return obj?.msg || obj?.message || obj?.errmsg || obj?.errMsg || obj?.retmsg || obj?.retMsg || (typeof obj?.ret === 'number' ? `ret=${obj.ret}` : '') || (obj?.raw ? obj.raw.slice(0, 200) : '');
}

async function sendTelegram(message) {
  if (!TG_BOT_TOKEN || !TG_USER_ID) return false;
  const payload = JSON.stringify({ chat_id: TG_USER_ID, text: message });
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  return new Promise((resolve) => {
    const req = https.request(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(!!result.ok);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

async function runOne(index, cookie) {
  const gtk = computeGtk(cookie);
  const uin = parseUin(cookie);
  if (!uin) return { index, uin: '未知', error: '解析 uin 失败' };
  if (gtk == null) return { index, uin, error: '解析 g_tk 失败' };

  try {
    let home = await monthHome(cookie, uin, gtk);
    const todaySigninBefore = home?.today_signin === 1;

    let dayMsg = '';
    if (!todaySigninBefore) {
      const day = await daySignin(cookie, uin, gtk);
      dayMsg = pickMsg(day) || '签到完成';

      if (day?.ecode === -102) {
        dayMsg = '今日已签到';
      }

      await sleep(7000);

      home = await monthHome(cookie, uin, gtk);
    } else {
      dayMsg = '今日已签到';
    }

    let rewardMsg = '';
    let hasReceived = false;
    try {
      const rewards = await queryRewards(cookie, uin, gtk);
      if (rewards?.ecode === 0 && Array.isArray(rewards.gift)) {
        for (const giftObj of rewards.gift) {
          for (const key in giftObj) {
            const res = await getReward(cookie, uin, gtk, key);
            if (res?.ecode !== 0) {
              if (res.ret === -102 || res.ret === -10000) {
                hasReceived = true;
              }
            }
            await sleep(1500);
          }
        }
      }
    } catch {}

    rewardMsg = hasReceived ? '奖励领取: 已领取奖励' : '无可领取奖励';

    let judgeMsg = '';
    try {
      const judgeRes = await getJudgeScoreDraw(cookie, uin, gtk);

      if (judgeRes?.ecode === 0) {
        judgeMsg = '级别评估奖励领取: 成功';
      } else if (
        judgeRes?.ret === -102 ||
        judgeRes?.ret === -10000 ||
        judgeRes?.ecode === -101
      ) {
        judgeMsg = '级别评估奖励领取: 已领取奖励';
      }
    } catch (err) {
      console.log(`账户${index}: ${uin} 级别评估奖励接口异常:`, err?.message || err);
    }

    let cumRewardMsg = '';
    const rewardDays = [2, 4, 7, 12, 18, 25];
    if (rewardDays.includes(home?.month_days)) {
      try {
        const drawRes = await requestPost(
          'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_draw',
          {
            ...buildHeaders(cookie),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(`g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`)
          },
          `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`
        );
        if (drawRes?.ecode === 0) {
          cumRewardMsg = `累积签到奖励：成功领取`;
        } else if (drawRes?.ret === -102 || drawRes?.ret === -10000) {
          cumRewardMsg = `累积签到奖励：已领取`;
        } else {
          cumRewardMsg = `累积签到奖励：失败(${pickMsg(drawRes)})`;
        }
      } catch (err) {
        cumRewardMsg = `累积签到奖励：异常(${err.message || err})`;
      }
    } else {
      cumRewardMsg = `累积签到奖励：未到领取天数`;
    }

    let wishMsg = '';
    try {
      const wishRes = await drawWish(cookie, uin, gtk);
      if (wishRes?.ecode === 0) {
        wishMsg = `祈愿礼领取：成功`;
      } else if (wishRes?.ecode === -102) {
        wishMsg = `祈愿礼领取：已领取`;
      } else {
        wishMsg = `祈愿礼领取：失败(${pickMsg(wishRes)})`;
      }
    } catch (err) {
      wishMsg = `祈愿礼领取：异常(${err.message || err})`;
    }

    const monthDays = home?.month_days ?? 0;
    const maxDay = home?.info?.maxday ?? 0;
    const canDraw = home?.can_draw === 1 ? '是' : '否';

    return {
      index,
      uin,
      dayMsg,
      rewardMsg,
      judgeMsg,
      cumRewardMsg,
      wishMsg,
      monthDays,
      maxDay,
      canDraw,
    };
  } catch (err) {
    return {
      index,
      uin: uin || '未知',
      error: err?.message || err,
    };
  }
}

async function main() {
  const startTs = Date.now();

  let cookies = process.env.QZ_COOKIE || '';
  cookies = cookies.split('\n').map(s => s.trim()).filter(Boolean);

  if (cookies.length === 0) {
    console.log('未检测到 QZ_COOKIE 环境变量');
    console.log('\n✅ 签到任务中止\n');
    process.exit(1);
  }

  const results = [];
  for (let i = 0; i < cookies.length; i++) {
    const res = await runOne(i + 1, cookies[i]);
    results.push(res);
    if (i < cookies.length - 1) await sleep(500);
  }

  let logText = 'QQ农场每日签到\n\n';
  let pushText = 'QQ农场每日签到\n\n';
  for (const r of results) {
    if (r.error) {
      logText += `账户${r.index}: ${r.uin} 错误 -> ${r.error}\n--------------------------\n`;
      pushText += `账户${r.index}: ${r.uin} 错误 -> ${r.error}\n\n`;
    } else {
      logText +=
        `账户${r.index}: ${r.uin}\n` +
        `签到结果: ${r.dayMsg}\n` +
        `${r.rewardMsg}\n` +
        `${r.judgeMsg}\n` +
        `${r.cumRewardMsg}\n` +
        `${r.wishMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累计签到天数: ${r.maxDay}\n` +
        `今日是否可领奖: ${r.canDraw}\n` +
        '--------------------------\n';

      pushText +=
        `账户${r.index}: ${r.uin}\n` +
        `签到结果: ${r.dayMsg}\n` +
        `${r.rewardMsg}\n` +
        `${r.judgeMsg}\n` +
        `${r.cumRewardMsg}\n` +
        `${r.wishMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累计签到天数: ${r.maxDay}\n` +
        `今日是否可领奖: ${r.canDraw}\n\n`;
    }
  }

  console.log(logText.trim());
  const ok = await sendTelegram(pushText.trim());
  console.log(ok ? 'Telegram 推送成功' : 'Telegram 推送失败');

  console.log(`\n✅ 签到任务完成，用时 ${getTimeSec(startTs)} 秒\n`);
}

main().catch(err => {
  const errMsg = err?.stack || err;
  console.log(`脚本致命错误：${errMsg}`);
  console.log(`\n❌ 签到失败\n`);
  process.exit(1);
});
