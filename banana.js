/**
 * 香蕉视频 APP
 * 手机号#密码
 * export BANANA_ACCOUNT = '18888888888#123456'
 * 多账号用 & 或换行
 */
const initScript = require('../utils/initScript')
const { $, notify, sudojia, checkUpdate } = initScript('香蕉视频');

// 账号格式：区号#手机号#密码 ；区号可省略，默认 86
const bananaList = process.env.BANANA_ACCOUNT ? process.env.BANANA_ACCOUNT.split(/[\n&]/) : [];

// 接口地址
const baseUrl = 'https://mgcrjh.ipajx0.cc'

// 消息推送
let message = '';

!(async () => {
  await checkUpdate($.name, bananaList);
  for (let i = 0; i < bananaList.length; i++) {
    const index = i + 1;
    const parts = bananaList[i].split('#');
    let prefix = '86', phone, pwd;
    if (parts.length === 3) {
      [prefix, phone, pwd] = parts;
    } else if (parts.length === 2) {
      phone = parts[0];
      pwd = parts[1];
    }
    console.log(`\n*****第[${index}]个${$.name}账号*****`);

    // 每个账号独立 headers
    const myHeaders = {
      "x-system": "Android",
      "x-channel": "xj1",
      "x-version": "5.0.5",
      'User-Agent': sudojia.getRandomUserAgent('H5'),
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
    };
    console.log(`UA: ${myHeaders['User-Agent']}`);

    message += `📣====${$.name}账号[${index}]====📣\n`;

    await main(prefix, phone, pwd, myHeaders, index);
    await $.wait(sudojia.getRandomWait(2000, 2500));
  }
  if (message) {
    await notify.sendNotify(`「${$.name}」`, `${message}`);
  }
})().catch((e) => $.logErr(e)).finally(() => $.done());

async function main(prefix, phone, pwd, myHeaders, index) {
  let newFavorites = [];

  // 登录
  await login(prefix, phone, pwd, myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 获取用户信息
  await getUserInfo(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 签到
  await sign(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 添加收藏
  newFavorites = await addFavorite(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 删除本次新收藏
  await removeFavorite(myHeaders, newFavorites, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 点击广告任务
  await adViewClick(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 下载长视频任务
  await downLoadVideoTask(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 观看影片任务
  await watchVideo(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 保存二维码任务
  await qrcodeSave(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 发布评论任务
  await postComment(myHeaders, index);
  await $.wait(sudojia.getRandomWait(1500, 2000));

  // 获取金币
  await getPoints(myHeaders, index);
}

function getRandomVodId() {
  return Math.floor(Math.random() * 66000) + 1;
}

/**
 * 登录
 */
async function login(prefix, phone, pwd, myHeaders, idx) {
  try {
    const body = `logintype=0&mobiprefix=${prefix}&mobi=${phone}&password=${pwd}`;
    const data = await sudojia.sendRequest(`${baseUrl}/login`, 'post', myHeaders, body);
    if (data.retcode !== 0) {
      return console.error(`[${idx}] 登录失败：${data.errmsg}`);
    }
    myHeaders['X-Cookie-Auth'] = data.data.xxx_api_auth;
    console.log(`[${idx}] 登录成功~`);
  } catch (e) {
    console.error(`[${idx}] 登录异常：${e}`);
  }
}

async function getUserInfo(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/ucp/index`, 'get', myHeaders);
    if (data.retcode !== 0) return console.error(`[${idx}] 获取用户信息失败：${data.errmsg}`);
    console.log(`[${idx}] 昵称：${data.data.user.username}`);
    message += `昵称：${data.data.user.username}\n`;
  } catch (e) {
    console.error(`[${idx}] 获取用户信息异常：${e}`);
  }
}

async function sign(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/ucp/task/sign`, 'post', myHeaders);
    if (data.retcode !== 0) {
      message += `${data.errmsg}\n`;
      return console.error(`[${idx}] 签到失败：${data.errmsg}`);
    }
    console.log(`[${idx}] 签到成功，金币+${data.data.taskdone}`);
    message += `签到成功\n`;
  } catch (e) {
    console.error(`[${idx}] 签到异常：${e}`);
  }
}

async function addFavorite(myHeaders, idx) {
  const maxAttempts = 5;
  let added = [];
  for (let i = 0; i < 5; i++) {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        const vodid = getRandomVodId();
        const data = await sudojia.sendRequest(`${baseUrl}/favorite/add`, 'post', myHeaders, `vodid=${vodid}`);
        if (data.retcode === 0) {
          console.log(`[${idx}] 第 ${i + 1} 次收藏视频成功！`);
          added.push(vodid);
          await $.wait(sudojia.getRandomWait(1500, 2300));
          break;
        } else if (data.retcode === -1) {
          console.log(`[${idx}] 第 ${i + 1} 次收藏视频失败（已收藏），重新尝试...`);
          attempt++;
          await $.wait(sudojia.getRandomWait(1500, 2300));
        } else {
          console.error(`[${idx}] 第 ${i + 1} 次收藏视频失败，错误代码：${data.retcode}，错误信息：${data.errmsg}`);
          return added;
        }
      } catch (e) {
        console.error(`[${idx}] 收藏视频异常：${e}`);
      }
    }
  }
  return added;
}

async function removeFavorite(myHeaders, vodids, idx) {
  try {
    if (!vodids || vodids.length === 0) return;
    const data = await sudojia.sendRequest(`${baseUrl}/favorite/remove`, 'post', myHeaders, `vodids=${vodids}`);
    if (data.retcode !== 0) return console.error(`[${idx}] 删除收藏视频失败：${data.errmsg}`);
    console.log(`[${idx}] 已删除${vodids.length}项`);
  } catch (e) {
    console.error(`[${idx}] 删除收藏异常：${e}`);
  }
}

async function adViewClick(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/ucp/task/adviewClick`, 'get', myHeaders);
    if (data.retcode !== 0) return console.error(`[${idx}] 点击广告失败：${data.errmsg}`);
    console.log(`[${idx}] 点击广告成功，金币+${data.data.taskdone}`);
  } catch (e) {
    console.error(`[${idx}] 点击广告异常：${e}`);
  }
}

async function downLoadVideoTask(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/vod/reqdown/${getRandomVodId()}`, 'get', myHeaders);
    if (data.retcode !== 0) {
      if (data.retcode === 3) {
        await $.wait(sudojia.getRandomWait(800, 1200));
        return await downLoadVideoTask(myHeaders, idx);
      }
      return console.error(`[${idx}] 下载长视频失败：${data.errmsg}`);
    }
    if (!data.data.taskdone) {
      return console.log(`[${idx}] 下载长视频任务已完成`);
    }
    console.log(`[${idx}] 下载长视频任务成功，金币+${data.data.taskdone}`);
  } catch (e) {
    console.error(`[${idx}] 下载长视频异常：${e}`);
  }
}

async function watchVideo(myHeaders, idx) {
  try {
    let watched = 0;
    let failCount = 0;
    while (watched < 10) {
      const data = await sudojia.sendRequest(`${baseUrl}/v2/vod/reqplay/${getRandomVodId()}`, 'get', myHeaders);
      if (data.retcode !== 0) {
        const msg = data.errmsg || '';
        console.error(`[${idx}] 观看影片任务失败：${msg}`);
        if (msg.includes('今日观影次数已用完')) break;
        if (msg.includes('记录不存在') && ++failCount > 5) break;
        await $.wait(sudojia.getRandomWait(800, 1200));
        continue;
      }
      watched++;
      failCount = 0;
      console.log(`[${idx}] 已观看影片数量：${watched}`);
      await $.wait(sudojia.getRandomWait(1500, 2300));
    }
  } catch (e) {
    console.error(`[${idx}] 观看影片异常：${e}`);
  }
}

async function qrcodeSave(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/ucp/task/qrcodeSave`, 'get', myHeaders);
    if (data.retcode !== 0) return console.error(`[${idx}] 保存二维码任务失败：${data.errmsg}`);
    console.log(`[${idx}] 保存二维码任务成功，金币+${data.data.taskdone}`);
  } catch (e) {
    console.error(`[${idx}] 保存二维码异常：${e}`);
  }
}

async function postComment(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/comment/post`, 'post', myHeaders, `vodid=${getRandomVodId()}&content=好`);
    if (data.retcode !== 0) {
      if (data.retcode === 3) {
        await $.wait(sudojia.getRandomWait(800, 1200));
        return await postComment(myHeaders, idx);
      }
      return console.error(`[${idx}] 发布评论失败：${data.errmsg}`);
    }
    console.log(`[${idx}] ${data.errmsg}`);
  } catch (e) {
    console.error(`[${idx}] 发布评论异常：${e}`);
  }
}

async function getPoints(myHeaders, idx) {
  try {
    const data = await sudojia.sendRequest(`${baseUrl}/ucp/index`, 'get', myHeaders);
    if (data.retcode !== 0) return console.error(`[${idx}] 获取金币失败：${data.errmsg}`);
    console.log(`[${idx}] 当前金币：${data.data.user.goldcoin}`);
    message += `当前金币：${data.data.user.goldcoin}\n`;
  } catch (e) {
    console.error(`[${idx}] 获取金币异常：${e}`);
  }
}
