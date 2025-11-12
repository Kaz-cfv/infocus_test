/**
 * Team Link Fixer
 * 既存のチームカードのリンクを多言語対応に修正する

 */

export class TeamLinkFixer {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.init();
  }

  /**
   * 現在の言語を検出
   */
  detectLanguage() {
    const currentPath = window.location.pathname;
    return currentPath.includes('/en/') ? 'en' : 'ja';
  }

  /**
   * 初期化処理
   */
  init() {
    // DOM読み込み完了後とカード生成後の両方で実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.fixExistingLinks();
      });
    } else {
      this.fixExistingLinks();
    }

    // チームカード生成完了時にも実行
    document.addEventListener('teamCardsRendered', () => {
      this.fixExistingLinks();
    });

    // teamDataLoadedイベント後にも実行（念のため）
    document.addEventListener('teamDataLoaded', () => {
      // 少し遅延させてDOM更新を待つ
      setTimeout(() => {
        this.fixExistingLinks();
      }, 100);
    });
  }

  /**
   * 既存のチームカードリンクを修正
   */
  fixExistingLinks() {
    const teamCards = document.querySelectorAll('.p-team-content__list-item');

    if (teamCards.length === 0) {
      console.log('🔍 No team cards found yet. Links will be fixed when cards are rendered.');
      return;
    }

    let fixedCount = 0;

    teamCards.forEach(card => {
      const links = card.querySelectorAll('a[href*="/team/"]');

      links.forEach(link => {
        const originalHref = link.getAttribute('href');
        const fixedHref = this.getLocalizedTeamLink(originalHref);

        if (originalHref !== fixedHref) {
          link.setAttribute('href', fixedHref);
          fixedCount++;
          console.log(`🔧 Fixed link: ${originalHref} → ${fixedHref}`);
        }
      });
    });

    if (fixedCount > 0) {
      console.log(`✅ Team links fixed: ${fixedCount} links updated for ${this.currentLanguage} language`);
    } else {
      console.log(`🔍 No team links needed fixing (already correct for ${this.currentLanguage})`);
    }
  }

  /**
   * チームリンクを言語に応じて修正
   * @param {string} originalHref - 元のリンクURL
   * @returns {string} 修正されたリンクURL
   */
  getLocalizedTeamLink(originalHref) {
    if (!originalHref || !originalHref.includes('/team/')) {
      return originalHref;
    }

    // 既に言語プレフィックスが付いている場合は何もしない
    if (this.currentLanguage === 'en' && originalHref.includes('/en/team/')) {
      return originalHref;
    }
    if (this.currentLanguage === 'ja' && !originalHref.includes('/en/')) {
      return originalHref;
    }

    // リンクを分析して修正
    let fixedHref = originalHref;

    if (this.currentLanguage === 'en') {
      // 英語の場合：/en/を追加
      if (fixedHref.startsWith('/team/')) {
        fixedHref = `/en${fixedHref}`;
      } else if (!fixedHref.includes('/en/')) {
        // 絶対URLの場合も考慮
        fixedHref = fixedHref.replace(/\/team\//, '/en/team/');
      }
    } else {
      // 日本語の場合：/en/を除去
      fixedHref = fixedHref.replace(/\/en\/team\//, '/team/');
    }

    return fixedHref;
  }

  /**
   * MutationObserverを使用してDOMの変更を監視
   * カードが動的に追加された場合にも対応
   */
  startDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 新しいノードが追加された場合
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // チームカードまたはチームカードを含む要素が追加された場合
              if (node.classList?.contains('p-team-content__list-item') ||
                  node.querySelector?.('.p-team-content__list-item')) {
                shouldFix = true;
              }
            }
          });
        }
      });

      if (shouldFix) {
        console.log('🔍 DOM changed - checking for new team links to fix');
        setTimeout(() => {
          this.fixExistingLinks();
        }, 50);
      }
    });

    // チーム一覧のコンテナを監視
    const teamContainer = document.querySelector('.p-team-content__list') ||
                         document.querySelector('.p-team-content') ||
                         document.body;

    observer.observe(teamContainer, {
      childList: true,
      subtree: true
    });

    console.log('🔍 DOM observer started - will automatically fix new team links');
    return observer;
  }

  /**
   * 手動でリンク修正を実行（デバッグ用）
   */
  manualFix() {
    console.log('🔧 Manual link fixing started...');
    this.fixExistingLinks();
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    const teamCards = document.querySelectorAll('.p-team-content__list-item');
    const teamLinks = document.querySelectorAll('a[href*="/team/"]');

    return {
      currentLanguage: this.currentLanguage,
      teamCardsCount: teamCards.length,
      teamLinksCount: teamLinks.length,
      links: Array.from(teamLinks).map(link => ({
        text: link.textContent?.trim(),
        href: link.getAttribute('href')
      }))
    };
  }
}

// 自動初期化（公安の24時間体制のように常に待機）
if (typeof window !== 'undefined') {
  const teamLinkFixer = new TeamLinkFixer();

  // グローバルアクセス用
  window.teamLinkFixer = teamLinkFixer;

  // DOMObserverも自動開始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      teamLinkFixer.startDOMObserver();
    });
  } else {
    teamLinkFixer.startDOMObserver();
  }
}
