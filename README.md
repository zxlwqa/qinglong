# qinglong
青龙拉库
```
https://github.com/zxlwq/qinglong.git
```
token
```
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
```
黑名单
```
anifx8.js｜hf.js｜yuqiee.js
```

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
kpn=NEBULA; kpf=ANDROID_PHONE; did=ANDROID_16ef840c2fe8a3d0; c=XIAOMI; ver=13.5; language=zh-cn; countryCode=CN; sys=ANDROID_14; net=WIFI; deviceName=Xiaomi%2822041216C%29; did_tag=0; thermal=10000; kcv=1599; app=0; bottom_navigation=true; android_os=0; oDid=ANDROID_cae79bcc9290f055; boardPlatform=mt6895; newOc=XIAOMI; androidApiLevel=34; slh=0; country_code=cn; nbh=44; hotfix_ver=; did_gt=1745769732489; cdid_tag=2; max_memory=256; oc=XIAOMI; sh=2460; deviceBit=0; browseType=3; ddpi=440; socName=MediaTek+MT6895Z%2FTCZA; sw=1080; ftt=K-T-T; apptype=22; abi=arm64; cl=0; userRecoBit=0; device_abi=arm64; icaver=1; totalMemory=5473; iuid=; rdid=ANDROID_15327b04d8fa3426; sbh=100; darkMode=false; __NSWJ=; client_key=2ac2a76d; token=; didv=1750139594000; userId=3392418271; ud=3392418271; mod=Xiaomi%2822041216C%29; isp=CUCC; is_background=0; earphoneMode=1; appver=13.5.30.10106; grant_browse_type=AUTHORIZED; egid=DFP5340BBB9E411EFC7141FC81FA3911FFB2FE5168A6D73BD19B527283584816; keyconfig_state=1; kuaishou.api_st=Cg9rdWFpc2hvdS5hcGkuc3QSoAFAyYkUCBqyuv4d68eOXUtpKKybWy8tIEkCtBfW9UAyVhQSPYZwE-3d4djIMJQomRzTzENBnFBLv4H3WP8BqGKR1l-Rb-2zeA3AOkV0s0LqHhhefWHv7bHk9EzwjLZGLttPBVD0qXpGVLhaggI1xuz31atRIo4j1GU2dv4g_YydH_7JwGv067TehyoWYCXes70T8AZ2WH7D0Xp35ntDeIGTGhJvFHrrKslACKKghHE7NlCD-YgiIAhEg7TrsBa4urJZDca4m3hB2fJ1cSozxRL7VqFfaJw1KAUwAQ; kuaishou.h5_st=Cg5rdWFpc2hvdS5oNS5zdBKgAfEy95N95Y0yKGI7x-CeLRHaVaJGdHs_8Z4W4qwlXg4pHWJHaq2luGDK5rs3DhciRqAOAYSpFQFjQogs5XTxAyKmNmW-PVEtIqW8b3nAfs8deg1u0fXd1SnQdxqiCT0-q2Infe-xf55VmB0melGYAs1_MchVUBNy-wSzGeT5xZ5tJRC9A3O-oxqQL6xfJieeCvaGwA_s-xPseW-3iyAIossaEp0eftNRumGRlTzDnTam4VQFlCIgcMuShjBDJQNe5YorVsANIO6ZiuC5eN2-eC1Qm1K1_fEoBTAB; sid=dc728f53-ef48-4677-9530-912d71df6ef6; cold_launch_time_ms=1750768351415
```
```
kpn=NEBULA; kpf=ANDROID_PHONE; userId=2413418020; did=ANDROID_16ef840c2fe8a3d0; c=XIAOMI; ver=13.5; appver=13.5.30.10106; language=zh-cn; countryCode=CN; sys=ANDROID_14; mod=Xiaomi%2822041216C%29; net=WIFI; deviceName=Xiaomi%2822041216C%29; earphoneMode=1; isp=CUCC; ud=2413418020; did_tag=0; egid=DFP5340BBB9E411EFC7141FC81FA3911FFB2FE5168A6D73BD19B527283584816; thermal=10000; kcv=1599; app=0; bottom_navigation=true; android_os=0; oDid=ANDROID_cae79bcc9290f055; boardPlatform=mt6895; newOc=XIAOMI; androidApiLevel=34; slh=0; country_code=cn; nbh=44; hotfix_ver=; did_gt=1745769732489; keyconfig_state=2; cdid_tag=2; max_memory=256; sid=324c4838-b809-4da5-800f-0b359bdaf171; cold_launch_time_ms=1750768502417; oc=XIAOMI; sh=2460; deviceBit=0; browseType=3; ddpi=440; socName=MediaTek+MT6895Z%2FTCZA; is_background=0; sw=1080; ftt=K-T-T; apptype=22; abi=arm64; cl=0; userRecoBit=0; device_abi=arm64; icaver=1; totalMemory=5473; grant_browse_type=AUTHORIZED; iuid=; rdid=ANDROID_15327b04d8fa3426; sbh=100; darkMode=true; kuaishou.api_st=Cg9rdWFpc2hvdS5hcGkuc3QSoAEhHb_2eHSRHOvqdLAsywoumHGxeNDrjZzcrvVdcXJ9y9v58Fr5LVzoDX34hxtDtIasiMwwLgfG3mxvCuRWaDFLSbmiN8_SNOhahOC-Ge4uJo55X0Zp9nFy7VSMr7pNyvyd4SA-pM8Gi2n4H0iEsu2I21ADGsToCmLplJfydBYm0SFQtHS8u4dhxZu5A5-40abwKtlrk0B-cjpa40dluuUCGhLs1J4yL3FOXJxWhbfIVnwvpekiIOydB-474Zro9_yPDlSb6QUDNAKpTSw7kyHyXyg-LO6rKAUwAQ; __NSWJ=; client_key=2ac2a76d; kuaishou.h5_st=Cg5rdWFpc2hvdS5oNS5zdBKgATLGO-Ec61OuhLIjZn7tDh9TJtK178rLZaBBf9ccT7JfN1NYBRqPv2GUpXTEca1l9l2erSmn8R-ilvZEf_xpvHVtKZy0SbBX6_QI9rWCarWe8Wg80-vvi2mBqBBPqJNMB6G6wQ_3M8iYFHI69hktvMmwoNwaCRHVpjulGSTbogSZVIyrTscyXzjUcQAdwZe927ApTGSr_ltcFjQhQCD8TwIaEo3k5KRX4ULYkpGR6pyhS_hpIyIgxnO26k2l37kDSAIkASx-o8j8Ph2JlYlJCWpX9FLyKoAoBTAB; token=
```
```
kpn=NEBULA; kpf=ANDROID_PHONE; userId=236513167; did=ANDROID_16ef840c2fe8a3d0; c=XIAOMI; ver=13.5; appver=13.5.30.10106; language=zh-cn; countryCode=CN; sys=ANDROID_14; mod=Xiaomi%2822041216C%29; net=WIFI; deviceName=Xiaomi%2822041216C%29; earphoneMode=1; isp=CUCC; ud=236513167; did_tag=0; egid=DFP5340BBB9E411EFC7141FC81FA3911FFB2FE5168A6D73BD19B527283584816; thermal=10000; kcv=1599; app=0; bottom_navigation=true; android_os=0; oDid=ANDROID_cae79bcc9290f055; boardPlatform=mt6895; newOc=XIAOMI; androidApiLevel=34; slh=0; country_code=cn; nbh=44; hotfix_ver=; did_gt=1745769732489; keyconfig_state=1; cdid_tag=2; max_memory=256; sid=976cfac9-c88f-4fee-ac71-ad81f34fa3de; cold_launch_time_ms=1750768895895; oc=XIAOMI; sh=2460; deviceBit=0; browseType=3; ddpi=440; socName=MediaTek+MT6895Z%2FTCZA; is_background=0; sw=1080; ftt=K-T-T; apptype=22; abi=arm64; cl=0; userRecoBit=0; device_abi=arm64; icaver=1; totalMemory=5473; grant_browse_type=INITIALIZATION; iuid=; rdid=ANDROID_15327b04d8fa3426; sbh=100; darkMode=false; kuaishou.api_st=Cg9rdWFpc2hvdS5hcGkuc3QSoAG32QphY_BIf1s6I5DgNmFGFWlXhcWXAc6H4ZEpIBfv1sd-FnB9SQnSMreJo0PVKJzELBYr54tdv9M4lt6WNAnc0wFSEg3wjKZqBHoEaMvPl5e0T7LG3w5XPKi2jojizvhfe8UbBuF5G-tx5KWAYnEWRc71AyEWqCHezDsPoHpHvZi4K--Cka1dQs6HMhHBovy-ocQw5zo_K-5BaRPvxkebGhIUM110NdJDN4QHnTx2pK5v0IIiIAAs8M9qO995DdaHncTcFKNuYIK-r-6XrzACvFwqoCEAKAUwAQ; __NSWJ=; client_key=2ac2a76d; kuaishou.h5_st=Cg5rdWFpc2hvdS5oNS5zdBKgAQ8UMSD2Q7fFMXPI1lyQx0P2oG6gUxXWjD54BxgU0aLi7tBfnKir5eBPPS7lkkMkOPJQOdvJUH2XRryQIoEUKzzDBfHZfSIMmuTeFebYIyf-1QvvAo5GXND8egcoDypx2CfGZRsYQUlbHZFoFVdZ_wNOUl4bqanrHjdVAqsju0y-9wy31ayKWm4clR0uixwH5uz3tVf4ktGOnO7-ZjZmWMsaEgduzxS3De8OcL6wm9oIlLYepiIgLTSSwk4b27mUfH1U2JBMduMMEMq_5i8cZuvbZo1adb8oBTAB; token=
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
