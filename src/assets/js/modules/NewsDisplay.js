/**
 * News Display Manager
 * ニュース一覧の表示制御を専門に扱う
 * URLパラメーターに基づいてピックアップの表示/非表示、リストの切り替えを管理
 */

export class NewsDisplay {
  constructor() {
    this.pickupSection = null;
    this.regularItems = null;
    this.allItems = null;
    this.isInitialized = false;

    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // DOM要素の取得を遅延実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initDOMElements();
        this.handleDisplayMode();
      });
    } else {
      this.initDOMElements();
      this.handleDisplayMode();
    }

    // URL変更時の処理（ブラウザの戻る/進むボタン対応）
    window.addEventListener('popstate', () => {
      this.handleDisplayMode();
    });

    this.isInitialized = true;
  }

  /**
   * DOM要素を取得
   */
  initDOMElements() {
    this.pickupSection = document.querySelector('[data-pickup-section]');
    this.regularItems = document.querySelectorAll('[data-news-item="regular"]');
    this.allItems = document.querySelectorAll('[data-news-item="all"]');
  }

  /**
   * URLパラメーターからカテゴリーを取得
   */
  getCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category');
  }

  /**
   * 表示モードの判定と制御
   */
  handleDisplayMode() {
    const categoryParam = this.getCategoryFromURL();
    const isFiltered = !!categoryParam;

    if (isFiltered) {
      this.showFilteredMode(categoryParam);
    } else {
      this.showNormalMode();
    }
  }

  /**
   * 絞り込みモード: ピックアップ非表示 + カテゴリーフィルタリング表示
   */
  showFilteredMode(category) {
    if (this.pickupSection) {
      this.pickupSection.style.display = 'none';
    }

    // 通常リストを非表示
    if (this.regularItems) {
      this.regularItems.forEach(item => {
        item.style.display = 'none';
      });
    }

    // 全件リストからカテゴリーに該当するもののみ表示
    if (this.allItems) {
      this.allItems.forEach(item => {
        const newsCard = item.querySelector('.c-news-card');
        const itemCategory = newsCard?.getAttribute('data-category');

        if (itemCategory === category) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    }

    // フィルタリング結果の件数を計算
    const visibleCount = this.allItems ?
      Array.from(this.allItems).filter(item => {
        const newsCard = item.querySelector('.c-news-card');
        const itemCategory = newsCard?.getAttribute('data-category');
        return itemCategory === category;
      }).length : 0;

    // console.log('🔍 絞り込みモード: カテゴリー =', category, '| 表示件数:', visibleCount);
  }

  /**
   * 通常モード: ピックアップ表示 + 通常リスト表示
   */
  showNormalMode() {
    if (this.pickupSection) {
      this.pickupSection.style.display = '';
    }

    // 通常リストを表示
    if (this.regularItems) {
      this.regularItems.forEach(item => {
        item.style.display = '';
      });
    }

    // 全件リストを非表示
    if (this.allItems) {
      this.allItems.forEach(item => {
        item.style.display = 'none';
      });
    }

    // console.log('🏠 通常モード: ピックアップ + 一覧表示 | 表示件数:', this.regularItems?.length || 0);
  }

  /**
   * カテゴリー変更時の表示更新
   */
  updateDisplayByCategory(category = null) {
    if (category) {
      this.showFilteredMode(category);
    } else {
      this.showNormalMode();
    }
  }

  /**
   * 表示状態のリセット
   */
  resetDisplay() {
    this.showNormalMode();
  }
}
