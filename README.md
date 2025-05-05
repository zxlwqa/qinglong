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
示例：
```
fps_accelerat=56; PHPSESSID=pjptn9og12hrp1obt0ga5lqnr2; wordpress_logged_in_123456 wordpress_sec_123456
```
> F12打开开发者工具，应用(Application)选项卡，然后点击左侧Cookie，打开链接，找到字样fps_accelerat，PHPSESSID，wordpress_logged _in，wordpress_sec_

### 安装依赖
```
axios
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
4. console选项卡下面输入代脚本按回车键，整理出关键的的cookie已经在剪贴板上， 可直接粘贴
```
var CV = '单引号里粘贴cookie';
var CookieValue = CV.match(/pt_pin=.+?;/) + CV.match(/pt_key=.+?;/);
copy(CookieValue);
```
