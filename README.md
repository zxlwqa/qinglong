# qinglong
## 爱工作论坛签到脚本
### 添加脚本文件
```
anifx8_checkin.js
```
### 定时任务名称
```
爱工作论坛签到
```
### 定时任务命令/脚本
```
task anifx8_checkin.js
```
### 定时规则
```
0 8 * * *
```
### 环境变量名称
```
ANIFX8_COOKIE
```
### 值
搜索：
> F12打开开发者工具，网络(network)选项卡，搜索链接，打开链接，找到Cookie复制，帐号1,帐号2，用英文逗号分开
```
https://anifx8.com/wp-admin/admin-ajax.php?action=search_box
```
![blog](https://png.zxlwq.dpdns.org/blog/c6ks.webp)

### 宇柒云阁

```
https://www.yuqiee.com/wp-admin/admin-ajax.php
```

### 安装依赖 自动拆分：是
```
axios
cheerio
```
---

## 快手签到脚本
添加脚本文件
```
ks.js
```
### 定时任务名称
```
快手
```
### 定时任务命令/脚本
```
task ks.js
```
### 定时规则
```
*/20 * * * *
```
### 环境变量名称
```
KSJS_COOKIE
```
### 值 
示例：
```
kpn=NEBULA; kpf=ANDROID_PHONE; did=ANDROID_16ef840c2fe8a3d0; c=XIAOMI; ver=13.3;…
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
