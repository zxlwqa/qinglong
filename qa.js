const axios = require('axios');
const qs = require('qs');

const COOKIE = process.env.QQ_COOKIE;

if (!COOKIE) {
  console.error('错误：请先在环境变量中设置 QQ_COOKIE');
  process.exit(1);
}

// 提取 QQ 号
const uinMatch = COOKIE.match(/uin=o?0*(\d+)/);
const QQ_UIN = uinMatch ? uinMatch[1] : null;
if (!QQ_UIN) {
  console.error('无法从 Cookie 中解析 uin（QQ号）');
} else {
  console.log(`当前 QQ 号：${QQ_UIN}`);
}

// 安全编码 Cookie
function safeCookie(rawCookie) {
  return rawCookie
    .split(';')
    .map(kv => {
      const [key, ...val] = kv.split('=');
      if (!val.length) return key;
      return `${key}=${encodeURIComponent(val.join('='))}`;
    })
    .join('; ');
}

const COMMON_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Cookie: safeCookie(COOKIE),
  Referer: 'https://game.qqnc.qq.com/',
  Origin: 'https://game.qqnc.qq.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  Accept: '*/*',
};

const URLS = {
  farmQuery: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_index?mod=user&act=run',
  sunQuery: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_time_space?act=index',
  scarify: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_plant?mod=farmlandstatus&act=scarify',
  clearWeed: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_opt?mod=farmlandstatus&act=clearWeed',
  harvest: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_plant?mod=farmlandstatus&act=harvest',
  water: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_opt?mod=farmlandstatus&act=water',
  spraying: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_opt?mod=farmlandstatus&act=spraying',
  planting: 'https://nc.qzone.qq.com/cgi-bin/cgi_farm_plant?mod=farmlandstatus&act=planting',
  bag: 'https://farm.qzone.qq.com/cgi-bin/cgi_farm_getuserseed?mod=repertory&act=getUserSeed',
};

// ================= 请求重试工具 =================
async function requestWithRetry(fn, retries = 3) {
  while (retries > 0) {
    try {
      return await fn();
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.warn(`请求失败，剩余重试次数 ${retries}，1秒后重试...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ================= 获取农场状态 =================
async function getFarmStatus(url) {
  return requestWithRetry(async () => {
    const postData = {
      v_client: '1',
      appid: '353',
      version: '0.1.430.0',
      farmTime: Math.floor(Date.now() / 1000).toString(),
    };
    const res = await axios.post(url, qs.stringify(postData), {
      headers: COMMON_HEADERS,
      timeout: 10000,
    });
    return res.data;
  });
}

// ================= 获取背包种子 =================
async function getBagSeeds() {
  const postData = {
    v_client: '1',
    appid: '353',
    version: '0.1.430.0',
    farmTime: Math.floor(Date.now() / 1000).toString(),
  };

  const res = await requestWithRetry(() =>
    axios.post(URLS.bag, qs.stringify(postData), {
      headers: COMMON_HEADERS,
      timeout: 10000,
    })
  );

  if (!Array.isArray(res.data)) return [];
  const seeds = res.data.filter(seed => seed.amount > 0 && seed.isLock === 0);
  return seeds;
}

// ================= 操作单块地块 =================
async function operateFarm(landList, idx, actionUrl, actionName, isSunFarm = false) {
  const land = landList[idx];
  await new Promise(r => setTimeout(r, Math.random() * 1000 + 1000));

  try {
    let seedid = 0;
    let seedName = '';

    if (actionName === '播种') {
      const bagSeeds = await getBagSeeds();
      if (bagSeeds.length === 0) {
        land.status = '播种❌(种子不足)';
        console.log('播种前可用种子:', []);
        return;
      }

      // 优先使用网页推荐种子
      let recommendSeedId = land.recommendSeedId || 0;
      let selectedSeed = bagSeeds.find(s => s.cId === recommendSeedId);

      if (!selectedSeed) {
        // 没有推荐种子或背包中没有，使用第一个可用种子
        selectedSeed = bagSeeds[0];
      }

      seedid = selectedSeed.cId;
      seedName = selectedSeed.cName;
      console.log('播种前可用种子:', bagSeeds.map(s => s.cName), '选择播种:', seedName);
    }

    const postData = {
      place: idx.toString(),
      v_client: '1',
      farmTime: Math.floor(Date.now() / 1000).toString(),
      appid: '353',
      version: '0.1.430.0',
      ...(actionName === '播种' ? { seedid } : {}),
    };

    const res = await requestWithRetry(() =>
      axios.post(actionUrl, qs.stringify(postData), {
        headers: COMMON_HEADERS,
        timeout: 10000,
      })
    );

    if (res.data && res.data.code === 1) {
      land.status = actionName === '播种' ? `${actionName}✅(${seedName})` : `${actionName}✅`;
    } else {
      land.status = actionName === '播种' ? `${actionName}❌(${seedName})` : `${actionName}❌`;
      console.log('返回数据：', res.data);
    }
  } catch (err) {
    land.status = `${actionName}异常`;
  }

  printFarmTable(landList);
}

// ================= 分批操作函数 =================
const parallelOperate = async (landList, filterFn, actionUrl, actionName, isSunFarm = false, batchSize = 3) => {
  const tasks = landList
    .map((land, idx) => ({ land, idx }))
    .filter(({ land }) => filterFn(land));

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch.map(({ idx }) => operateFarm(landList, idx, actionUrl, actionName, isSunFarm)));
    await new Promise(r => setTimeout(r, Math.random() * 1000 + 1000));
  }
};

// ================= 打印农场表格 =================
function printFarmTable(landList) {
  const tableData = landList.map((land, idx) => ({
    '#': idx,
    a: land.a ?? '-',
    b: land.b ?? '-',
    f: land.f ?? '-',
    humidity: land.humidity ?? land.h ?? '-',
    g: land.g ?? '-',
    状态: land.status ?? '-',
  }));
  console.table(tableData);
}

// ================= 执行普通农场任务 =================
async function runFarmTasks() {
  console.log('==== QQ农场任务开始 ====');
  let farmStatus;
  try {
    farmStatus = await getFarmStatus(URLS.farmQuery);
  } catch (err) {
    console.error('获取普通农场状态失败:', err.message);
    return [];
  }

  if (!farmStatus || !Array.isArray(farmStatus.farmlandStatus)) {
    console.error('farmlandStatus 非数组');
    return [];
  }

  const landList = farmStatus.farmlandStatus;
  landList.forEach(land => (land.status = '-'));
  printFarmTable(landList);

  await parallelOperate(landList, land => land.b === 6, URLS.harvest, '收获');
  await parallelOperate(landList, land => land.b === 7, URLS.scarify, '铲地');
  await parallelOperate(landList, land => land.a === 0 && land.b === 1, URLS.planting, '播种');
  await parallelOperate(landList, land => land.humidity === 0, URLS.water, '浇水');
  await parallelOperate(landList, land => land.f === 1, URLS.spraying, '除虫');
  await parallelOperate(landList, land => land.g === 1, URLS.clearWeed, '除草');

  console.log('==== QQ农场任务结束 ====');
  return landList;
}

// ================= 执行阳光农场任务 =================
async function runSunFarmTasks() {
  console.log('==== 阳光农场任务开始 ====');
  let sunStatus;
  try {
    sunStatus = await getFarmStatus(URLS.sunQuery);
  } catch (err) {
    console.error('获取阳光农场状态失败:', err.message);
    return [];
  }

  const sunLandList = sunStatus?.res?.farmlandstatus;
  if (!Array.isArray(sunLandList)) {
    console.log('无法获取阳光农场有效地块列表');
    return [];
  }

  sunLandList.forEach(land => (land.status = '-'));
  printFarmTable(sunLandList);

  await parallelOperate(sunLandList, land => land.b === 6, URLS.harvest, '收获', true);
  await parallelOperate(sunLandList, land => land.b === 0, URLS.scarify, '铲地', true);
  await parallelOperate(sunLandList, land => land.b === 1, URLS.planting, '播种', true);
  await parallelOperate(sunLandList, land => land.humidity === 0, URLS.water, '浇水', true);

  console.log('==== 阳光农场任务结束 ====');
  return sunLandList;
}

// ================= 入口 =================
(async () => {
  console.log(`## 开始执行...  ${new Date().toLocaleString()}`);
  await runFarmTasks();
  await runSunFarmTasks();
})();
