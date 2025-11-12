/**
 * Credit Link Manager
 * クレジットテーブル内のリンクを検索可能なリンクに変換
 */

export class CreditLinkManager {
  constructor() {
    this.creditTable = document.querySelector('.p-project-detail__creditTable');
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    if (!this.creditTable) {
      console.log('🔍 CreditLinkManager: クレジットテーブルが見つかりません');
      return;
    }

    this.processCreditLinks();
  }

  /**
   * クレジットテーブル内のリンクを処理
   */
  processCreditLinks() {
    // クレジットテーブル内の全てのリンクを取得
    const creditLinks = this.creditTable.querySelectorAll('a[href="#"]');

    if (creditLinks.length === 0) {
      console.log('🔍 CreditLinkManager: 処理対象のリンクが見つかりません');
      return;
    }

    console.log(`🔗 CreditLinkManager: ${creditLinks.length}件のクレジットリンクを処理します`);

    creditLinks.forEach(link => {
      const creditName = link.textContent.trim();

      if (creditName) {
        // 言語を検出
        const language = this.detectLanguage();

        // プロジェクト一覧ページのURLを構築（検索パラメーター付き）
        const projectsURL = language === 'en'
          ? `/en/projects?search=${encodeURIComponent(creditName)}`
          : `/projects?search=${encodeURIComponent(creditName)}`;

        // リンクのhrefを更新
        link.setAttribute('href', projectsURL);
        link.setAttribute('data-credit-search', creditName);

        console.log(`✅ リンク処理完了: "${creditName}" → ${projectsURL}`);
      }
    });

    console.log('✨ CreditLinkManager: 全てのクレジットリンクの処理が完了しました');
  }

  /**
   * 現在の言語を検出
   */
  detectLanguage() {
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname;
      return currentPath.includes('/en/') ? 'en' : 'ja';
    }
    return 'ja';
  }
}

// デバッグ用: グローバルにCreditLinkManagerを公開
if (typeof window !== 'undefined') {
  window.CreditLinkManager = CreditLinkManager;
}
