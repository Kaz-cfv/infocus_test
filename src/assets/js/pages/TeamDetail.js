/**
 * TeamDetail - チーム詳細ページ専用の機能管理クラス
 * Awards機能に影響を与えない独立した実装
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
    return window.location.pathname.includes('/team/') &&
           document.querySelector('.p-team-detail__related');
  }

  initRelatedViewMore() {
    const relatedContainer = document.querySelector('.js-more-content');

    if (!relatedContainer) {
      return;
    }

    // DOMの描画を待ってから初期化
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 初期状態を設定
        this.setupInitialItemVisibility();

        // ViewMoreManagerを初期化
        this.viewMoreManager = new ViewMoreManager({
          contentSelector: '.js-more-content',
          itemsSelector: '.p-team-detail__related-item.is-preview, .p-team-detail__related-item.is-hidden',
          buttonSelector: '.js-more-btn',
          moreContainerSelector: '.p-team-detail__related-more',
          maxVisibleItems: 10,
          previewItems: 5,
          useItemBasedHeight: false,
          collapsedHeightOffset: 110, // 10件目 + row-gap(50px) + 画像上部(60px)
          collapsedHeightProperty: '--collapsed-height',
          enableGradientOverlay: true,
          debug: process.env.NODE_ENV === 'development'
        });

        // 展開時のイベント処理
        document.addEventListener('viewmore:expanded', (e) => {
          if (e.detail.manager === this.viewMoreManager) {
            // is-previewクラスも削除して完全に表示
            const previewItems = document.querySelectorAll('.p-team-detail__related-item.is-preview');
            previewItems.forEach(item => {
              item.classList.remove('is-preview');
            });

            console.log('TeamDetail: All items expanded');
          }
        });
      });
    });
  }

  // 初期の表示状態を設定
  // 1-10件目: 通常表示
  // 11-15件目: is-preview (opacity: 0.3でうっすら見える)
  // 16件目以降: is-hidden (完全非表示)
  setupInitialItemVisibility() {
    const allItems = document.querySelectorAll('.p-team-detail__related-item');

    if (allItems.length <= 10) {
      // 10件以下の場合は何もしない
      return;
    }

    allItems.forEach((item, index) => {
      if (index >= 10 && index < 15) {
        // 11-15件目: うっすら見える
        item.classList.add('is-preview');
      } else if (index >= 15) {
        // 16件目以降: 完全非表示
        item.classList.add('is-hidden');
      }
    });

    // console.log(`TeamDetail: Set initial visibility - ${allItems.length} items total`);
  }

  // 外部からアクセス可能なメソッド
  getViewMoreManager() {
    return this.viewMoreManager;
  }

  // Related表示状態をリセット
  resetRelated() {
    if (this.viewMoreManager) {
      this.viewMoreManager.reset();
      this.setupInitialItemVisibility();
    }
  }

  // デバッグ用: 現在の状態を取得
  getDebugInfo() {
    const allItems = document.querySelectorAll('.p-team-detail__related-item');
    const previewItems = document.querySelectorAll('.p-team-detail__related-item.is-preview');
    const hiddenItems = document.querySelectorAll('.p-team-detail__related-item.is-hidden');

    return {
      totalItems: allItems.length,
      previewItems: previewItems.length,
      hiddenItems: hiddenItems.length,
      managerState: this.viewMoreManager ? this.viewMoreManager.getState() : null
    };
  }
}
