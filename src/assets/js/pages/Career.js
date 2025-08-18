/**
 * Career - Careerページ専用の機能管理クラス
 */

import { InterviewMoreManager } from '../modules/InterviewMoreManager.js';

export class Career {
  constructor() {
    this.interviewMoreManager = null;
    this.init();
  }

  init() {
    if (!this.isCareerPage()) {
      return;
    }

    this.initInterviewViewMore();
  }

  isCareerPage() {
    // URLパスやbody要素のクラスなどで判定
    return window.location.pathname.includes('/career') ||
           document.body.classList.contains('career-page') ||
           document.querySelector('.p-career-interview');
  }

  initInterviewViewMore() {
    const interviewContainer = document.querySelector('.js-more-content');

    if (interviewContainer) {
      this.interviewMoreManager = new InterviewMoreManager({
        contentSelector: '.js-more-content',
        itemsSelector: '.js-more-item',
        buttonSelector: '.js-more',
        maxVisibleItems: 6,
        animationDuration: 400,
        debug: process.env.NODE_ENV === 'development'
      });

      // カスタムイベントリスナー
      document.addEventListener('interview:expanded', (e) => {
        if (e.detail.manager === this.interviewMoreManager) {
          console.log('Interview VIEW MORE expanded:', e.detail);
        }
      });
    }
  }

  // 外部からアクセス可能なメソッド
  getInterviewMoreManager() {
    return this.interviewMoreManager;
  }

  // Interview表示状態をリセット
  resetInterview() {
    if (this.interviewMoreManager) {
      this.interviewMoreManager.reset();
    }
  }
}
