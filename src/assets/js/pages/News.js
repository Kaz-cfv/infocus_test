/**
 * News Page Manager
 * ニュース一覧ページの機能を統合管理する
 */

import URLUtils from '../modules/URLUtils.js';
import { NewsCategory } from '../modules/NewsCategory.js';
import { NewsDisplay } from '../modules/NewsDisplay.js';
import { NewsAPIManager } from '../modules/NewsAPIManager.js';
import { NewsPaginationManager } from '../modules/NewsPaginationManager.js';

export class News {
  constructor() {
    if (News.instance) {
      return News.instance;
    }
    if (!this.isNewsPage()) {
      return;
    }

    this.categoryManager = new NewsCategory();
    this.displayManager = new NewsDisplay();
    this.apiManager = new NewsAPIManager();
    this.paginationManager = null; // データ取得後に初期化
    this.currentCategory = null;
    this.newsData = [];

    News.instance = this;

    this.init();
  }

  /**
   * ニュースページかどうかを判定
   */
  isNewsPage() {
    const pickupSection = document.querySelector('[data-pickup-section]');
    const newsIndex = document.querySelector('.p-news-content__list-index[data-index="news"]');

    // console.log('🔍 ニュースページ判定:', {
    //   pickupSection: !!pickupSection,
    //   newsIndex: !!newsIndex,
    //   currentPath: window.location?.pathname || 'unknown'
    // });

    // より柔軟な判定に変更
    return !!pickupSection || !!newsIndex;
  }

  /**
   * 初期化処理
   */
  async init() {

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupNewsSystem();
      });
    } else {
      await this.setupNewsSystem();
    }
  }

  /**
   * ニュースシステム全体のセットアップ
   */
  async setupNewsSystem() {
    try {
      // まずは WordPress API からデータを取得
      this.newsData = await this.apiManager.init();

      // ページネーションマネージャーを初期化
      this.paginationManager = new NewsPaginationManager(this.apiManager);

      // URLパラメータから初期ページを設定
      this.paginationManager.initializeFromURL();

      // ページネーション表示を更新
      this.paginationManager.updatePaginationDisplay(this.newsData);

      // データ取得後にフィルタリングシステムを初期化
      this.setupNewsFiltering();

    } catch (error) {
      console.error('❌ ニュースシステム初期化エラー:', error);

      // エラーが発生してもフィルタリングは動作させる
      this.setupNewsFiltering();
    }

    console.groupEnd();
  }

  /**
   * ニュースフィルタリングのセットアップ
   * データ取得後に呼び出される
   */
  setupNewsFiltering() {
    // URLパラメーターの処理
    this.handleURLParameters();

    // カテゴリー変更と表示制御の同期設定
    this.setupCategoryDisplaySync();

    // グローバルにアクセス可能にする（外部連携用）
    this.exposeGlobalInterface();
  }

  /**
   * URLパラメーターの処理
   */
  handleURLParameters() {
    const categoryParam = URLUtils.getURLParameter('category');

    if (categoryParam) {
      this.currentCategory = categoryParam;
    } else {
      this.currentCategory = null;
    }

    // 初期状態を各部隊に通知（初期化時のみ、changeCategory は呼ばない）
    this.categoryManager.updateSelection(this.currentCategory);
    this.displayManager.updateDisplayByCategory(this.currentCategory);
  }

  /**
   * カテゴリー変更と表示制御の同期設定
   * カテゴリー変更時に自動的に表示モードも更新される
   */
  setupCategoryDisplaySync() {
    // カテゴリー変更時に表示も更新
    const originalChangeCategory = this.categoryManager.changeCategory.bind(this.categoryManager);
    this.categoryManager.changeCategory = (category = null) => {
      originalChangeCategory(category);
      this.displayManager.updateDisplayByCategory(category);
      this.currentCategory = category; // 自身の状態も更新
    };
  }

  /**
   * グローバルインターフェースの公開
   * 外部から安全にアクセスできるAPIを提供
   */
  exposeGlobalInterface() {
    // レガシー対応として window.newsManager を維持
    window.newsManager = {
      getCategoryManager: () => this.categoryManager,
      getDisplayManager: () => this.displayManager,
      getAPIManager: () => this.apiManager,
      getPaginationManager: () => this.paginationManager,
      getCurrentState: () => this.getCurrentState(),
      changeCategory: (category) => this.changeCategory(category),
      reset: () => this.reset(),
      refetchNews: () => this.refetchNews(),
      goToPage: (page) => this.paginationManager?.goToPage(page)
    };
  }

  /**
   * 現在の状態を取得
   */
  getCurrentState() {
    return {
      category: this.currentCategory,
      dataCount: this.newsData.length,
      isLoading: this.apiManager?.isLoading || false,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * カテゴリーを変更（外部から呼び出し可能）
   */
  changeCategory(category = null) {
    this.currentCategory = category;
    this.categoryManager.changeCategory(category);
  }

  /**
   * 状態をリセット
   */
  reset() {
    this.currentCategory = null;
    this.categoryManager.updateSelection(null);
    this.displayManager.resetDisplay();
  }

  /**
   * ニュースデータを再取得
   * 外部から呼び出し可能
   */
  async refetchNews() {
    try {
      this.newsData = await this.apiManager.init();

      // フィルタリング状態をリセットして再適用
      this.setupNewsFiltering();
      return this.newsData;

    } catch (error) {
      console.error('❌ ニュースデータ再取得エラー:', error);
      throw error;
    }
  }

  /**
   * 各管理部隊への直接アクセス（デバッグ用）
   */
  getManagers() {
    return {
      category: this.categoryManager,
      display: this.displayManager,
      api: this.apiManager,
      pagination: this.paginationManager
    };
  }
}

// デバッグ用: 即座に実行テスト
document.addEventListener('DOMContentLoaded', () => {
  const testNews = new News();
  // console.log('📋 Newsインスタンス作成結果:', testNews);
});
