/**
 * ブラウザのセッションIDを取得・生成
 * （簡易的な認証なしユーザー管理）
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const SESSION_KEY = 'recipe_app_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * セッションIDをクリア
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('recipe_app_session_id');
}
