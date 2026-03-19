// Chatwork 一括既読 v2.0 - 公式APIベース
const API_BASE = 'https://api.chatwork.com/v2';

const $ = id => document.getElementById(id);

// ─── ユーティリティ ───────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setUnread(count) {
  const el = $('unreadNum'), sub = $('counterSub');
  if (count === null) {
    el.textContent = '—'; el.className = 'counter-num';
    sub.textContent = 'APIトークンを設定してください';
  } else if (count === 0) {
    el.textContent = '0'; el.className = 'counter-num zero';
    sub.textContent = '未読メッセージはありません';
  } else {
    el.textContent = count; el.className = 'counter-num';
    sub.textContent = '件の未読があります';
  }
}

function showProgress(pct, text) {
  $('progressSection').classList.add('show');
  $('progressBar').style.width = pct + '%';
  $('progressText').textContent = text;
  $('progressPct').textContent = Math.round(pct) + '%';
}

function hideProgress() { $('progressSection').classList.remove('show'); }

function showToast(type, msg) {
  const t = $('toast');
  t.className = 'toast show ' + type;
  $('toastIcon').textContent = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  $('toastMsg').textContent = msg;
  setTimeout(() => t.classList.remove('show'), 7000);
}

function setLoading(on) {
  $('mainBtn').disabled = on;
  $('mainBtn').className = 'btn-main' + (on ? ' running' : '');
  $('btnLabel').textContent = on ? '処理中...' : 'すべて既読にする';
}

// ─── Chatwork API ─────────────────────────────────────────────────
async function apiGet(path, token) {
  const res = await fetch(API_BASE + path, {
    headers: { 'x-chatworktoken': token }
  });
  if (!res.ok) throw new Error('API Error ' + res.status);
  return res.json();
}

async function apiPut(path, token, body = '') {
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: {
      'x-chatworktoken': token,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body
  });
  // 204 No Content も成功扱い
  if (!res.ok && res.status !== 204) throw new Error('API Error ' + res.status);
  return res.status === 204 ? {} : res.json().catch(() => ({}));
}

// ─── トークン管理 ─────────────────────────────────────────────────
async function loadToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('cwApiToken', d => resolve(d.cwApiToken || ''));
  });
}

async function saveToken(token) {
  return new Promise(resolve => {
    chrome.storage.local.set({ cwApiToken: token }, resolve);
  });
}

// ─── 初期化 ──────────────────────────────────────────────────────
async function init() {
  const token = await loadToken();
  if (token) {
    $('tokenInput').value = token;
    $('tokenDot').className = 'dot ok';
    $('mainBtn').disabled = false;
    await fetchUnreadCount(token);
  }
}

async function fetchUnreadCount(token) {
  try {
    const rooms = await apiGet('/rooms', token);
    const total = rooms.reduce((sum, r) => sum + (r.unread_num || 0), 0);
    setUnread(total);
  } catch(e) {
    setUnread(null);
    showToast('error', 'APIトークンが無効です');
    $('tokenDot').className = 'dot';
    $('mainBtn').disabled = true;
  }
}

// ─── 保存ボタン ───────────────────────────────────────────────────
$('saveBtn').addEventListener('click', async () => {
  const token = $('tokenInput').value.trim();
  if (!token) return showToast('error', 'トークンを入力してください');
  await saveToken(token);
  $('tokenDot').className = 'dot ok';
  $('mainBtn').disabled = false;
  showToast('info', 'トークンを保存しました');
  await fetchUnreadCount(token);
});

// ─── 一括既読ボタン ───────────────────────────────────────────────
$('mainBtn').addEventListener('click', async () => {
  const token = await loadToken();
  if (!token) return showToast('error', 'APIトークンを設定してください');

  setLoading(true);
  $('toast').classList.remove('show');
  showProgress(5, 'ルーム一覧を取得中...');

  try {
    // 1. 全ルーム取得
    const rooms = await apiGet('/rooms', token);
    const unreadRooms = rooms.filter(r => r.unread_num > 0);

    if (unreadRooms.length === 0) {
      hideProgress();
      setLoading(false);
      setUnread(0);
      showToast('info', '未読メッセージはありませんでした');
      return;
    }

    showProgress(10, unreadRooms.length + '件のルームを処理中...');

    // 2. 未読ルームを順番に既読API呼び出し
    let done = 0, errors = 0;
    for (const room of unreadRooms) {
      try {
        await apiPut('/rooms/' + room.room_id + '/messages/read', token);
        done++;
      } catch(e) {
        console.warn('Room', room.room_id, 'failed:', e.message);
        errors++;
      }
      // プログレス更新
      const pct = 10 + (done + errors) / unreadRooms.length * 88;
      showProgress(pct, done + '/' + unreadRooms.length + ' 処理中...');

      // APIレート制限対策（1秒に5回まで）
      await sleep(210);
    }

    showProgress(100, '完了！');
    setTimeout(() => {
      hideProgress();
      setLoading(false);
      setUnread(errors > 0 ? errors : 0);
      if (errors === 0) {
        showToast('success', done + '件のルームを既読にしました ✓');
      } else {
        showToast('info', done + '件成功、' + errors + '件失敗');
      }
    }, 600);

  } catch(e) {
    hideProgress();
    setLoading(false);
    showToast('error', 'エラー: ' + e.message);
  }
});

init();
