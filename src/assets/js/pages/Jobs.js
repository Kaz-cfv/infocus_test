/**
 * Jobs - CEOインタビューページ専用の機能管理クラス
 * AsideInterviewセクションで3件初期表示のVIEW ALL機能を実装
 */

import { InterviewMoreManager } from '../modules/InterviewMoreManager.js';

export class Jobs {
  constructor() {
    this.asideInterviewMoreManager = null;
    this.init();
  }

  init() {
    if (!this.isJobsPage()) {
      return;
    }

    this.initAsideInterviewViewMore();
  }

  isJobsPage() {
    // URLパスやbody要素のクラスなどで判定
    return window.location.pathname.includes('/careers/jobs') ||
           document.body.classList.contains('jobs-page') ||
           document.querySelector('.p-jobs-aside');
  }

  initAsideInterviewViewMore() {
    const asideContainer = document.querySelector('.p-jobs-aside .js-more-content');

    if (asideContainer) {
      this.asideInterviewMoreManager = new InterviewMoreManager({
        contentSelector: '.p-jobs-aside .js-more-content',
        itemsSelector: '.p-jobs-aside .js-more-item',
        buttonSelector: '.p-jobs-aside .js-more',
        maxVisibleItems: 3,
        animationDuration: 400,
        debug: process.env.NODE_ENV === 'development'
      });

      // カスタムイベントリスナー
      document.addEventListener('interview:expanded', (e) => {
        if (e.detail.manager === this.asideInterviewMoreManager) {
          console.log('STAFF INTERVIEW VIEW ALL expanded:', e.detail);
        }
      });
    }
  }

  // 外部からアクセス可能なメソッド
  getAsideInterviewMoreManager() {
    return this.asideInterviewMoreManager;
  }

  // Interview表示状態をリセット
  resetAsideInterview() {
    if (this.asideInterviewMoreManager) {
      this.asideInterviewMoreManager.reset();
    }
  }
}
