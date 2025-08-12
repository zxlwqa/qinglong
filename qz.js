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

// ==================== 工具函数 ====================

// 延时函数，单位毫秒
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// 计算从start时间点到现在经过的秒数
function getTimeSec(start) {
  return Math.round((Date.now() - start) / 1000);
}

// 计算 g_tk（用于请求签名），基于cookie中的 p_skey 或 skey
function computeGtk(cookie) {
  const skey = getCookieValue(cookie, 'p_skey') || getCookieValue(cookie, 'skey');
  if (!skey) return null;
  let hash = 5381;
  for (let i = 0; i < skey.length; i++) {
    hash += (hash << 5) + skey.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}

// 从cookie字符串中提取指定key的值
function getCookieValue(cookie, key) {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// 解析并返回QQ号（uin）
function parseUin(cookie) {
  let uin = getCookieValue(cookie, 'p_uin') || getCookieValue(cookie, 'uin') || process.env.QZ_UIN;
  if (!uin) return null;
  uin = uin.replace(/^o/, '');
  return /^\d+$/.test(uin) ? uin : null;
}

// 从接口返回对象中提取消息文本，优先级依次为 msg/message/errmsg 等
function pickMsg(obj) {
  return obj?.msg || obj?.message || obj?.errmsg || obj?.errMsg || obj?.retmsg || obj?.retMsg || (typeof obj?.ret === 'number' ? `ret=${obj.ret}` : '') || (obj?.raw ? obj.raw.slice(0, 200) : '');
}

// 构建请求头，包含User-Agent、Cookie、Referer等信息
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

// 封装POST请求，自动解析返回JSON（支持JSONP格式）
async function requestPost(url, headers, body, timeout = 10000) {
  try {
    const res = await axios.post(url, body, {
      headers,
      timeout,
      transformResponse: [(data) => {
        // 去掉可能存在的 JSONP 包裹函数，解析纯JSON
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

// ==================== 核心功能API ====================

// 获取农场月签到主页数据
async function monthHome(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(HOME_URL, headers, postData);
}

// 执行每日签到操作
async function daySignin(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(DAY_URL, headers, postData);
}

// 查询当前奖励状态
async function queryRewards(cookie, uin, gtk) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=index`;
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(url, headers, postData);
}

// 领取指定奖励ID的奖励
async function getReward(cookie, uin, gtk, rewardId) {
  const url = `https://nc.qzone.qq.com/cgi-bin/cgi_farm_buling?act=get`;
  const postData = `g_tk=${gtk}&uin=${uin}&id=${rewardId}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(url, headers, postData);
}

// 获取农场等级评分奖励抽奖状态
async function getJudgeScoreDraw(cookie, uin, gtk) {
  const postData = `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`;
  const headers = buildHeaders(cookie);
  return await requestPost(DRAW_URL, headers, postData);
}

// 领取七日祈愿礼
async function drawWish(cookie, uin, gtk) {
  const postData = `version=4.1.0&uinY=${uin}&id=0&act=day7Login_draw&platform=14&farmTime=${Math.floor(Date.now() / 1000)}&appid=353`;
  const headers = buildHeaders(cookie, 'https://game.qqnc.qq.com', 'https://game.qqnc.qq.com/');
  return await requestPost('https://nc.qzone.qq.com/cgi-bin/cgi_common_activity?', headers, postData);
}

// ==================== 奖励处理功能 ====================

// 处理周活跃大礼包，返回领取状态字符串
async function handleWeeklyGifts(cookie, uin, gtk) {
  try {
    const weeklyStatus = await requestPost(
      'https://nc.qzone.qq.com/cgi-bin/query?act=2221001',
      buildHeaders(cookie),
      `g_tk=${gtk}&uin=${uin}&format=json&_=${Date.now()}`
    );

    if (weeklyStatus?.ecode !== 0 || weeklyStatus?.code !== 1) {
      return `查询失败(${pickMsg(weeklyStatus)})`;
    }

    const scoreValues = [15, 30, 60, 90, 120];
    let resultLines = [];

    for (let week = 1; week <= 4; week++) {
      const drawMask = weeklyStatus[`l_draw_${week}`] || 0;
      let claimedScores = [];

      for (let i = 0; i < scoreValues.length; i++) {
        if ((drawMask & (1 << i)) !== 0) {
          claimedScores.push(scoreValues[i]);
        }
      }

      if (claimedScores.length > 0) {
        resultLines.push(`第${week}周 已领取礼包: ${claimedScores.join(', ')}`);
      }
    }

    if (resultLines.length === 0) {
      return '无活跃礼包';
    }

    return resultLines.join('\n');
  } catch (e) {
    return `周活跃大礼包异常(${e.message || e})`;
  }
}

// 处理通行证所有奖励，自动领取未领取奖励并返回所有已领取ID数组
async function handlePassportRewardsAll(cookie, uin, gtk) {
  const headers = buildHeaders(cookie, 'https://game.qqnc.qq.com', 'https://game.qqnc.qq.com/');

  let receivedIds = [];
  try {
    const rewardsStatus = await queryRewards(cookie, uin, gtk);
    receivedIds = [];
    if (rewardsStatus?.ecode === 0 && Array.isArray(rewardsStatus.gift)) {
      for (const giftObj of rewardsStatus.gift) {
        for (const id in giftObj) {
          if ((giftObj[id]?.length || 0) > 0) {
            receivedIds.push(Number(id));
          }
        }
      }
    }
  } catch (e) {
    receivedIds = [];
  }

  const rewardIds = Array.from({ length: 10 }, (_, i) => i + 1);
  const toReceiveIds = rewardIds.filter(id => !receivedIds.includes(id));

  if (toReceiveIds.length === 0) {
    return receivedIds;
  }

  const tasks = toReceiveIds.map(id => {
    const postData = `type=1&id=${id}&uinY=${uin}&uIdx=${uin}&farmTime=${Math.floor(Date.now() / 1000)}&appid=353&version=0.1.430.0`;
    return requestPost('https://nc.qzone.qq.com/cgi-bin/exchange?act=2197002', headers, postData)
      .then(res => {
        if (res.direction && (res.direction.includes('领取过') || res.ecode === 0)) {
          return id;
        }
        return null;
      })
      .catch(() => null);
  });

  const results = await Promise.all(tasks);
  return Array.from(new Set([...receivedIds, ...results.filter(id => id !== null)]));
}

// 仅打印已兑换过的矿工通行证奖励id，积分不足不打印
async function handleMinerPassportRewards(cookie, uin, gtk) {
  const headers = buildHeaders(cookie, 'https://game.qqnc.qq.com', 'https://game.qqnc.qq.com/');
  const now = Math.floor(Date.now() / 1000);

  let redeemedIds = [];

  for (let id = 1; id <= 10; id++) {
    const postData = `type=1&id=${id}&uIdx=${uin}&platform=14&uinY=${uin}&act=ex&version=4.1.0&farmTime=${now}&appid=353`;
    try {
      const res = await requestPost('https://nc.qzone.qq.com/cgi-bin/act_ios_passport?', headers, postData);
      if (res.direction === '您已经兑换过了~') {
        redeemedIds.push(id);
      }
    } catch (e) {
    }
  }

  if (redeemedIds.length > 0) {
    return `已兑换过 ${redeemedIds.join(' ')}`;
  } else {
    return '无奖励';
  }
}

// ==================== 账号执行主流程 ====================

async function runOne(index, cookie) {
  // 计算签名和解析uin
  const gtk = computeGtk(cookie);
  const uin = parseUin(cookie);
  if (!uin) return { index, uin: '未知', error: '解析 uin 失败' };
  if (gtk == null) return { index, uin, error: '解析 g_tk 失败' };

  try {
    // 获取主页信息，检测今天是否签到过
    let home = await monthHome(cookie, uin, gtk);
    const todaySigninBefore = home?.today_signin === 1;

    let dayMsg = '';
    if (!todaySigninBefore) {
      // 今日未签到，执行签到
      const day = await daySignin(cookie, uin, gtk);
      dayMsg = pickMsg(day) || '签到完成';

      if (day?.ecode === -102) {
        dayMsg = '今日已签到';
      }

      await sleep(1000);
      home = await monthHome(cookie, uin, gtk);
    } else {
      dayMsg = '今日已签到';
    }

    // 补领奖励
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

    // 农场等级评估奖励领取
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

    // 累积签到奖励领取
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

    // 七日祈愿礼领取
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

    // 周活跃礼包领取情况
    const weeklyGiftMsg = await handleWeeklyGifts(cookie, uin, gtk);

    // 通行证奖励领取情况
    const receivedPassportIds = await handlePassportRewardsAll(cookie, uin, gtk);
    let passportRewardMsg = '无已领取奖励';
    if (receivedPassportIds.length > 0) {
      passportRewardMsg = '已领取 ' + receivedPassportIds.sort((a, b) => a - b).join(' ');
    }

    // 矿工通行证奖励日志
    const passportMinerRewardMsg = await handleMinerPassportRewards(cookie, uin, gtk);

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
      weeklyGiftMsg,
      passportRewardMsg,
      passportMinerRewardMsg,
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

// ==================== 主入口函数 ====================

async function main() {
  const startTs = Date.now();

  // 读取环境变量中的所有账号cookie，按换行拆分
  let cookies = process.env.QQ_COOKIE || '';
  cookies = cookies.split('\n').map(s => s.trim()).filter(Boolean);

  if (cookies.length === 0) {
    console.log('未检测到 QQ_COOKIE 环境变量');
    console.log('\n✅ 签到任务中止\n');
    process.exit(1);
  }

  const results = [];
  const concurrency = MAX_ACCOUNTS; // 并发数限制
  let index = 0;

  // 递归执行账号签到任务，控制并发数
  async function runNext() {
    if (index >= cookies.length) return;
    const i = index++;
    const res = await runOne(i + 1, cookies[i]);
    results[i] = res;
    await runNext();
  }

  // 启动多个并发任务
  const runners = [];
  for (let i = 0; i < concurrency; i++) {
    runners.push(runNext());
  }

  await Promise.all(runners);

  // 日志与推送内容拼接
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
        `周活跃大礼包:${r.weeklyGiftMsg}\n` +
        `通行证奖励: ${r.passportRewardMsg}\n` +
        `矿工通行证奖励：${r.passportMinerRewardMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累积签到天数: ${r.maxDay}\n` +
        `是否可领取累积奖励: ${r.canDraw}\n` +
        '--------------------------\n';

      pushText +=
        `账户${r.index}: ${r.uin}\n` +
        `每日签到: ${r.dayMsg}\n` +
        `奖励补领: ${r.rewardMsg}\n` +
        `农场级别评估: ${r.judgeMsg}\n` +
        `累积签到奖励: ${r.cumRewardMsg}\n` +
        `七日祈愿礼: ${r.wishMsg}\n` +
        `周活跃大礼包:${r.weeklyGiftMsg}\n` +
        `通行证奖励: ${r.passportRewardMsg}\n` +
        `矿工通行证奖励：${r.passportMinerRewardMsg}\n` +
        `本月已签到天数: ${r.monthDays}\n` +
        `累积签到天数: ${r.maxDay}\n` +
        `是否可领取累积奖励: ${r.canDraw}\n\n`;
    }
  }
  console.log(logText);

  // 发送Telegram消息推送
  const tgResult = await sendTelegram(pushText);
  if (tgResult) {
    console.log('Telegram 推送成功\n');
  } else {
    console.log('Telegram 推送失败或未配置\n');
  }
}

// ==================== Telegram推送函数 ====================

async function sendTelegram(message) {
  if (!TG_BOT_TOKEN || !TG_USER_ID) {
    console.log('未配置 Telegram Bot Token 或用户ID，跳过推送');
    return false;
  }
  try {
    const res = await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      chat_id: TG_USER_ID,
      text: message
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    return res.data.ok === true;
  } catch (error) {
    console.log('Telegram 推送异常:', error.message || error);
    return false;
  }
}

// ==================== 脚本启动入口 ====================

main().catch(err => {
  console.error('脚本执行异常:', err);
  process.exit(1);
});
