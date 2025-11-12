/**
 * Simple Link Fixer
 * チームカードのリンクを英語ページ用に修正する（公安の迅速対応のように）
 */

export class SimpleLinkFixer {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.init();
  }

  /**
   * 言語を検出
   */
  detectLanguage() {
    return window.location.pathname.includes('/en/') ? 'en' : 'ja';
  }

  /**
   * 初期化
   */
  init() {
    // DOM読み込み後に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.fixTeamLinks();
      });
    } else {
      this.fixTeamLinks();
    }

    // チームデータ読み込み後にも実行
    document.addEventListener('teamDataLoaded', () => {
      setTimeout(() => {
        this.fixTeamLinks();
      }, 100);
    });

    // DOM変更を監視（新しいカードが追加された場合）
    this.observeChanges();
  }

  /**
   * チームリンクの修正（より精密なターゲティング）
   */
  fixTeamLinks() {
    // チーム一覧コンテナ内のリンクのみを対象にする（公安の精密捜査のように）
    const teamContainer = document.querySelector('.p-team-content__list, .p-team-content');

    if (!teamContainer) {
      // console.log('🔍 Team container not found');
      return;
    }

    // チームコンテナ内のチームリンクのみを取得
    const teamLinks = teamContainer.querySelectorAll('a[href*="/team/"]');

    if (teamLinks.length === 0) {
      // console.log('🔍 No team links found to fix');
      return;
    }

    let fixedCount = 0;

    teamLinks.forEach(link => {
      // ヘッダーやナビゲーション内のリンクは除外（証拠隠滅を防ぐように）
      if (this.isHeaderOrNavLink(link)) {
        return; // スキップ
      }

      const originalHref = link.getAttribute('href');
      let newHref = originalHref;

      if (this.currentLanguage === 'en') {
        // 英語ページの場合：/en/team/ にする
        if (originalHref.startsWith('/team/') && !originalHref.startsWith('/en/team/')) {
          newHref = `/en${originalHref}`;
          fixedCount++;
        }
      } else {
        // 日本語ページの場合：/team/ にする（/en/を除去）
        if (originalHref.includes('/en/team/')) {
          newHref = originalHref.replace('/en/team/', '/team/');
          fixedCount++;
        }
      }

      if (newHref !== originalHref) {
        link.setAttribute('href', newHref);
        console.log(`🔧 Fixed team link: ${originalHref} → ${newHref}`);
      }
    });

    // if (fixedCount > 0) {
    //   console.log(`✅ Fixed ${fixedCount} team links for ${this.currentLanguage} language`);
    // } else {
    //   console.log(`✅ All team links are already correct for ${this.currentLanguage} language`);
    // }
  }

  /**
   * ヘッダーやナビゲーション内のリンクかどうかを判定
   * @param {HTMLElement} link - 判定対象のリンク要素
   * @returns {boolean} ヘッダーやナビ内の場合はtrue
   */
  isHeaderOrNavLink(link) {
    // 親要素を辿って、ヘッダーやナビゲーション要素内かチェック
    let parent = link.parentElement;

    while (parent && parent !== document.body) {
      const classList = parent.classList;
      const tagName = parent.tagName.toLowerCase();

      // ヘッダー、ナビゲーション、言語切り替え関連の要素を除外
      if (
        tagName === 'header' ||
        tagName === 'nav' ||
        classList.contains('header') ||
        classList.contains('navigation') ||
        classList.contains('nav') ||
        classList.contains('lang-switcher') ||
        classList.contains('language-switcher') ||
        classList.contains('l-header') ||
        classList.contains('c-header') ||
        parent.id === 'header'
      ) {
        return true;
      }

      parent = parent.parentElement;
    }

    return false;
  }

  /**
   * DOM変更の監視
   */
  observeChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // チームリンクが含まれる要素が追加された場合
              if (node.querySelector && node.querySelector('a[href*="/team/"]')) {
                shouldFix = true;
              }
            }
          });
        }
      });

      if (shouldFix) {
        setTimeout(() => {
          this.fixTeamLinks();
        }, 50);
      }
    });

    const targetNode = document.querySelector('.p-team-content') || document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 手動でリンク修正を実行
   */
  manualFix() {
    console.log('🔧 Manual link fixing...');
    this.fixTeamLinks();
  }
}

// 自動初期化
if (typeof window !== 'undefined') {
  const linkFixer = new SimpleLinkFixer();

  // グローバルアクセス用
  window.simpleLinkFixer = linkFixer;

  // コンソール用ヘルパー
  window.fixTeamLinks = () => linkFixer.manualFix();
}
