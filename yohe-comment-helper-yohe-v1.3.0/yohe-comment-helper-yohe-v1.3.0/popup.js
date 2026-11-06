'use strict';
const DEFAULTS = {
  commentText: '感谢分享',
  authorName: '',
  authorEmail: '',
  overwriteProfile: false,
  autoSubmitAndReload: false,
  autoRandomLib: false,
  genRandNickMail: false,
  libComment: ["感谢分享","佳作推荐","值得一试","体验不错","强烈推荐"],
  libNick: ["星野","晚风","青衫","雾屿","知夏"],
  libEmail: ["demo01@example.com","demo02@example.com","demo03@example.com"],
  submittedUrls: {}
};
const $ = (id) => document.getElementById(id);
const status = (message, error = false) => {
  $('status').textContent = message;
  $('status').style.color = error ? '#b42318' : '#027a48';
};

function randomStr(minLen=5,maxLen=10){
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
  const len = Math.floor(Math.random()*(maxLen-minLen+1))+minLen;
  let s = "";
  for(let i=0;i<len;i++){
    s += chars[Math.floor(Math.random()*chars.length)];
  }
  return s;
}
function generateNick(){
  return randomStr(5,10);
}
function generateEmail(){
  const domains = ["gmail.com","outlook.com","yahoo.com","protonmail.com","example.org","test.io","mailer.dev"];
  const local = randomStr(6,12);
  const dom = domains[Math.floor(Math.random()*domains.length)];
  return `${local}@${dom}`;
}

function arrToText(arr){ return (arr||[]).join("\n"); }
function textToArr(text){
  return text.split("\n")
    .map(s=>s.trim())
    .filter(s=>s.length>0);
}
function randomPick(arr){
  if(!Array.isArray(arr)||arr.length===0) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}

async function loadSettings() {
  const data = await chrome.storage.local.get(DEFAULTS);
  $('commentText').value = data.commentText;
  $('authorName').value = data.authorName;
  $('authorEmail').value = data.authorEmail;
  $('overwriteProfile').checked = Boolean(data.overwriteProfile);
  $('autoSubmitAndReload').checked = Boolean(data.autoSubmitAndReload);
  $('autoRandomLib').checked = Boolean(data.autoRandomLib);
  $('genRandNickMail').checked = Boolean(data.genRandNickMail);
  $('libComment').value = arrToText(data.libComment);
  $('libNick').value = arrToText(data.libNick);
  $('libEmail').value = arrToText(data.libEmail);
}

function readSettings() {
  return {
    commentText: $('commentText').value.trim(),
    authorName: $('authorName').value.trim(),
    authorEmail: $('authorEmail').value.trim(),
    overwriteProfile: $('overwriteProfile').checked,
    autoSubmitAndReload: $('autoSubmitAndReload').checked,
    autoRandomLib: $('autoRandomLib').checked,
    genRandNickMail: $('genRandNickMail').checked,
    libComment: textToArr($('libComment').value),
    libNick: textToArr($('libNick').value),
    libEmail: textToArr($('libEmail').value)
  };
}

$('toggleLibPanel').addEventListener('click',()=>{
  const panel = $('libPanel');
  if(panel.classList.contains('open')){
    panel.classList.remove('open');
    $('toggleLibPanel').textContent = '▶ 展开编辑话术、昵称、邮箱库';
  }else{
    panel.classList.add('open');
    $('toggleLibPanel').textContent = '▼ 收起编辑话术、昵称、邮箱库';
  }
});

$('randComment').addEventListener('click',()=>{
  const s = readSettings();
  const item = randomPick(s.libComment);
  if(!item){ status("评论话术库为空，请先编辑库",true);return; }
  if(!/^[\u4e00-\u9fff]{3,5}$/.test(item)){ status("抽到的评论不符合3‑5汉字规则，请检查库",true);return; }
  $('commentText').value = item;
  status(`随机评论：${item}`);
});

$('randName').addEventListener('click',()=>{
  const s = readSettings();
  let item;
  if(s.genRandNickMail){
    item = generateNick();
  }else{
    item = randomPick(s.libNick);
    if(!item){ status("昵称库为空，请先编辑库或开启程序生成昵称邮箱",true);return; }
  }
  $('authorName').value = item;
  status(`随机昵称：${item}`);
});

$('randMail').addEventListener('click',()=>{
  const s = readSettings();
  let item;
  if(s.genRandNickMail){
    item = generateEmail();
  }else{
    item = randomPick(s.libEmail);
    if(!item){ status("邮箱库为空，请先编辑库或开启程序生成昵称邮箱",true);return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)){ status("抽到的邮箱格式错误，请检查库",true);return; }
  }
  $('authorEmail').value = item;
  status(`随机邮箱：${item}`);
});

$('save').addEventListener('click', async () => {
  const settings = readSettings();
  if (!/^[\u4e00-\u9fff]{3,5}$/.test(settings.commentText)) {
    status('评论必须是 3–5 个汉字。', true);
    return;
  }
  if (settings.authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.authorEmail)) {
    status('邮箱格式不正确。', true);
    return;
  }
  const badCommentItems = settings.libComment.filter(x=>!/^[\u4e00-\u9fff]{3,5}$/.test(x));
  if(badCommentItems.length>0){
    status(`话术库存在不符合3‑5汉字条目：${badCommentItems.join("、")}`,true);
    return;
  }
  await chrome.storage.local.set(settings);
  status('设置&库已保存在本机。');
});

$('fill').addEventListener('click', async () => {
  const settings = readSettings();
  if (!/^[\u4e00-\u9fff]{3,5}$/.test(settings.commentText)) {
    status('评论必须是 3–5 个汉字。', true);
    return;
  }
  await chrome.storage.local.set(settings);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('https://yohe.one/game/')) {
    status('请先打开 yohe.one 的游戏详情页。', true);
    return;
  }
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'YOHE_FILL_COMMENT_FORM' });
    if(result?.autoTriggered){
      status("已执行自动填写+提交，页面即将刷新");
    }else if(result?.skipped){
      status("该网址已记录自动提交过，自动提交跳过；手动填写完成", true);
    }else{
      status(result?.ok ? '表单已填写，请回到网页核对并手动发布。' : '已执行填写检查；请查看网页提示补全缺失字段。', !result?.ok);
    }
  } catch (_error) {
    status('当前页面尚未加载扩展脚本，请刷新游戏详情页后重试。', true);
  }
});

// 清除已提交记录
$('clearRecord').addEventListener('click', async ()=>{
  await chrome.storage.local.set({submittedUrls:{}});
  status("✅ 全部已提交网址记录已清空，可以重新自动提交");
});

loadSettings().catch(() => status('读取设置失败，请重新打开扩展。', true));
