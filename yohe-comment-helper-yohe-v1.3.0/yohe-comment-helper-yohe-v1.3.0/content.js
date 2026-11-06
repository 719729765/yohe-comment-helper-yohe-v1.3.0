(() => {
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

  const isValidComment = (value) => /^[\u4e00-\u9fff]{3,5}$/.test(String(value || '').trim());

  function randomStr(minLen=5,maxLen=10){
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
    const len = Math.floor(Math.random()*(maxLen-minLen+1))+minLen;
    let s = "";
    for(let i=0;i<len;i++){
      s += chars[Math.floor(Math.random()*chars.length)];
    }
    return s;
  }
  function generateNick(){ return randomStr(5,10); }
  function generateEmail(){
    const domains = ["gmail.com","outlook.com","yahoo.com","protonmail.com","example.org","test.io","mailer.dev"];
    const local = randomStr(6,12);
    const dom = domains[Math.floor(Math.random()*domains.length)];
    return `${local}@${dom}`;
  }

  function setNativeValue(element, value) {
    if (!element || value == null) return;
    const proto = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(element, String(value));
    else element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function showNotice(message, isError = false) {
    let notice = document.getElementById('yohe-comment-helper-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'yohe-comment-helper-notice';
      Object.assign(notice.style, {
        position: 'fixed', right: '18px', bottom: '18px', zIndex: '2147483647',
        maxWidth: '360px', padding: '11px 15px', borderRadius: '9px',
        background: '#202733', color: '#fff', fontSize: '13px', lineHeight: '1.6',
        boxShadow: '0 4px 18px rgba(0,0,0,.28)',
        border: '1px solid rgba(255,255,255,.12)'
      });
      document.body.appendChild(notice);
    }
    notice.style.borderLeft = isError ? '4px solid #ef4444' : '4px solid #22c55e';
    notice.textContent = message;
    clearTimeout(notice._hideTimer);
    notice._hideTimer = setTimeout(() => notice.remove(), 6500);
  }
  async function getSettings() {
    return await chrome.storage.local.get(DEFAULTS);
  }
  function randomPick(arr){
    if(!Array.isArray(arr)||arr.length===0) return null;
    return arr[Math.floor(Math.random()*arr.length)];
  }
  // 取当前页面干净url（去掉#hash，保留path）
  function getCleanUrl(){
    const u = new URL(location.href);
    u.hash = "";
    return u.toString();
  }

  async function fillForm(isManualTrigger = false) {
    const form = document.querySelector('#commentform');
    if (!form) {
      showNotice('没有找到评论表单。请确认当前是 yohe.one 的游戏详情页。', true);
      return { ok: false, reason: 'form_not_found' };
    }
    let settings = await getSettings();
    const cleanUrl = getCleanUrl();

    // ✅ 关键：自动提交开关开启、并且不是手动触发 → 判断是否已经记录
    if(settings.autoSubmitAndReload && !isManualTrigger){
      if(settings.submittedUrls[cleanUrl]){
        showNotice(`✅ 该页面 ${cleanUrl} 已经自动提交过，跳过本次自动提交`, false);
        return { ok:true, skipped:true };
      }
    }

    if(settings.autoRandomLib){
      const randComment = randomPick(settings.libComment);
      if(randComment && isValidComment(randComment)) settings.commentText = randComment;
      if(settings.genRandNickMail){
        settings.authorName = generateNick();
        settings.authorEmail = generateEmail();
      }else{
        const randNick = randomPick(settings.libNick);
        if(randNick) settings.authorName = randNick;
        const randMail = randomPick(settings.libEmail);
        if(randMail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(randMail)) settings.authorEmail = randMail;
      }
    }

    const comment = form.querySelector('#comment[name="text"]');
    const author = form.querySelector('#author[name="author"]');
    const mail = form.querySelector('#mail[name="mail"]');
    const answer = form.querySelector('#yanzhengma[name="sum"]');
    const num1 = form.querySelector('input[name="num1"]');
    const num2 = form.querySelector('input[name="num2"]');

    if (comment && isValidComment(settings.commentText)) {
      if (!comment.value.trim()) setNativeValue(comment, settings.commentText.trim());
    }
    if (author && settings.authorName && (settings.overwriteProfile || !author.value.trim())) {
      setNativeValue(author, settings.authorName.trim());
    }
    if (mail && settings.authorEmail && (settings.overwriteProfile || !mail.value.trim())) {
      setNativeValue(mail, settings.authorEmail.trim());
    }
    const a = num1 ? Number(num1.value) : NaN;
    const b = num2 ? Number(num2.value) : NaN;
    if (answer && Number.isSafeInteger(a) && Number.isSafeInteger(b) && a >= 0 && b >= 0) {
      setNativeValue(answer, String(a + b));
    }
    const missing = [];
    if (!comment?.value.trim()) missing.push('3–5 个汉字评论');
    if (!author?.value.trim()) missing.push('昵称');
    if (!mail?.value.trim()) missing.push('邮箱');
    if (!answer?.value.trim()) missing.push('验证码答案');
    if (missing.length) {
      const message = `已尝试自动填写；仍需检查：${missing.join('、')}`;
      showNotice(message, true);
      return { ok: false, reason: 'fields_missing', missing };
    }

    if(settings.autoSubmitAndReload){
      const submitBtn = form.querySelector('[type="submit"]');
      if(submitBtn){
        showNotice(`全部字段已就绪，即将自动点击发布按钮，稍后刷新页面。验证码 ${a}+${b}=${a+b}`);
        // 标记该url已经提交
        settings.submittedUrls[cleanUrl] = true;
        await chrome.storage.local.set({submittedUrls: settings.submittedUrls});

        setTimeout(()=>{
          submitBtn.click();
          setTimeout(()=>{
            window.location.reload();
          }, 1200);
        },300);
        return { ok:true, autoTriggered:true, sum:a+b };
      }else{
        showNotice("开启自动提交，但未找到发布小飞机按钮！",true);
        return {ok:false, reason:"submit_btn_not_found"};
      }
    }

    const message = `已填写评论表单，验证码为 ${a} + ${b} = ${a + b}。请核对内容后自行点击发布。`;
    showNotice(message);
    return { ok: true, sum: a + b };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'YOHE_FILL_COMMENT_FORM') {
      // 弹窗手动点击【立即填写】标记 isManualTrigger=true，不受url记录限制
      fillForm(true).then(sendResponse).catch((error) => {
        showNotice(`填写失败：${error.message || error}`, true);
        sendResponse({ ok: false, reason: 'exception' });
      });
      return true;
    }
    return false;
  });

  let scheduled = false;
  const scheduleFill = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      if (document.querySelector('#commentform')) fillForm(false).catch(() => {});
    }, 250);
  };
  function detectNewForm() {
    const form = document.querySelector('#commentform');
    if (form && form.dataset.yoheHelperSeen !== '1') {
      form.dataset.yoheHelperSeen = '1';
      scheduleFill();
    }
  }
  detectNewForm();
  const observer = new MutationObserver(detectNewForm);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('pageshow', detectNewForm);
})();
