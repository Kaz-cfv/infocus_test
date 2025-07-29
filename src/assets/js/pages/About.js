/**
 * About - Aboutページ専用の機能管理クラス
 */

import { ViewMoreManager } from '../modules/ViewMoreManager.js';

export class About {
  constructor() {
    this.viewMoreManager = null;
    this.init();
  }

  init() {
    if (!this.isAboutPage()) {
      return;
    }

    this.initAwardsViewMore();
  }

  isAboutPage() {
    // URLパスやbody要素のクラスなどで判定
    return window.location.pathname.includes('/about') ||
           document.body.classList.contains('about-page') ||
           document.querySelector('.p-about-awards');
  }

  initAwardsViewMore() {
    const awardsContainer = document.querySelector('.js-awards-summary-content');

    if (awardsContainer) {
      this.viewMoreManager = new ViewMoreManager({
        contentSelector: '.js-awards-summary-content',
        itemsSelector: '.js-awards-hidden',
        buttonSelector: '.js-awards-more-btn',
        moreContainerSelector: '.js-awards-more',
        useItemBasedHeight: true,
        firstItemSelector: '.js-awards-summary-content .p-about-awards__summary-item:first-child',
        collapsedHeightOffset: 150,
        collapsedHeightProperty: '--collapsed-awards-height',
        debug: process.env.NODE_ENV === 'development'
      });

      document.addEventListener('viewmore:expanded', (e) => {
        if (e.detail.manager === this.viewMoreManager) {
          // console.log('Awards VIEW ALL expanded:', e.detail);
        }
      });
    }
  }

  // 外部からアクセス可能なメソッド
  getViewMoreManager() {
    return this.viewMoreManager;
  }

  // Awards表示状態をリセット
  resetAwards() {
    if (this.viewMoreManager) {
      this.viewMoreManager.reset();
    }
  }
}
