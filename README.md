# qinglong
新建个同步定时任务
```
rclone delete huggingface:/qinglong/db/database.sqlite && rclone sync /ql/data huggingface:/qinglong
```
### 青龙拉库
```
https://github.com/zxlwq/qinglong.git
```
### BiliBili
```
https://github.com/RayWangQvQ/BiliBiliToolPro.git
```
### 白名单
```
bili_task_.+\.sh
```
### 白名单
```
ks.js
```
### 黑名单
```
anifx8.js｜hf.js｜yuqiee.js｜qq.js｜qa.js
```
TG通知反代
```
https://cf.zxla.dpdns.org
```
# 爱工作论坛签到脚本
### 环境变量名称
> 多帐号以‘ 回车换行 ’分隔
```
ANIFX8_COOKIE
```
### 值
搜索：
> F12打开开发者工具，网络(network)选项卡，搜索链接，打开链接，找到Cookie复制，帐号1,帐号2，用英文逗号分开
```
https://anifx8.com/wp-admin/admin-ajax.php?action=search_box
```
### 宇柒云阁
### 环境变量名称
```
YUQIE_COOKIE
```
```
https://www.yuqiee.com/wp-admin/admin-ajax.php
```
### 安装依赖 自动拆分：是
```
axios
cheerio
```

![blog](https://png.zxlwq.dpdns.org/blog/c6ks.webp)


---

## huggingface
```
HF_URLS
```
```
HF_TOKENS
```
## 快手签到脚本
### 环境变量名称
```
KSJS_COOKIE
```
> 小黄鸟HttpCanary抓包，打开快手极速版点击红包，安全警告一直点继续，小黄鸟HttpCanary中找到这个链接https://nebula.kuaishou.com/rest/wd/usergrowth/encourage/matrix/resource/action?_NS_sig3=71612616，复制下面的Cookie

### 安装依赖 自动拆分：是
```
qs
axios
```
## 获取京东cookie
1. 电脑浏览器打开京东网址 https://m.jd.com/ 登录
2. 按键盘F12键打开开发者工具，选择网络(Network)选项卡
3. 点一个链接进去，找到cookie，复制出来
4. 控制台选项卡下面输入代脚本按回车键，整理出关键的的cookie已经在剪贴板上， 可直接粘贴
```
var CV = '单引号里粘贴cookie';
var CookieValue = CV.match(/pt_pin=.+?;/) + CV.match(/pt_key=.+?;/);
copy(CookieValue);
```
