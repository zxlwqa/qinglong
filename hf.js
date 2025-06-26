const axios = require("axios");

// 环境变量
const HF_SPACE_URLS = process.env.HF_SPACE_URLS || "";
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;

// Telegram 推送
async function sendTelegram(message, isAlert = false) {
  if (!TG_BOT_TOKEN || !TG_USER_ID) {
    console.log("[WARN] Telegram 环境变量未设置，跳过推送");
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      chat_id: TG_USER_ID,
      text: message,
      parse_mode: "Markdown",
      disable_notification: !isAlert,
    });
    console.log("[INFO] ✅ Telegram 推送成功");
  } catch (err) {
    console.error("[ERROR] ❌ Telegram 推送失败:", err.message);
  }
}

// 主逻辑：检查 API 状态 + 页面可访问性
async function checkSpaces() {
  const spaceIds = HF_SPACE_URLS.split(",").map((s) =>
    s.trim().replace(/^https:\/\/huggingface\.co\/spaces\//, "")
  ).filter(Boolean);

  if (spaceIds.length === 0) {
    console.error("[ERROR] ❌ 未配置 HF_SPACE_URLS 环境变量");
    return;
  }

  let messages = [];
  let alertFlag = false;

  for (const spaceId of spaceIds) {
    const apiUrl = `https://huggingface.co/api/spaces/${spaceId}`;
    const webUrl = `https://huggingface.co/spaces/${spaceId}`;

    // 1. 请求API获取状态
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
      continue; // API失败不测页面
    }

    // 2. 请求页面检查状态码
    let pageStatusOk = false;
    let pageStatusCode = null;
    let pageDuration = 0;
    try {
      const startPage = Date.now();
      const pageRes = await axios.get(webUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (QL-Monitor)" },
        timeout: 10000,
        validateStatus: () => true, // 不抛异常，自己判断状态码
      });
      pageDuration = Date.now() - startPage;
      pageStatusCode = pageRes.status;
      pageStatusOk = pageStatusCode === 200;
    } catch (err) {
      messages.push(`❌ ${webUrl} 无法访问页面：${err.message}`);
      alertFlag = true;
    }

    // 3. 状态符号映射
    let statusSymbol = "";
    switch(apiStatus) {
      case "RUNNING": statusSymbol = "●Running"; break;
      case "PAUSED": statusSymbol = "●Paused"; break;
      case "BUILDING": statusSymbol = "●Building"; break;
      case "ERROR": statusSymbol = "●Error"; break;
      default: statusSymbol = apiStatus || "Unknown"; break;
    }

    // 4. 拼接消息
    let statusMsg = `✅ ${webUrl}\n`;
    statusMsg += `  • **空间 ID**：${spaceId}\n`;
    statusMsg += `  • **运行状态**：${statusSymbol}\n`;
    statusMsg += `  • **API 响应**：${apiDuration}ms\n`;

    if (pageStatusOk) {
      statusMsg += `  • **页面访问**：✅ 状态码 200，耗时 ${pageDuration}ms\n`;
    } else {
      statusMsg += `  • **页面访问**：❌ 状态码 ${pageStatusCode || "无响应"}\n`;
      alertFlag = true;
    }

    messages.push(statusMsg);
  }

  const finalMessage = `📡 *Hugging Face Spaces 综合状态报告*\n\n${messages.join("\n")}`;
  await sendTelegram(finalMessage, alertFlag);
  console.log(finalMessage);
}

// 执行入口
!(async () => {
  console.log(`[INFO] 开始检测 HuggingFace Spaces 状态...`);
  await checkSpaces();
})();
