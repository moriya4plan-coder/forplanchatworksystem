// content.js - APIトークン取得補助のみ（DOM操作は行わない）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ ok: true });
    return true;
  }
});
