/**
 * About - Aboutページ専用の機能管理クラス
 */

import { ViewMoreManager } from '../modules/ViewMoreManager.js';
import { AboutAwards } from '../modules/AboutAwards.js';

export class About {
  constructor() {
    this.viewMoreManager = null;
    this.summaryElements = [];
    this.aboutAwards = null;
    this.init();
  }

  async init() {
    if (!this.isAboutPage()) {
      return;
    }

    // AboutAwardsを初期化（API取得・データ抽出・コンソール出力）
    this.aboutAwards = new AboutAwards();
    await this.aboutAwards.init();
    this.initAwardsViewMore();
    this.initSummaryHovers();
  }

  isAboutPage() {
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

  /**
   * Summaryコンポーネントのホバー連動機能を初期化
   */
  initSummaryHovers() {
    this.summaryElements = document.querySelectorAll('.c-summary');

    this.summaryElements.forEach(summaryElement => {
      const infoItems = summaryElement.querySelectorAll('.c-summary__info-item');
      const figures = summaryElement.querySelectorAll('.c-summary__pic > figure');

      if (!infoItems.length || !figures.length) {
        return;
      }

      // 各info-itemにホバーイベントを設定
      infoItems.forEach(item => {
        // マウスオーバー時：対応する画像を表示
        item.addEventListener('mouseenter', () => {
          const awardId = item.dataset.awardId;
          this.showFigure(summaryElement, awardId);
        });

        // マウスアウト時：全ての画像を非表示
        item.addEventListener('mouseleave', () => {
          this.hideAllFigures(summaryElement);
        });
      });
    });
  }

  /**
   * 指定されたaward-idに対応する画像を表示
   * @param {HTMLElement} summaryElement - .c-summary要素
   * @param {string} awardId - data-award-idの値
   */
  showFigure(summaryElement, awardId) {
    const figures = summaryElement.querySelectorAll('.c-summary__pic > figure');

    // 全ての画像からis-activeを除去
    figures.forEach(figure => {
      figure.classList.remove('is-active');
    });

    // 対応するIDの画像にis-activeを付与
    const targetFigure = summaryElement.querySelector(
      `.c-summary__pic > figure[data-award-id="${awardId}"]`
    );

    if (targetFigure) {
      targetFigure.classList.add('is-active');
    }
  }

  /**
   * 全ての画像を非表示にする
   * @param {HTMLElement} summaryElement - .c-summary要素
   */
  hideAllFigures(summaryElement) {
    const figures = summaryElement.querySelectorAll('.c-summary__pic > figure');

    figures.forEach(figure => {
      figure.classList.remove('is-active');
    });
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

  // AboutAwardsインスタンスを取得
  getAboutAwards() {
    return this.aboutAwards;
  }
}
