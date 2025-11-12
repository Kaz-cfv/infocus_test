/**
 * Jobs - CEOインタビューページ専用の機能管理クラス
 * AsideInterviewセクションで3件初期表示のVIEW ALL機能を実装
 */

import { InterviewMoreManager } from '../modules/InterviewMoreManager.js';

export class Jobs {
  constructor() {
    this.asideInterviewMoreManager = null;
    this.interviewData = [];
    this.init();
  }

  async init() {
    if (!this.isJobsPage()) {
      return;
    }

    await this.fetchInterviewData();
    this.renderInterviews();
    this.initAsideInterviewViewMore();
  }

  isJobsPage() {
    // URLパスやbody要素のクラスなどで判定
    return window.location.pathname.includes('/careers/jobs') ||
           document.body.classList.contains('jobs-page') ||
           document.querySelector('.p-jobs-aside');
  }

  /**
   * インタビューデータをAPIから取得
   */
  async fetchInterviewData() {
    try {
      const response = await fetch('https://infocus.wp.site-prev2.com/wp-json/infocus/v1/carrer');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // APIレスポンスは { interview: [...], career: [...] } の形式
      // interview配列を取得
      this.interviewData = Array.isArray(data?.interview) ? data.interview : [];

      // console.log('✅ Interview data loaded (Jobs):', this.interviewData.length, '件');
    } catch (error) {
      console.error('❌ Interview data fetch error (Jobs):', error);
      this.interviewData = [];
    }
  }

  /**
   * インタビューカードを生成
   */
  createInterviewCard(interview) {
    const title = interview.title?.rendered || '';
    const imageUrl = interview.acfs?.image?.url || '';
    const name = interview.acfs?.name || '';
    const position = interview.acfs?.position || '';
    const url = interview.acfs?.url || '#';

    // ポジションを配列に分割（スラッシュ区切り対応）
    const positions = position ? position.split('/').map(p => p.trim()) : [];

    // タグのHTMLを生成
    const tagsHtml = positions.length > 0 ? `
      <ul class="c-interview-card__info-tags">
        ${positions.map(pos => `
          <li>
            <span>${pos}</span>
          </li>
        `).join('')}
      </ul>
    ` : '';

    return `
      <li class="p-jobs-aside__list-item js-more-item">
        <div class="c-interview-card mouse-over">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="c-interview-card__thumb">
            <figure>
              <img src="${imageUrl}" alt="${title}">
            </figure>
          </a>
          <div class="c-interview-card__info">
            <div class="c-interview-card__info-title">
              <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
            </div>
            ${name ? `
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="c-interview-card__info-staff">${name}</a>
            ` : ''}
            ${tagsHtml}
          </div>
        </div>
      </li>
    `;
  }

  /**
   * インタビュー一覧をレンダリング
   */
  renderInterviews() {
    const listContainer = document.querySelector('.p-jobs-aside__list');
    const buttonContainer = document.querySelector('.p-jobs-aside__btn');

    if (!listContainer) {
      console.warn('⚠️ Jobs Interview list container not found');
      return;
    }

    // インタビューカードを生成
    const cardsHtml = this.interviewData.map(interview =>
      this.createInterviewCard(interview)
    ).join('');

    // リストに挿入
    listContainer.innerHTML = cardsHtml;

    // VIEW ALL ボタンの表示/非表示制御（3件以上で表示）
    // if (buttonContainer) {
    //   if (this.interviewData.length >= 3) {
    //     buttonContainer.style.display = '';
    //   } else {
    //     buttonContainer.style.display = 'none';
    //   }
    // }
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
      // document.addEventListener('interview:expanded', (e) => {
      //   if (e.detail.manager === this.asideInterviewMoreManager) {
      //     console.log('STAFF INTERVIEW VIEW ALL expanded:', e.detail);
      //   }
      // });
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
