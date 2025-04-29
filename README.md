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
fps_accelerat=56; PHPSESSID=pjptn9og12hrp1obt0ga5lqnr2; theme_mode=white-theme;
wordpress_logged_in_123456 wordpress_sec_123456
```
> F12打开开发者工具，网络(Network)选项卡，然后点击签到，打开链接，找到字样fps_accelerat，PHPSESSID，theme_mode，wordpress_logged _in，wordpress_sec_

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

