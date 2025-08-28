/**
 * ViewManager - ページロード時のコンテンツ表示管理
 *
 * ページ遷移後、メインコンテンツに特定の属性を付与することで
 * 表示の制御（フェードインなど）を可能にするための汎用マネージャー
 */
export class ViewManager {
  /**
   * @param {string} mainContentSelector - メインコンテンツ要素のCSSセレクター
   */
  constructor(mainContentSelector = '[data-main-content]') {
    this.mainContentSelector = mainContentSelector;
    this.init();
  }

  /**
   * クラスの初期化
   */
  init() {
    this.mainContent = document.querySelector(this.mainContentSelector);
    if (!this.mainContent) {
      console.warn(`ViewManager: Main content element not found with selector: ${this.mainContentSelector}`);
      return;
    }

    // ページが完全に読み込まれたら属性を付与
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.handlePageLoad());
    } else {
      this.handlePageLoad();
    }
  }

  /**
   * ページロード後の処理を実行
   */
  handlePageLoad() {
    this.setMainContentViewState();
  }

  /**
   * メインコンテンツに表示状態を示す属性を付与
   */
  setMainContentViewState() {
    this.mainContent.setAttribute('data-view', 'true');
  }
}
