// ==UserScript==
// @name         LETUS用チャットボット
// @namespace    personal-letus-chatbot
// @version      1.1.0
// @updateURL    https://raw.githubusercontent.com/yuto0524999-sudo/letus-chatbot/main/letus-chatbot.user.js
// @downloadURL  https://raw.githubusercontent.com/yuto0524999-sudo/letus-chatbot/main/letus-chatbot.user.js
// @homepageURL  https://github.com/yuto0524999-sudo/letus-chatbot
// @description  LETUS上に右下フロート型のFAQチャットボットを表示する個人用ユーザースクリプト。サーバー通信は一切なし、スクリプト内のFAQデータのみで動作します。
// @author       you
// @match        https://letus.ed.tus.ac.jp/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (document.getElementById('tusLauncher')) return;

  // ============================================================
  //  1. スタイル注入
  // ============================================================
  const style = document.createElement('style');
  style.textContent = `
:root{
  --navy:#0F2A4A;
  --navy-deep:#081A30;
  --ink:#1C2530;
  --paper:#F6F7F9;
  --line:#DCE1E8;
  --gold:#C89B3C;
  --gold-soft:#F1E4C4;
  --bot-bubble:#FFFFFF;
  --user-bubble:#0F2A4A;
  --font-ui: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", -apple-system, sans-serif;
}

/* ---- フローティングチャットウィジェット ---- */
.tus-launcher{
  position: fixed; right: 26px; bottom: 26px; z-index: 999999;
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%);
  border: none; cursor: pointer;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 6px 20px rgba(8,26,48,0.35);
  transition: transform .2s ease, box-shadow .2s ease;
}
.tus-launcher:hover{ transform: scale(1.06); box-shadow: 0 8px 26px rgba(8,26,48,0.45); }
.tus-launcher .badge{
  position:absolute; top:-2px; right:-2px; width:14px; height:14px; border-radius:50%;
  background:#4CD980; border:2px solid white;
}
.tus-launcher svg{ width:28px; height:28px; }

.tus-widget{
  position: fixed; right: 26px; bottom: 26px; z-index: 999999;
  width: 380px;
  height: min(600px, calc(100vh - 52px));
  max-height: calc(100vh - 52px);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(8,26,48,0.28);
  transform-origin: bottom right;
  transition: transform .22s cubic-bezier(.2,.9,.3,1.2), opacity .18s ease;
  font-family: var(--font-ui);
}
.tus-widget.closed{ transform: scale(0.05); opacity: 0; pointer-events: none; }
.tus-widget.open{ transform: scale(1); opacity: 1; }

.tus-header{
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%);
  color: white; padding: 14px 16px; display: flex; align-items: center; gap: 12px; flex-shrink:0;
}
.tus-mark{
  width: 34px; height: 34px; border: 1.5px solid var(--gold); border-radius: 50%;
  display:flex; align-items:center; justify-content:center; font-size: 14px; flex-shrink:0;
}
.tus-header-text{ line-height:1.3; }
.tus-header-title{ font-size: 13.5px; font-weight: 600; letter-spacing: 0.3px; }
.tus-status{ margin-left:auto; display:flex; align-items:center; gap:12px; }
.tus-status-dot{ width:6px; height:6px; border-radius:50%; background:#4CD980; flex-shrink:0; }
.tus-minimize{
  background: #FFFFFF; border:none; color: #B4231F; cursor:pointer;
  height:34px; padding: 0 14px; border-radius:17px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  font-size:13px; font-weight:700; font-family: var(--font-ui);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: background .15s, transform .15s; flex-shrink:0;
}
.tus-minimize:hover{ background:#FBE4E4; transform: scale(1.06); }
.tus-minimize .x{ font-size:15px; line-height:1; }

.tus-bubble{
  position: fixed; right: 26px; bottom: 100px; z-index: 999998;
  max-width: 240px;
  background: #FFFFFF; border: 1px solid var(--navy);
  border-radius: 14px; padding: 11px 30px 11px 14px;
  font-size: 12.5px; line-height: 1.6; color: var(--ink);
  box-shadow: 0 6px 20px rgba(8,26,48,0.18);
  cursor: pointer;
  opacity: 0; transform: translateY(6px);
  transition: opacity .35s ease, transform .35s ease;
  pointer-events: none;
  font-family: var(--font-ui);
}
.tus-bubble.show{ opacity: 1; transform: translateY(0); pointer-events: auto; }
.tus-bubble::after{
  content:""; position:absolute; bottom:-8px; right: 26px;
  width: 14px; height: 14px; background:#FFFFFF;
  border-right: 1px solid var(--navy); border-bottom: 1px solid var(--navy);
  transform: rotate(45deg);
}
.tus-bubble:hover{ background:#FBF7EE; }
.tus-bubble:hover::after{ background:#FBF7EE; }
.tus-bubble-close{
  position:absolute; top:5px; right:6px;
  width:18px; height:18px; border:none; border-radius:50%;
  background:#E8EAEE; color:#5A6472; font-size:11px; line-height:1;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
}
.tus-bubble-close:hover{ background:#D2D6DC; }
@media (max-width: 700px){
  .tus-bubble{ right:16px; bottom:92px; max-width: 200px; }
}

.tus-body{
  flex:1; overflow-y:auto; padding: 16px 14px;
  display:flex; flex-direction:column; gap: 10px;
  background: radial-gradient(circle at 90% 0%, rgba(200,155,60,0.05), transparent 40%), var(--paper);
}
.tus-msg{ max-width: 84%; font-size: 13.3px; line-height:1.6; }
.tus-msg.bot{
  align-self:flex-start; background: var(--bot-bubble); border: 1px solid var(--line);
  border-radius: 4px 14px 14px 14px; padding: 10px 13px; color: var(--ink);
}
.tus-msg.user{
  align-self:flex-end; background: var(--user-bubble); color: white;
  border-radius: 14px 4px 14px 14px; padding: 10px 13px;
}
.tus-msg.bot .src{
  display:block; margin-top:8px; padding-top:7px; border-top: 1px dashed var(--line);
  font-size: 10.5px; color:#6B7684;
}
.tus-msg.bot .src-links{ display:flex; flex-direction:column; gap:5px; margin-top:6px; }
.tus-msg.bot .src-link{
  display:flex; align-items:flex-start; gap:6px; font-size: 11px; line-height:1.5; color: var(--navy);
  text-decoration:none; padding: 6px 8px; background: var(--gold-soft); border: 1px solid #E3D2A0;
  border-radius: 6px; transition: background .15s;
}
.tus-msg.bot .src-link:hover{ background:#E9D9AE; text-decoration:underline; }
.tus-msg.bot .src-link::before{ content:"🔗"; font-size:10px; flex-shrink:0; margin-top:1px; }

.tus-chips{ display:flex; flex-wrap:wrap; gap:6px; margin-top: 2px; }
.tus-chip{
  font-size: 11.5px; border: 1px solid var(--navy); color: var(--navy);
  background: white; padding: 6px 10px; border-radius: 20px; cursor:pointer; transition: all .15s ease;
}
.tus-chip:hover{ background: var(--navy); color:white; }

.tus-typing{ display:flex; gap:4px; padding: 4px 2px; }
.tus-typing span{ width:6px; height:6px; border-radius:50%; background:#A7B3C2; animation: tus-bounce 1.1s infinite ease-in-out; }
.tus-typing span:nth-child(2){ animation-delay:.15s; }
.tus-typing span:nth-child(3){ animation-delay:.3s; }
@keyframes tus-bounce{ 0%,60%,100%{ transform: translateY(0); opacity:.5;} 30%{ transform: translateY(-4px); opacity:1;} }

.tus-inputbar{ display:flex; gap:8px; padding: 12px; background:white; border-top:1px solid var(--line); flex-shrink:0; }
.tus-input{ flex:1; border:1px solid var(--line); border-radius:20px; padding: 9px 14px; font-size:13px; outline:none; font-family: var(--font-ui); }
.tus-input:focus{ border-color: var(--navy); }
.tus-send{
  width:36px; height:36px; border-radius:50%; border:none; background: var(--navy);
  color:white; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition: background .15s;
}
.tus-send:hover{ background: var(--navy-deep); }
.tus-send:disabled{ background:#B9C6D6; cursor:default; }

.tus-body::-webkit-scrollbar{ width:5px; }
.tus-body::-webkit-scrollbar-thumb{ background:#C7CFD9; border-radius:3px; }

@media (max-width: 480px){
  .tus-widget{ width: calc(100vw - 24px); height: calc(100vh - 110px); right:12px; bottom:88px; }
  .tus-launcher{ right:16px; bottom:16px; }
}
`;
  document.head.appendChild(style);

  // ============================================================
  //  2. HTML注入（起動ボタン・吹き出し・チャット本体）
  // ============================================================
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div class="tus-bubble" id="tusBubble" role="button" aria-label="チャットを開く">
  <span id="tusBubbleText">質問はありませんか？</span>
  <button class="tus-bubble-close" id="tusBubbleClose" aria-label="吹き出しを閉じる" title="閉じる">✕</button>
</div>

<button class="tus-launcher" id="tusLauncher" aria-label="LETUSサポートチャットを開く">
  <span class="badge"></span>
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="7" width="16" height="12" rx="3" stroke="white" stroke-width="1.6"/>
    <circle cx="9" cy="13" r="1.3" fill="white"/>
    <circle cx="15" cy="13" r="1.3" fill="white"/>
    <path d="M12 7V4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="12" cy="3" r="1.2" fill="white"/>
    <path d="M4 12H2M22 12H20" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
  </svg>
</button>

<div class="tus-widget closed" id="tusWidget">
  <div class="tus-header">
    <div class="tus-mark">理</div>
    <div class="tus-header-text">
      <div class="tus-header-title">LETUS用チャットボット</div>
    </div>
    <div class="tus-status">
      <span class="tus-status-dot"></span>
      <button class="tus-minimize" id="tusMinimize" aria-label="チャットを閉じる" title="チャットを閉じる">
        <span class="x">✕</span><span>閉じる</span>
      </button>
    </div>
  </div>

  <div class="tus-body" id="tusBody">
    <div class="tus-msg bot" id="tusWelcome">
      こんにちは。<b>LETUS</b>に関するご質問（ログイン、課題提出、コース登録など）にお答えします。また、「語学検定」「時間割」などのキーワードから、<b>LETUS内の掲載場所への案内</b>もできます。
      <div class="tus-chips" id="tusChips"></div>
    </div>
  </div>

  <div class="tus-inputbar">
    <input class="tus-input" id="tusInput" type="text" placeholder="質問を入力（例：課題が提出できません）" />
    <button class="tus-send" id="tusSend" aria-label="送信">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 3L13 21L11 13L3 11Z" fill="white"/></svg>
    </button>
  </div>
</div>
`;
  // childrenをまとめてbodyに追加
  Array.from(wrap.children).forEach(el => document.body.appendChild(el));

  // ============================================================
  //  3. ロジック
  // ============================================================
  const CHIP_SUGGESTIONS = [
    "課題の提出方法がわかりません",
    "LETUSにログインできません",
    "コースが見つかりません",
    "TOEICの単位認定について",
    "期末試験の日程はどこ？"
  ];

  const launcher = document.getElementById('tusLauncher');
  const widget = document.getElementById('tusWidget');
  const minimizeBtn = document.getElementById('tusMinimize');
  const body = document.getElementById('tusBody');
  const input = document.getElementById('tusInput');
  const sendBtn = document.getElementById('tusSend');
  const chipsWrap = document.getElementById('tusChips');

  function openWidget(){
    widget.classList.remove('closed');
    widget.classList.add('open');
    launcher.style.display = 'none';
    hideBubble();
    input.focus();
  }
  function closeWidget(){
    widget.classList.remove('open');
    widget.classList.add('closed');
    launcher.style.display = 'flex';
    setTimeout(showBubbleOnce, 800);
  }
  launcher.addEventListener('click', openWidget);
  minimizeBtn.addEventListener('click', closeWidget);

  // ---- 吹き出しコメント ----
  const bubble = document.getElementById('tusBubble');
  const bubbleText = document.getElementById('tusBubbleText');
  const bubbleClose = document.getElementById('tusBubbleClose');
  let bubbleDismissed = false;
  let bubbleHideTimer = null;
  let bubbleIndex = 0;
  const BUBBLE_MESSAGES = [
    "質問はありませんか？",
    "課題は提出できていますか？",
    "LETUSの操作でお困りですか？",
    "コースが見つからないときもご相談ください",
  ];

  function showBubbleOnce(){
    if(bubbleDismissed || widget.classList.contains('open')) return;
    bubbleText.innerText = BUBBLE_MESSAGES[bubbleIndex % BUBBLE_MESSAGES.length];
    bubbleIndex++;
    bubble.classList.add('show');
    clearTimeout(bubbleHideTimer);
    bubbleHideTimer = setTimeout(hideBubble, 6000);
  }
  function hideBubble(){ bubble.classList.remove('show'); }

  setTimeout(showBubbleOnce, 1200);
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible'){
      setTimeout(showBubbleOnce, 600);
    }
  });

  bubble.addEventListener('click', (e) => {
    if(e.target === bubbleClose) return;
    openWidget();
  });
  bubbleClose.addEventListener('click', (e) => {
    e.stopPropagation();
    bubbleDismissed = true;
    hideBubble();
  });

  document.addEventListener('mousedown', (e) => {
    const isOpen = widget.classList.contains('open');
    if(!isOpen) return;
    const clickedInsideWidget = widget.contains(e.target);
    const clickedLauncher = launcher.contains(e.target);
    if(!clickedInsideWidget && !clickedLauncher){
      closeWidget();
    }
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && widget.classList.contains('open')){
      closeWidget();
    }
  });

  CHIP_SUGGESTIONS.forEach(text => {
    const chip = document.createElement('span');
    chip.className = 'tus-chip';
    chip.textContent = text;
    chip.onclick = () => { input.value = text; sendMessage(); };
    chipsWrap.appendChild(chip);
  });

  function addMessage(text, sender){
    const div = document.createElement('div');
    div.className = 'tus-msg ' + sender;
    div.innerText = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function addBotMessageWithSource(answerText, sources){
    const div = document.createElement('div');
    div.className = 'tus-msg bot';

    const p = document.createElement('div');
    p.innerText = answerText;
    div.appendChild(p);

    if(sources && sources.length){
      const note = document.createElement('div');
      note.className = 'src';
      note.innerText = '詳細につきましては、以下のFAQページをご参照ください。';
      div.appendChild(note);

      const linkList = document.createElement('div');
      linkList.className = 'src-links';
      sources.forEach(item => {
        const a = document.createElement('a');
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'src-link';
        a.innerText = item.no ? `No.${item.no}　${item.q}` : item.q;
        linkList.appendChild(a);
      });
      div.appendChild(linkList);
    }
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping(){
    const div = document.createElement('div');
    div.className = 'tus-msg bot';
    div.id = 'tusTyping';
    div.innerHTML = '<div class="tus-typing"><span></span><span></span><span></span></div>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping(){
    const t = document.getElementById('tusTyping');
    if(t) t.remove();
  }

  // ---- FAQ検索エンジン（キーワード＋文字バイグラム照合） ----
  const SYNONYMS = [
    ["レタス","letus"], ["ログイン","サインイン"], ["サインイン","ログイン"],
    ["入れない","ログインできません"], ["アクセスできない","アクセスできません"],
    ["レポート","課題"], ["宿題","課題"], ["提出できない","提出できません"], ["出せない","提出できません"],
    ["アップロード","提出"], ["アップできない","アップロード"],
    ["消したい","削除"], ["消せない","削除できません"], ["取り消し","削除"],
    ["授業","コース"], ["科目","コース"], ["講義","コース"],
    ["見れない","見れなくなりました"], ["見られない","見れなくなりました"], ["表示されない","見つかりません"],
    ["履修登録","履修"], ["登録解除","自己登録を解除"],
    ["メンテ","メンテナンス"], ["使えない時間","メンテナンス"], ["稼働時間","メンテナンス"],
    ["小テスト","safeexambrowser"], ["試験","小テスト"], ["テスト","小テスト"],
    ["掲示板","フォーラム"], ["ディスカッション","フォーラム"], ["投稿","フォーラム"],
    ["動画","動画ファイル"], ["ビデオ","動画ファイル"], ["ムービー","動画ファイル"],
    ["初めて","使ったことがありません"], ["はじめて","使ったことがありません"], ["初期設定","初期設定"],
    ["写真","プロフィール写真"], ["アイコン","プロフィール写真"],
    ["エラー","エラー"], ["フォルダ","zip圧縮"],
    ["休学","休学中"], ["院生","大学院生"], ["ポートフォリオ","学修ポートフォリオ"],
  ];

  const OFFTOPIC_KEYWORDS = [
    "wi-fi","wifi","ワイファイ","無線lan","vpn","eduroam","有線",
    "成績","出欠","出席","シラバス",
    "microsoft","teams","outlook","onedrive","word","excel","powerpoint",
    "box","多要素認証","二段階","mfa","安否確認","プリンタ","印刷","メールアドレスの変更"
  ];

  const STOP_PHRASES = [
    "教えてください","教えて","ください","下さい","お願いします","お願い",
    "でしょうか","ですか","のですが","んですが","したいです","したい",
    "どうすれば","どうやって","どうしたら","について","？","?","！","!","。","、"
  ];

  function normalize(s){
    let t = (s || "").toLowerCase()
      .replace(/[\s\u3000]/g, "")
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    STOP_PHRASES.forEach(p => { t = t.split(p).join(""); });
    return t;
  }
  function expandQuery(nq){
    let expanded = nq;
    SYNONYMS.forEach(([from, to]) => { if(nq.includes(from)) expanded += to; });
    return expanded;
  }
  function bigrams(s){
    const set = new Set();
    for(let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  }
  function scoreFaq(queryBi, faq){
    const qText = normalize(faq.q);
    const aText = normalize(faq.a);
    let score = 0;
    queryBi.forEach(bg => {
      if(qText.includes(bg)) score += 2;
      else if(aText.includes(bg)) score += 1;
    });
    return score;
  }
  function searchFaq(query){
    const nq = expandQuery(normalize(query));
    if(nq.length < 2) return [];
    const qBi = bigrams(nq);
    return FAQ_DATA
      .map(f => ({ faq: f, score: scoreFaq(qBi, f) }))
      .filter(r => r.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  const FAQ_BASE_URL = "https://faq.tus.ac.jp/faq/show/";
  function faqUrl(no){ return FAQ_BASE_URL + no + "?site_domain=student"; }

  const FAQ_DATA = [
    { no: 3963, cat: "LETUS", q: "LETUS接続時に「あなたはShibbolethによりユーザ認証したようですが、Moodleはユーザ属性を受信していません。」と表示され接続出来ません。",
      a: "シークレットウィンドウ（InPrivateウィンドウ、プライベートウィンドウ）でログイン可能かご確認ください。シークレットウィンドウの開き方がわからない場合は、FAQ「ブラウザのシークレットウィンドウの開き方／使い方」を参照してください。" },
    { no: 3798, cat: "LETUS", q: "CLASS、LETUS、Box等で「過去のリクエスト」と表示され、アクセスできません。",
      a: "認証ページで「学生の方はこちら」または「教職員の方はこちら」をダブルクリックした場合などに発生することがあります。再度シングルクリックで操作し直してください。" },
    { no: 3603, cat: "LETUS", q: "休学中の学生が使用できるシステム環境を教えてください。",
      a: "CLASS・LETUSにおいて休学中の利用に制限はありません。その他のシステムも同様に制限はありません。ご利用に当たっては、多要素認証の設定もしくはVPN接続が必要となる場合があります。" },
    { no: 3796, cat: "LETUSの利用について", q: "[学生用]内部進学後、CLASS LETUS Boxにログインできない。",
      a: "ブラウザの「シークレットモード/プライベートモード」で一度ログインを試し、ログインできるか確認してください。ログインできる場合、ブラウザのキャッシュに旧学部データが残っていることが原因の可能性があります。ブラウザのキャッシュクリアをお試しください。" },
    { no: 1160, cat: "LETUSの利用について", q: "LETUSを使ったことがありません。どうすれば良いですか。",
      a: "LETUSのログインページ（https://letus.ed.tus.ac.jp/auth/shibboleth/index.php）からログインしてください。学生利用マニュアルもLETUS上に用意されています。" },
    { no: 3721, cat: "LETUSの利用について", q: "CLASS・LETUS・CENTISシステムの稼働時間について教えてほしい。",
      a: "メンテナンス時間のためCLASSは毎日午前2:00〜4:00、LETUSは毎日午前4:00〜5:30、CENTIS（教職員のみ）は毎日午前3:00〜4:00は利用できません。" },
    { no: 1158, cat: "LETUSの利用について", q: "『不正なログインです』と表示されログインできません。",
      a: "①ユーザ名とパスワードが正しいか確認してください。ユーザ名は本学のメールアドレス（○○@ed.tus.ac.jp）、パスワードはCLASS・LETUS・Microsoft365すべて共通です。パスワードが分からない場合はパスワードのFAQ（No.1393）を参照してください。②それでも解決しない場合はブラウザのキャッシュクリア等をお試しください。" },
    { no: 1566, cat: "LETUSの利用について", q: "読み込み画面から進まず、LETUSにアクセス（ログイン）できないです。",
      a: "ブラウザのキャッシュクリアをお試しください。また別のブラウザ（Google Chrome、Edge、Firefoxなど）で開けるかお試しください。" },
    { no: 3795, cat: "LETUSの利用について", q: "[学生用]東京理科大学の初期設定について。",
      a: "各種ITサービスをご利用いただくには初期設定が必要です。「東京理科大学 ITサービスのご案内」内の「1. 初期設定」を参照してください。進行状況を確認できる「ITサービス初期設定チェックリスト」もあわせてご活用ください。" },
    { no: 1165, cat: "LETUSの利用について", q: "LETUSの応用的なマニュアルはありますか。",
      a: "LETUSの元となっているMoodleは世界各国で利用されているLMSであり、Moodle.orgによりドキュメントが公開されていますので、そちらをご参照ください。検索エンジンで調べることで解決することもあります。" },
    { no: 1168, cat: "LETUSの利用について", q: "Webarchiveファイルなのですが開くことができません。",
      a: "WebarchiveファイルはSafariで開くことができるファイルです。Safariで該当ファイルを長押しして「リンク先のファイルをダウンロード」を選択し、ダウンロードした後にファイルを開いてください。環境がない場合は担当教員にお問い合わせください。" },
    { no: 1166, cat: "LETUSの利用について", q: "動画ファイルを見ていたら、途中で切れて最後の部分が見られません。",
      a: "ページをリロードしていただくか、動画をダウンロードしてみてください。" },
    { no: 1157, cat: "LETUSの利用について", q: "学修ポートフォリオに入れません。権限がないと拒否されます。",
      a: "学修ポートフォリオを利用できるのは学部生のみです。大学院生や科目等履修生等は利用できません。" },
    { no: 1167, cat: "LETUSの利用について", q: "資料掲載場所へのリンクをクリックした際に「現在、学生はこのコースを利用できません。」と表示され確認できません。",
      a: "資料が公開されていない可能性があります。担当教員にお問い合わせください。担当教員の連絡先がわからない場合は学部事務課までご連絡ください。" },
    { no: 1164, cat: "LETUSの利用について", q: "学部生のときのLETUSを閲覧したいのですが。",
      a: "旧学籍番号での閲覧は年度内（3月第3週末ごろ）までとなります。それ以降は閲覧できませんのでご了承ください。" },
    { no: 2334, cat: "LETUSの利用について", q: "履修登録期間終了後、これまでアクセス出来ていたLETUSのコースにアクセスできなくなりました。",
      a: "自己登録の無効化によるものである可能性があります。担当教員にご相談ください。" },
    { no: 1174, cat: "LETUSの利用について", q: "LETUSのプロフィール写真を変更することは可能ですか。",
      a: "LETUSのプロフィール欄は編集できません。" },
    { no: 1159, cat: "LETUSの利用について", q: "LETUSの「チャット」への参加方法を教えて下さい。",
      a: "コース上にチャットルーム（吹き出しのマーク）が開設されたら、クリックして「入室」するとチャットに参加ができます。" },
    { no: 1175, cat: "コース登録", q: "LETUSで自己登録を解除したいのですが、どうすればできますか。",
      a: "LETUS上の手順ページに従って、ご自身で解除することが可能です。それでも解除できない場合は、該当のコース番号およびコース名を記入の上、お問い合わせフォームよりご連絡ください。" },
    { no: 1565, cat: "コース登録", q: "LETUSで自己登録していたコースが見れなくなりました。",
      a: "履修登録期間が終わると自己登録機能が無効化され、CLASSで履修登録したコース以外は見れなくなります。無効化の日程は事前にCLASSのお知らせに掲載されます。特別な理由によりコースを見れるようにしたい場合は、担当の教員に依頼してください。" },
    { no: 1162, cat: "コース登録", q: "LETUSで目的の授業のコースが「複数学科・研究科」のカテゴリに入っていますがなぜですか。",
      a: "その授業の受講対象者に他学科履修者が認められている場合、コースはこのカテゴリに含まれます。" },
    { no: 1161, cat: "コース登録", q: "履修登録をしたのに授業のコースがLETUSのマイコースおよび検索で見つかりません。",
      a: "履修登録翌日より当該コースを利用できますが、初期値は非表示となっており、担当教員が公開処理をする必要があります。担当教員にお問い合わせください。連絡先がわからない場合は学部事務課までご連絡ください。" },
    { no: 1163, cat: "コース登録", q: "履修を取り消しているのにLETUSのマイコースに残っています。",
      a: "履修申告取り消しの翌日に反映されます。それ以降も登録が残っている場合は、お問い合わせフォームより該当のコース番号およびコース名を記載の上、ご連絡ください。" },
    { no: 1169, cat: "課題（レポート提出）", q: "LETUSで課題の提出方法がわかりません。",
      a: "LETUS学生利用マニュアルのP15-18をご参照ください。マニュアルはLETUS上に掲載されています。" },
    { no: 1170, cat: "課題（レポート提出）", q: "LETUSで課題が提出されたことを確認したいのです。",
      a: "該当の課題をクリックして「提出ステータス」をご確認ください。LETUS学生利用マニュアルのP16および18もご参照ください。" },
    { no: 1173, cat: "課題（レポート提出）", q: "ファイルをアップロードしようとすると「ファイルが空またはフォルダです。フォルダをアップロードするには最初にZIP圧縮してください。」というエラーがでます。",
      a: "フォルダではなくファイル単体でアップロードしてください。またOneDriveなどのクラウドサービスから直接LETUSにはアップロードができません。一度ローカルに保存してからアップロードしてください。それでも解決しない場合は、ブラウザを変える（EdgeをChromeにするなど）ことで解決する場合もあります。" },
    { no: 1171, cat: "課題（レポート提出）", q: "LETUSで提出した課題の削除ができません。",
      a: "LETUSで提出課題の削除をした後、提出課題が無しの状態で確定することはできません。差し替えする新しいファイルをアップロードしてください。" },
    { no: 1172, cat: "課題（レポート提出）", q: "LETUSで課題を提出しようとすると、エラーが出て提出できません。",
      a: "提出できるのはファイルに限りますので、フォルダのままアップロードすることはできません。個別にファイルをアップロードいただくか、ZIP形式等に変換してアップロードしてください。また課題によっては提出できるファイル形式に制限があります。担当教員にお問い合わせください。" },
    { no: 2241, cat: "フォーラム", q: "LETUSでの操作時、「あなたにはこのフォーラムを閲覧するパーミッションがありません。」というエラーが出る。",
      a: "以下の順にお試しください。①LETUSから一度ログアウトし、再度ログインする。②ブラウザのキャッシュクリア。③他のブラウザ（Google Chrome等）で試す。" },
    { no: 1176, cat: "フォーラム", q: "LETUSの質問フォーラムでディスカッショントピックを追加しました。投稿した内容は削除できますか。",
      a: "投稿されたディスカッショントピックの詳細の右下の方に削除ボタンがあれば、そこから削除することが可能です。すでに返信がある場合には削除はできません。" },
    { no: 3437, cat: "小テスト", q: "SafeExamBrowserとはなんですか。",
      a: "小テスト受験専用のブラウザで、テスト終了までは試験受験以外の操作を制限することにより、主に不正を防止する目的があります。SafeExamBrowserを使用して受験するよう指示があった場合は、LETUS学生利用マニュアルの「小テストを受験しよう（Safe Exam Browserが必要な場合）」を参照して受験してください。" },
  ];

  // ---- LETUSページ案内データ ----
  const PORTAL_URL = "https://letus.ed.tus.ac.jp";

  const NAVI_DATA = [
    { title: "■語学検定試験による単位授与について【学部のみ】",
      keywords: ["語学検定","toeic","トーイック","toefl","トーフル","英検","ielts","単位授与","単位認定","スコア提出","語学の単位"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "語学検定試験等のスコア・級に応じて外国語科目の単位を授与する制度の案内です。申請には①単位認定申請書、②公式合格証明書または公式スコアレポート、③学生証の画像データ、の3点が必要です。詳細・期間は必ずページ本文でご確認ください。",
      url: PORTAL_URL + "/course/section.php?id=1857579" },
    { title: "■履修申告関係【学部・大学院】",
      keywords: ["履修申告","履修登録の案内","履修変更","履修取消の手続き"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "履修申告の期間・方法・変更手続きに関する案内が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857577" },
    { title: "■授業時間割表【学部・大学院】",
      keywords: ["時間割","じかんわり"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "学部・大学院の授業時間割表が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857576" },
    { title: "■到達度評価（期末試験）関係【学部・大学院】",
      keywords: ["到達度評価","期末試験","期末テスト","追試","試験日程"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "期末試験（到達度評価）の日程・注意事項などが掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857578" },
    { title: "新学期行事日程について（在校生）",
      keywords: ["行事日程","学年暦","進級","卒業発表","始業"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "年度末〜新年度の行事日程が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1878573" },
    { title: "■休学/復学/退学等【学部・大学院】",
      keywords: ["休学の手続き","復学","退学","休学したい"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "休学・復学・退学等の手続きに関する案内が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857582" },
    { title: "■入学前に修得した単位の認定について【学部新入生のみ】",
      keywords: ["入学前","既修得単位","単位の認定"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "入学前に修得した単位の認定手続きに関する案内が掲載されています（学部新入生対象）。",
      url: PORTAL_URL + "/course/section.php?id=1857580" },
    { title: "■学修簿・大学院要覧・履修の手引【学部・大学院】",
      keywords: ["学修簿","要覧","履修の手引"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "学修簿・大学院要覧・履修の手引が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857575" },
    { title: "■ＩＴサービスに関するお問い合わせ【学部・大学院】",
      keywords: ["お問い合わせ","問い合わせ先","itサービスの連絡"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "ITサービスに関するお問い合わせ窓口の案内が掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857573" },
    { title: "■授業に関するお知らせ【学部・大学院】",
      keywords: ["休講","補講","授業のお知らせ"],
      location: "マイコース → 特別コース → 工学部・工学研究科ポータル",
      desc: "休講・補講など授業に関するお知らせが掲載されています。",
      url: PORTAL_URL + "/course/section.php?id=1857574" },
  ];

  function searchNavi(query){
    const nq = expandQuery(normalize(query));
    if(nq.length < 2) return [];
    return NAVI_DATA
      .map(n => {
        let score = 0;
        n.keywords.forEach(k => { if(nq.includes(normalize(k))) score += 10; });
        return { navi: n, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }

  function sendMessage(){
    const text = input.value.trim();
    if(!text) return;
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    showTyping();

    setTimeout(() => {
      hideTyping();
      const nq = normalize(text);

      const naviHits = searchNavi(text);
      if(naviHits.length > 0){
        const n = naviHits[0].navi;
        const msg = "「" + n.title + "」のご案内ですね。\n\n"
          + "📍 掲載場所：LETUS → " + n.location + "\n\n"
          + n.desc;
        const sources = [{ no: null, q: "🔗 " + n.title + " のページを開く", url: n.url }];
        if(naviHits.length > 1){
          sources.push({ no: null, q: "🔗 " + naviHits[1].navi.title + " のページを開く", url: naviHits[1].navi.url });
        }
        const relFaq = searchFaq(text);
        if(relFaq.length > 0){
          sources.push({ no: relFaq[0].faq.no, q: relFaq[0].faq.q, url: faqUrl(relFaq[0].faq.no) });
        }
        addBotMessageWithSource(msg, sources);
        sendBtn.disabled = false;
        return;
      }

      const isOfftopic = OFFTOPIC_KEYWORDS.some(k => nq.includes(k)) && !nq.includes("letus") && !nq.includes("レタス");
      if(isOfftopic){
        addBotMessageWithSource(
          '申し訳ありません。このチャットボットはLETUSに関するご質問専用です。Wi-Fi・CLASS・Microsoft365などその他のITサービスについては、大学公式のITサービスFAQサイト（faq.tus.ac.jp）をご覧ください。',
          [{ no: null, q: '東京理科大学 ITサービスFAQ（全カテゴリ）', url: 'https://faq.tus.ac.jp/?site_domain=student' }]
        );
        sendBtn.disabled = false;
        return;
      }

      const results = searchFaq(text);

      if(results.length === 0){
        addBotMessageWithSource(
          'ご質問に該当するLETUSのFAQが見つかりませんでした。表現を変えて再度お試しいただくか、LETUSカテゴリのFAQ一覧をご確認ください。解決しない場合は情報システム課のお問い合わせフォームをご利用ください。',
          [{ no: null, q: 'LETUSのFAQ一覧を見る', url: 'https://faq.tus.ac.jp/category/show/50?site_domain=student' }]
        );
      } else {
        const top = results[0].faq;
        const sources = results.map(r => ({
          no: r.faq.no, q: r.faq.q, url: faqUrl(r.faq.no)
        }));
        addBotMessageWithSource(top.a, sources);
      }
      sendBtn.disabled = false;
    }, 450);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if(e.key === 'Enter') sendMessage(); });
  // ============================================================
  //  4. 直近イベント連携 
  // ============================================================
  (function initDeadlineNoticeV2(){

    const LOOKAHEAD_DAYS = 14;
    const MAX_ITEMS = 5;

    const evStyle = document.createElement('style');
    evStyle.textContent = `
.tus-ev-alert{
  background: var(--gold-soft); border: 1px solid #E3D2A0; border-radius: 8px;
  padding: 8px 10px; font-size: 12.5px; line-height: 1.6; margin-bottom: 8px;
}
.tus-ev-head{
  display:flex; align-items:center; gap:6px;
  font-weight:700; font-size:12.5px; margin: 8px 0 2px;
}
.tus-ev-item{
  border: 1px solid var(--line); border-radius: 8px; background: #FFFFFF;
  padding: 7px 9px; margin-top: 6px;
}
.tus-ev-course{ font-size: 10.5px; color: #8A93A0; margin-bottom: 1px; }
.tus-ev-title{ font-size: 12.5px; font-weight: 600; }
.tus-ev-title a{ color: var(--navy); text-decoration: none; }
.tus-ev-title a:hover{ text-decoration: underline; }
.tus-ev-date{ font-size: 10.5px; color: #6B7684; margin-top: 2px; }
.tus-ev-badge{
  float: right; margin-left: 8px; font-size: 10.5px; padding: 2px 8px;
  border-radius: 10px; background: var(--gold-soft);
  border: 1px solid #E3D2A0; color: #7A5B14; white-space: nowrap;
}
.tus-ev-badge.urgent{ background:#FBE4E4; border-color:#E7B3B1; color:#B4231F; }
`;
    document.head.appendChild(evStyle);

    // ============================================================
    //  A. カレンダーAPI
    // ============================================================
    function getSesskey(){
      try{
        if(window.M && window.M.cfg && window.M.cfg.sesskey) return window.M.cfg.sesskey;
      }catch(e){ /* noop */ }
      const m = document.body.innerHTML.match(/sesskey=([A-Za-z0-9]{8,})/);
      return m ? m[1] : null;
    }

    async function fetchActionEvents(){
      const sesskey = getSesskey();
      if(!sesskey) throw new Error('sesskeyが取得できませんでした');
      const now = new Date();
      const startOfToday = Math.floor(
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000
      );
      const res = await fetch(
        '/lib/ajax/service.php?sesskey=' + encodeURIComponent(sesskey)
        + '&info=core_calendar_get_action_events_by_timesort',
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{
            index: 0,
            methodname: 'core_calendar_get_action_events_by_timesort',
            args: { limitnum: 26, timesortfrom: startOfToday }
          }])
        }
      );
      const json = await res.json();
      if(!json || !json[0] || json[0].error){
        throw new Error('APIエラー');
      }
      return json[0].data.events || [];
    }

    function daysLeftFromDate(d){
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return Math.round((target - today) / 86400000);
    }

    function mapApiEvents(raw){
      return raw
        .filter(e => !e.action || e.action.actionable !== false)
        .map(e => {
          const date = new Date(e.timesort * 1000);
          const isTest = e.modulename === 'quiz' || /小テスト|テスト|試験|クイズ/.test(e.name || '');
          return {
            title: (e.activityname || e.name || '').trim(),
            course: e.course ? (e.course.fullname || '') : '',
            url: e.url || '#',
            date: date,
            dl: daysLeftFromDate(date),
            time: ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2),
            isTest: isTest
          };
        })
        .filter(e => e.dl >= 0 && e.dl <= LOOKAHEAD_DAYS)
        .sort((a, b) => a.date - b.date);
    }

    // ============================================================
    //  B. 「直近イベント」ブロック読み取り
    // ============================================================
    function parseEventDate(text){
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if(text.includes('今日')) return today;
      if(text.includes('明日')){
        const d = new Date(today); d.setDate(d.getDate() + 1); return d;
      }
      let m = text.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
      if(m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = text.match(/(\d{1,2})月\s*(\d{1,2})日/);
      if(m) return new Date(now.getFullYear(), +m[1] - 1, +m[2]);
      return null;
    }

    function scrapeBlockEvents(){
      let block = null;
      const candidates = document.querySelectorAll('.block, section.block, aside section, aside div');
      for(const b of candidates){
        const h = b.querySelector('h1,h2,h3,h4,h5,h6,.card-title');
        const headText = h ? h.textContent : '';
        if(headText.includes('直近イベント') || headText.includes('Upcoming events')){
          block = b; break;
        }
      }
      if(!block) return [];
      let nodes = block.querySelectorAll('.event');
      if(nodes.length === 0){
        nodes = block.querySelectorAll('a[href*="view.php"], a[href*="calendar"]');
      }
      const events = [];
      nodes.forEach(node => {
        const a = node.matches && node.matches('a') ? node : node.querySelector('a');
        if(!a) return;
        const title = a.textContent.trim().replace(/\s+/g, ' ');
        if(!title || title.includes('カレンダーへ移動')) return;
        const scope = node.matches && node.matches('a')
          ? (node.closest('.event, li, div') || node) : node;
        const text = scope.textContent || '';
        const date = parseEventDate(text);
        if(!date) return;
        const dl = daysLeftFromDate(date);
        if(dl < 0 || dl > LOOKAHEAD_DAYS) return;
        const timeM = text.match(/(\d{1,2}:\d{2})/);
        events.push({
          title: title, course: '', url: a.href, date: date, dl: dl,
          time: timeM ? timeM[1] : '',
          isTest: /小テスト|テスト|試験|クイズ/i.test(title)
        });
      });
      const seen = new Set();
      return events
        .filter(e => {
          const key = e.title + '|' + e.date.getTime();
          if(seen.has(key)) return false;
          seen.add(key); return true;
        })
        .sort((a, b) => a.dl - b.dl);
    }

    // ============================================================
    //  C. 描画
    // ============================================================
    function dlLabel(e){
      if(e.dl === 0) return '今日締め切り';
      if(e.dl === 1) return '明日締め切り';
      return 'あと' + e.dl + '日';
    }
    function fmtDate(e){
      return '締切: ' + (e.date.getMonth() + 1) + '月' + e.date.getDate() + '日'
        + (e.time ? '（' + e.time + '）' : '');
    }

    function buildItem(e){
      const item = document.createElement('div');
      item.className = 'tus-ev-item';

      const badge = document.createElement('span');
      badge.className = 'tus-ev-badge' + (e.dl <= 1 ? ' urgent' : '');
      badge.innerText = dlLabel(e);
      item.appendChild(badge);

      if(e.course){
        const c = document.createElement('div');
        c.className = 'tus-ev-course';
        c.innerText = e.course;
        item.appendChild(c);
      }

      const t = document.createElement('div');
      t.className = 'tus-ev-title';
      const a = document.createElement('a');
      a.href = e.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.innerText = e.title;
      t.appendChild(a);
      item.appendChild(t);

      const d = document.createElement('div');
      d.className = 'tus-ev-date';
      d.innerText = fmtDate(e);
      item.appendChild(d);
      return item;
    }

    function renderCard(events, viaApi){
      const div = document.createElement('div');
      div.className = 'tus-msg bot';

      if(events.length === 0){
        div.innerText = viaApi
          ? '直近' + LOOKAHEAD_DAYS + '日以内に、提出が必要な課題や受験前のテストはありません。'
          : 'このページでは締切情報を取得できませんでした。LETUSのトップページまたはダッシュボードでお試しください。';
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        return;
      }

      const urgent = events.find(e => e.dl <= 1 && !e.isTest);
      if(urgent){
        const alert = document.createElement('div');
        alert.className = 'tus-ev-alert';
        alert.innerText = '⚠️ 「' + urgent.title + '」が' + (urgent.dl === 0 ? '今日' : '明日')
          + '締め切りです。忘れずに提出しましょう。';
        div.appendChild(alert);
      }

      const assignments = events.filter(e => !e.isTest).slice(0, MAX_ITEMS);
      const tests = events.filter(e => e.isTest).slice(0, MAX_ITEMS);

      if(assignments.length){
        const h = document.createElement('div');
        h.className = 'tus-ev-head';
        h.innerText = '📝 提出が近い課題';
        div.appendChild(h);
        assignments.forEach(e => div.appendChild(buildItem(e)));
      }
      if(tests.length){
        const h = document.createElement('div');
        h.className = 'tus-ev-head';
        h.innerText = '🧪 近づいているテスト';
        div.appendChild(h);
        tests.forEach(e => div.appendChild(buildItem(e)));
      }

      const note = document.createElement('div');
      note.className = 'src';
      note.innerText = viaApi
        ? '※ 提出済みの課題・受験済みのテストは表示されません。直近' + LOOKAHEAD_DAYS + '日以内のみ表示しています。'
        : '※ ページ内の「直近イベント」から取得した情報のため、提出済みの課題も含まれる場合があります。';
      div.appendChild(note);

      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    async function loadAndRender(){
      try{
        const events = mapApiEvents(await fetchActionEvents());
        renderCard(events, true);
        return events;
      }catch(err){
        const events = scrapeBlockEvents();
        renderCard(events, false);
        return events;
      }
    }

    // ---- 起動時: カード自動表示＋吹き出し文言の差し込み ----
    setTimeout(async () => {
      const events = await loadAndRender();
      const urgent = events.find(e => e.dl <= 1);
      if(urgent){
        BUBBLE_MESSAGES.unshift(
          '「' + urgent.title.slice(0, 20) + '」が'
          + (urgent.dl === 0 ? '今日' : '明日') + '締め切りです'
        );
      }
    }, 400);

    // ---- 「締切を確認」チップを追加 ----
    const evChip = document.createElement('span');
    evChip.className = 'tus-chip';
    evChip.textContent = '📅 直近の締切を確認';
    evChip.onclick = () => {
      addMessage('直近の締切を教えて', 'user');
      setTimeout(loadAndRender, 350);
    };
    chipsWrap.appendChild(evChip);

  })();
})();
