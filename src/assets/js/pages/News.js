/**
 * News Page Manager
 * ニュース一覧ページの機能を統合管理する
 * 各専門モジュールを直接制御する起点クラス
 */

import URLUtils from '../modules/URLUtils.js';
import { NewsCategory } from '../modules/NewsCategory.js';
import { NewsDisplay } from '../modules/NewsDisplay.js';

export class News {
  constructor() {
    if (!this.isNewsPage()) {
      return;
    }

    this.categoryManager = new NewsCategory();
    this.displayManager = new NewsDisplay();
    this.currentCategory = null;

    this.init();
  }

  /**
   * ニュースページかどうかを判定
   */
  isNewsPage() {
    // ニュース一覧のピックアップセクションが存在するかで判定
    return document.querySelector('[data-pickup-section]') !== null;
  }

  /**
   * 初期化処理
   */
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupNewsFiltering();
      });
    } else {
      this.setupNewsFiltering();
    }
  }

  /**
   * ニュースフィルタリングのセットアップ
   */
  setupNewsFiltering() {
    // URLパラメーターの処理
    this.handleURLParameters();

    // カテゴリー変更と表示制御の同期設定
    this.setupCategoryDisplaySync();

    // グローバルにアクセス可能にする（外部連携用）
    this.exposeGlobalInterface();

    console.log('📄 News一覧ページ: 初期化完了', {
      category: this.currentCategory,
    });
  }

  /**
   * URLパラメーターの処理
   */
  handleURLParameters() {
    const categoryParam = URLUtils.getURLParameter('category');

    if (categoryParam) {
      console.log(`🎯 Filtering by category: \"${categoryParam}\"`);
      this.currentCategory = categoryParam;
    } else {
      console.log('📁 Showing all news');
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
      getCurrentState: () => this.getCurrentState(),
      changeCategory: (category) => this.changeCategory(category),
      reset: () => this.reset()
    };
  }

  /**
   * 現在の状態を取得
   */
  getCurrentState() {
    return {
      category: this.currentCategory,
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
   * 各管理部隊への直接アクセス（デバッグ用）
   */
  getManagers() {
    return {
      category: this.categoryManager,
      display: this.displayManager
    };
  }
}
