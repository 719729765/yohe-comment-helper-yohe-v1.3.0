Yohe 评论表单助手（Chrome Manifest V3）
版本：1.3.0

运行范围
- 仅在 https://yohe.one/game/* 页面运行。
- Manifest 的 content_scripts.matches 和 host_permissions 均限定为 https://yohe.one/game/*。
- content.js 再次检查协议必须为 HTTPS、主机必须精确等于 yohe.one、路径必须以 /game/ 开头。
- 不会在 yohe.one 的其他路径、其他子域名、HTTP 页面或其他网站运行。

功能
1. 页面打开后自动查找 #commentform；评论区延迟加载时也会识别。
2. 自动填写默认评论“感谢分享”，可修改为 3–5 个汉字。
3. 默认保留网页已有昵称和邮箱；可在扩展设置中填写自己的昵称/邮箱，并选择是否覆盖已有值。
4. 读取隐藏字段 num1、num2，计算并填写 #yanzhengma[name="sum"]。
5. 不自动点击发布按钮；请核对评论和资料后，由用户手动点击小飞机。
6. 只有用户真实触发表单提交，且 action 是 https://yohe.one 同源 /game/ 路径时，才记录返回页面刷新状态。
7. 如果服务器返回原游戏详情页，自动刷新一次；先清除状态标记，避免重复刷新循环。

表单字段
- 表单：#commentform
- 评论：#comment[name="text"]
- 昵称：#author[name="author"]
- 邮箱：#mail[name="mail"]
- 验证答案：#yanzhengma[name="sum"]
- 加数：input[name="num1"]、input[name="num2"]
- 提交按钮：#submit[type="submit"]

安装
1. 解压 ZIP。
2. Chrome 地址栏输入 chrome://extensions/。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本目录（应能直接看到 manifest.json）。
6. 刷新 https://yohe.one/game/ 下的游戏详情页。

注意
- 自动填写的评论请根据实际阅读情况修改，不要发布不真实的评价。
- 扩展不会自动发布评论；手动提交后才会按设置刷新页面。
- 设置保存在 Chrome chrome.storage.local。
