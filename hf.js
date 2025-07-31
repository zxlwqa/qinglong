// @name         Zxlwq
// @title        Spaces空间保活
// @version      1.0.0
// @description  支持多账号签到，积分查询，Telegram 推送
// @author       Zxlwq
// @cron         0 8 * * *  # 每天 8:00 执行
// @grant        none

const axios = require("axios");

// 环境变量
const HF_URLS = process.env.HF_URLS || "";
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;
const HF_TOKENS = process.env.HF_TOKENS || "";

function getTokenForSpace(spaceId) {
  let username = "";
  if (spaceId.includes("/")) {
    username = spaceId.split("/")[0];
  } else if (spaceId.includes("-")) {
    username = spaceId.split("-")[0];
  }
  const tokenMap = {};
  HF_TOKENS.split(",").forEach(pair => {
    const [user, token] = pair.split(":").map(s => s.trim());
    if (user && token) tokenMap[user] = token;
  });
  return tokenMap[username] || null;
}

async function restartSpace(spaceId) {
  let apiSpaceId = spaceId;
  if (!apiSpaceId.includes("/")) {
    const idx = apiSpaceId.indexOf("-");
    if (idx > 0) {
      apiSpaceId = apiSpaceId.slice(0, idx) + "/" + apiSpaceId.slice(idx + 1);
    }
  }
  const token = getTokenForSpace(apiSpaceId);
  if (!token) {
    console.log(`[WARN] 未找到 ${apiSpaceId} 的 Access Token，无法重启`);
    return false;
  }
  try {
    const res = await axios.post(
      `https://huggingface.co/api/spaces/${apiSpaceId}/restart`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "Mozilla/5.0 (QL-Monitor)",
        },
        timeout: 10000,
      }
    );
    if (res.status === 200) {
      console.log(`[INFO] 已请求重启 Space: ${apiSpaceId}`);
      return true;
    } else {
      console.log(`[ERROR] 重启 Space 失败: ${apiSpaceId}，状态码: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`[ERROR] 重启 Space 失败: ${apiSpaceId}，原因: ${err.message}`);
    return false;
  }
}

async function sendTelegram(message, isAlert = false) {
  if (!TG_BOT_TOKEN || !TG_USER_ID) {
    console.log("[WARN] Telegram 环境变量未设置，跳过推送");
    return;
  }
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TG_USER_ID,
      text: message + "\n\nTelegram 消息推送成功",
      parse_mode: "Markdown",
      disable_notification: !isAlert,
    });
    console.log("[INFO] ✅ Telegram 消息推送成功");
  } catch (err) {
    console.log("[ERROR] ❌ Telegram 推送失败：", err.message);
  }
}

// 主逻辑
async function checkSpaces() {
  const rawSpaces = HF_URLS.split(",").map((s) => s.trim()).filter(Boolean);

  if (rawSpaces.length === 0) {
    console.error("[ERROR] ❌ 未配置 HF_URLS 环境变量");
    return;
  }

  let messages = [];
  let alertFlag = false;

  for (const rawId of rawSpaces) {
    let username = "",
      spacename = "",
      spaceId = "",
      subdomain = "";
    if (rawId.includes("/")) {
      [username, spacename] = rawId.split("/");
      spaceId = `${username}/${spacename}`;
      subdomain = `${username}-${spacename}`;
    } else if (rawId.includes("-")) {
      [username, spacename] = rawId.split("-");
      spaceId = `${username}/${spacename}`;
      subdomain = rawId;
    } else {
      messages.push(`❌ 不支持的空间格式：${rawId}`);
      alertFlag = true;
      continue;
    }

    const webUrl = `https://huggingface.co/spaces/${spaceId}`;
    const subUrl = `https://${subdomain}.hf.space`;
    const apiUrl = `https://huggingface.co/api/spaces/${spaceId}`;

    let apiStatus = "UNKNOWN";
    let apiDuration = 0;
    try {
      const startApi = Date.now();
      const res = await axios.get(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (QL-Monitor)" },
        timeout: 10000,
      });
      apiDuration = Date.now() - startApi;
      apiStatus = res.data?.runtime?.stage || "UNKNOWN";
    } catch (err) {
      messages.push(`❌ ${webUrl} 无法访问 API：${err.message}`);
      alertFlag = true;
      continue;
    }

    let webStatusOk = false,
      webStatusCode = null,
      webDuration = 0;
    try {
      const startWeb = Date.now();
      const webRes = await axios.get(webUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (QL-Monitor)" },
        timeout: 10000,
        validateStatus: () => true,
      });
      webDuration = Date.now() - startWeb;
      webStatusCode = webRes.status;
      webStatusOk = webStatusCode === 200;
    } catch (err) {
      messages.push(`❌ ${webUrl} 无法访问App页面：${err.message}`);
      alertFlag = true;
    }

    let subStatusOk = false,
      subStatusCode = null,
      subDuration = 0;
    try {
      const startSub = Date.now();
      const subRes = await axios.get(subUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (QL-Monitor)" },
        timeout: 10000,
        validateStatus: () => true,
      });
      subDuration = Date.now() - startSub;
      subStatusCode = subRes.status;
      subStatusOk = subStatusCode === 200;
    } catch (err) {
      messages.push(`❌ ${subUrl} 无法访问公共页面：${err.message}`);
      alertFlag = true;
    }

    let statusSymbol = "";
    switch (apiStatus) {
      case "RUNNING":
        statusSymbol = "✅ ●Running";
        break;
      case "PAUSED":
        statusSymbol = "❌ ●Paused";
        break;
      case "BUILDING":
        statusSymbol = "❌ ●Building";
        break;
      case "SLEEPING":
        statusSymbol = "❌ ●Sleeping";
        break;
      case "ERROR":
        statusSymbol = "❌ ●Error";
        break;
      default:
        statusSymbol = "❌ " + (apiStatus || "Unknown");
        break;
    }

    let statusMsg =
      (apiStatus === "RUNNING" && webStatusOk && subStatusOk ? "✅" : "❌") +
      ` ${webUrl}\n`;
    statusMsg += `  • **空间 ID**：${spaceId}\n`;
    statusMsg += `  • **运行状态**：${statusSymbol}\n`;
    statusMsg += `  • **API 响应**：${apiDuration}ms\n`;
    statusMsg += `  • **App页面**：${
      webStatusOk ? `✅ 状态码 200，耗时 ${webDuration}ms` : `❌ 状态码 ${webStatusCode || "无响应"}`
    }\n`;
    statusMsg += `  • **公共页面**：${
      subStatusOk ? `✅ 状态码 200，耗时 ${subDuration}ms` : `❌ 状态码 ${subStatusCode || "无响应"}`
    }\n`;

    if (apiStatus !== "RUNNING" || !webStatusOk || !subStatusOk) {
      alertFlag = true;
    }

    if (apiStatus === "SLEEPING") {
      const restartResult = await restartSpace(spaceId);
      if (restartResult) {
        statusMsg += `  • **已自动请求重启该 Space**\n`;
      } else {
        statusMsg += `  • **尝试重启失败（未配置token或请求失败）**\n`;
      }
    }

    messages.push(statusMsg);
  }

  const finalMessage = `📡 *Spaces空间状态报告*\n\n${messages.join("\n")}`;
  if (alertFlag) {
    await sendTelegram(finalMessage, true);
  }
  console.log(finalMessage);
}

!(async () => {
  console.log(`[INFO] 开始检测 HuggingFace Spaces 状态...`);
  await checkSpaces();
})();
