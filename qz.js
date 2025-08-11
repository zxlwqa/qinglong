/*
const $ = new Env('QQ农场')
const $ = cron: 0 8 * * *
*/

const axios = require('axios');

const HOME_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_home';
const DAY_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_day';
const DRAW_URL = 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_judge_score_draw';

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

const UA = process.env.QZ_UA || 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.0.0';

const MAX_ACCOUNTS = 3;

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

function pickMsg(obj) {
  return obj?.msg || obj?.message || obj?.errmsg || obj?.errMsg || obj?.retmsg || obj?.retMsg || (typeof obj?.ret === 'number' ? `ret=${obj.ret}` : '') || (obj?.raw ? obj.raw.slice(0, 200) : '');
}

function buildHeaders(cookie, origin = 'https://nc.qzone.qq.com', referer = 'https://nc.qzone.qq.com/') {
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Origin': origin,
    'Referer': referer,
    'Cookie': cookie,
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded'
  };
}

async function requestPost(url, headers, body, timeout = 10000) {
  try {
    const res = await axios.post(url, body, {
      headers,
      timeout,
      transformResponse: [(data) => {
        let jsonStr = data.trim().replace(/^[^(]*\(/, '').replace(/\)\s*;?$/, '');
        try {
          return JSON.parse(jsonStr);
        } catch {
          return { raw: data };
        }
      }]
    });
    return res.data;
  } catch (error) {
    throw error;
  }
}

async function monthHome(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(HOME_URL, headers, postData);
}

async function daySignin(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(DAY_URL, headers, postData);
}

async function queryRewards(cookie, uin, gtk) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=index`;
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(url, headers, postData);
}

async function getReward(cookie, uin, gtk, rewardId) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=get`;
  const postData = `g_tk=${gtk}&uin=${uin}&id=${rewardId}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(url, headers, postData);
}

async function getJudgeScoreDraw(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(DRAW_URL, headers, postData);
}

async function drawWish(cookie, uin, gtk) {
  const postData = `version=4.1.0&uinY=${uin}&id=0&act=day7Login_draw&platform=14&farmTime=${Math.floor(Date.now() / 1000)}&appid=353`;
  const headers = buildHeaders(cookie, 'https://game.qqnc.qq.com', 'https://game.qqnc.qq.com/');
  return await requestPost('https://nc.qzone.qq.com/cgi-bin/cgi_common_activity?', headers, postData);
}

async function sendTelegram(message) {
  if (!TG_BOT_TOKEN || !TG_USER_ID) return false;
  try {
    const res = await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      chat_id: TG_USER_ID,
      text: message
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    return res.data.ok === true;
  } catch {
    return false;
  }
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

      await sleep(3000);
      home = await monthHome(cookie, uin, gtk);
    } else {
      dayMsg = '今日已签到';
    }

    let rewardMsg = '';
    let hasReceived = false;
    try {
      const rewards = await queryRewards(cookie, uin, gtk);
      if (rewards?.ecode === 0 && Array.isArray(rewards.gift)) {
        const rewardPromises = [];
        for (const giftObj of rewards.gift) {
          for (const key in giftObj) {
            rewardPromises.push(
              getReward(cookie, uin, gtk, key).then(res => {
                if (res?.ecode !== 0) {
                  if (res.ret === -102 || res.ret === -10000) {
                    hasReceived = true;
                  }
                }
              }).catch(() => { })
            );
          }
        }
        await Promise.all(rewardPromises);
      }
    } catch { }
    rewardMsg = hasReceived ? '已领取' : '无奖励';

    let judgeMsg = '';
    try {
      const judgeRes = await getJudgeScoreDraw(cookie, uin, gtk);
      if (judgeRes?.ecode === 0) {
        judgeMsg = '成功';
      } else if (
        judgeRes?.ret === -102 ||
        judgeRes?.ret === -10000 ||
        judgeRes?.ecode === -101
      ) {
        judgeMsg = '已领取';
      }
    } catch (err) {
      judgeMsg = '接口异常';
    }

    let cumRewardMsg = '';
    const rewardDays = [2, 4, 7, 12, 18, 25];
    if (rewardDays.includes(home?.month_days)) {
      try {
        const drawRes = await requestPost(
          'https://nc.qzone.qq.com/cgi-bin/cgi_farm_month_signin_draw',
          buildHeaders(cookie),
          `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`
        );
        if (drawRes?.ecode === 0) {
          cumRewardMsg = '成功领取';
        } else if (drawRes?.ret === -102 || drawRes?.ret === -10000) {
          cumRewardMsg = '已领取';
        } else {
          cumRewardMsg = `失败(${pickMsg(drawRes)})`;
        }
      } catch (err) {
        cumRewardMsg = `异常(${err.message || err})`;
      }
    } else {
      cumRewardMsg = '未到领取天数';
    }

    let wishMsg = '';
    try {
      const wishRes = await drawWish(cookie, uin, gtk);
      if (wishRes?.ecode === 0) {
        wishMsg = '成功';
      } else if (wishRes?.ecode === -102) {
        wishMsg = '已领取';
      } else {
        wishMsg = `失败(${pickMsg(wishRes)})`;
      }
    } catch (err) {
      wishMsg = `异常(${err.message || err})`;
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
  const concurrency = MAX_ACCOUNTS;
  let index = 0;

  async function runNext() {
    if (index >= cookies.length) return;
    const i = index++;
    const res = await runOne(i + 1, cookies[i]);
    results[i] = res;
    await runNext();
  }

  const runners = [];
  for (let i = 0; i < concurrency; i++) {
    runners.push(runNext());
  }

  await Promise.all(runners);

  let logText = 'QQ农场每日签到\n\n';
  let pushText = 'QQ农场每日签到\n\n';
  for (const r of results) {
    if (r.error) {
      logText += `账户${r.index}: ${r.uin} 错误 -> ${r.error}\n--------------------------\n`;
      pushText += `账户${r.index}: ${r.uin} 错误 -> ${r.error}\n\n`;
    } else {
      logText +=
        `账户${r.index}: ${r.uin}\n` +
        `每日签到: ${r.dayMsg}\n` +
        `奖励补领: ${r.rewardMsg}\n` +
        `农场级别评估: ${r.judgeMsg}\n` +
        `累积签到奖励: ${r.cumRewardMsg}\n` +
        `七日祈愿礼: ${r.wishMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累积签到天数: ${r.maxDay}\n` +
        `累积签到奖励: ${r.canDraw}\n` +
        '--------------------------\n';

      pushText +=
        `账户${r.index}: ${r.uin}\n` +
        `每日签到: ${r.dayMsg}\n` +
        `奖励补领: ${r.rewardMsg}\n` +
        `农场级别评估: ${r.judgeMsg}\n` +
        `累积签到奖励: ${r.cumRewardMsg}\n` +
        `七日祈愿礼: ${r.wishMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累积签到天数: ${r.maxDay}\n` +
        `累积签到奖励: ${r.canDraw}\n\n`;
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
