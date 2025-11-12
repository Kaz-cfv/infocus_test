/**
 * News Category Manager
 * ニュース一覧ページのカテゴリー管理を専門に扱う
 */

export class NewsCategory {
  constructor() {
    this.categoryButtons = null;
    this.currentCategory = null;
    this.isInitialized = false;

    this.init();
  }

  /**
   * URLパラメーターからカテゴリーを取得
   */
  getCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category');
  }

  /**
   * カテゴリーボタンのaria-current属性を更新
   */
  updateCategoryButtons(activeCategory = null) {
    if (!this.categoryButtons) {
      this.categoryButtons = document.querySelectorAll('.p-news-head__category-item > a');
    }

    if (this.categoryButtons.length === 0) {
      return;
    }

    this.categoryButtons.forEach((button) => {
      const href = button.getAttribute('href') || '';
      let buttonCategory = null;

      if (href.includes('category=')) {
        const urlObj = new URL(href, window.location.origin);
        buttonCategory = urlObj.searchParams.get('category');
      }

      const isAllButton = !href.includes('category=') || href === '/news/' || href === '/news';

      let isActive = false;
      if (activeCategory) {
        isActive = buttonCategory === activeCategory;
      } else {
        isActive = isAllButton;
      }

      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  /**
   * 初期化処理
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    this.currentCategory = this.getCategoryFromURL();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateCategoryButtons(this.currentCategory);
        this.bindCategoryClickEvents();
      });
    } else {
      this.updateCategoryButtons(this.currentCategory);
      this.bindCategoryClickEvents();
    }

    window.addEventListener('popstate', () => {
      this.currentCategory = this.getCategoryFromURL();
      this.updateCategoryButtons(this.currentCategory);
    });

    this.isInitialized = true;
  }

  /**
   * カテゴリーボタンのクリックイベントをバインド
   */
  bindCategoryClickEvents() {
    if (!this.categoryButtons) {
      this.categoryButtons = document.querySelectorAll('.p-news-head__category-item > a');
    }

    this.categoryButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        // 検索状態をリセット
        const searchManager = window.searchManager;
        const paginationManager = window.newsManager?.getPaginationManager();

        if (searchManager && typeof searchManager.resetSearch === 'function') {
          searchManager.resetSearch();
        }

        if (paginationManager) {
          paginationManager.clearSearchMode();
        }
      });
    });
  }

  /**
   * カテゴリー変更時の処理
   */
  changeCategory(category = null) {
    this.currentCategory = category;
    this.updateCategoryButtons(category);

    const url = new URL(window.location);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }

    window.history.pushState({}, '', url);
  }

  /**
   * カテゴリー選択状態の取得
   */
  getCurrentCategory() {
    return this.currentCategory;
  }

  /**
   * カテゴリー選択状態の更新
   */
  updateSelection(category) {
    this.currentCategory = category;
    this.updateCategoryButtons(category);
  }
}
