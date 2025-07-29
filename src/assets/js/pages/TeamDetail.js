/**
 * TeamDetail - チーム詳細ページ専用の機能管理クラス
 */

import { ViewMoreManager } from '../modules/ViewMoreManager.js';

export class TeamDetail {
  constructor() {
    this.viewMoreManager = null;
    this.init();
  }

  init() {
    if (!this.isTeamDetailPage()) {
      return;
    }

    this.initRelatedViewMore();
  }

  isTeamDetailPage() {
    // URLパスやDOM要素の存在で判定
    return window.location.pathname.includes('/team/detail') ||
           document.querySelector('.p-team-detail__related');
  }

  initRelatedViewMore() {
    const relatedContainer = document.querySelector('.js-more-content');

    if (relatedContainer) {
      // 初期の隠し状態を設定
      this.setupInitialItemVisibility();

      this.viewMoreManager = new ViewMoreManager({
        contentSelector: '.js-more-content',
        itemsSelector: '.p-team-detail__related-item.is-hidden',
        buttonSelector: '.js-more-btn',
        moreContainerSelector: '.p-team-detail__related-more',
        maxVisibleItems: 10,
        useItemBasedHeight: false,
        collapsedHeightOffset: 280,
        collapsedHeightProperty: '--collapsed-height',
        debug: process.env.NODE_ENV === 'development'
      });

      document.addEventListener('viewmore:expanded', (e) => {
        if (e.detail.manager === this.viewMoreManager) {
          // console.log('Related VIEW ALL expanded:', e.detail);
        }
      });
    }
  }

  // 初期の表示状態を設定（ViewMoreManagerより前に実行）
  setupInitialItemVisibility() {
    const allItems = document.querySelectorAll('.p-team-detail__related-item');
    const maxVisibleItems = 10;

    // 11件目以降にis-hiddenクラスを付与
    allItems.forEach((item, index) => {
      if (index >= maxVisibleItems) {
        item.classList.add('is-hidden');
      }
    });
  }

  // 外部からアクセス可能なメソッド
  getViewMoreManager() {
    return this.viewMoreManager;
  }

  // Related表示状態をリセット
  resetRelated() {
    if (this.viewMoreManager) {
      this.viewMoreManager.reset();
    }
  }
}
