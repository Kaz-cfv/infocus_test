/**
 * Career - Careerページ専用の機能管理クラス
 */

import { InterviewMoreManager } from '../modules/InterviewMoreManager.js';

export class Career {
  constructor() {
    this.interviewMoreManager = null;
    this.interviewData = [];
    this.careerData = [];
    this.init();
  }

  async init() {
    if (!this.isCareerPage()) {
      return;
    }

    await this.fetchInterviewData();
    this.renderInterviews();
    this.renderCareerPositions();
    this.initInterviewViewMore();
    this.initCareerAccordions();
  }

  isCareerPage() {
    // URLパスやbody要素のクラスなどで判定
    return window.location.pathname.includes('/career') ||
           document.body.classList.contains('career-page') ||
           document.querySelector('.p-career-interview');
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

      // career配列も取得
      this.careerData = Array.isArray(data?.career) ? data.career : [];

      // console.log('✅ Interview data loaded:', this.interviewData.length, '件');
    } catch (error) {
      console.error('❌ Interview data fetch error:', error);
      this.interviewData = [];
      this.careerData = [];
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
      <li class="p-career-interview__list-item js-more-item">
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
    const listContainer = document.querySelector('.p-career-interview__list');
    const buttonContainer = document.querySelector('.p-career-interview__btn');

    if (!listContainer) {
      console.warn('⚠️ Interview list container not found');
      return;
    }

    // インタビューカードを生成
    const cardsHtml = this.interviewData.map(interview =>
      this.createInterviewCard(interview)
    ).join('');

    // リストに挿入
    listContainer.innerHTML = cardsHtml;

    // VIEW MORE ボタンの表示/非表示制御
    if (buttonContainer) {
      if (this.interviewData.length >= 6) {
        buttonContainer.style.display = '';
      } else {
        buttonContainer.style.display = 'none';
      }
    }
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
      // document.addEventListener('interview:expanded', (e) => {
      //   if (e.detail.manager === this.interviewMoreManager) {
      //     console.log('Interview VIEW MORE expanded:', e.detail);
      //   }
      // });
    }
  }

  // 外部からアクセス可能なメソッド
  getInterviewMoreManager() {
    return this.interviewMoreManager;
  }

  /**
   * キャリアポジションカードを生成
   */
  createCareerAccordion(career) {
    const title = career.title?.rendered || '';
    const place = career.acfs?.place || '';

    // 改行コードを<br>タグに変換
    const formatTextWithBreaks = (text) => {
      if (!text) return '';
      return text.replace(/\r\n|\n|\r/g, '<br>');
    };

    // 表示するデータ項目を定義
    const dataItems = [
      { label: '仕事内容', content: formatTextWithBreaks(career.acfs?.details) },
      { label: '担当項目', content: formatTextWithBreaks(career.acfs?.job) },
      { label: '応募資格', content: formatTextWithBreaks(career.acfs?.requires) },
      { label: '歓迎スキル', content: formatTextWithBreaks(career.acfs?.skill) },
      { label: '雇用形態', content: formatTextWithBreaks(career.acfs?.type) },
      { label: '勤務地', content: formatTextWithBreaks(career.acfs?.location) },
      { label: '勤務時間', content: formatTextWithBreaks(career.acfs?.hours) },
      { label: '給与', content: formatTextWithBreaks(career.acfs?.salary) },
      { label: '待遇', content: formatTextWithBreaks(career.acfs?.benefis) },
      { label: '休日・休暇', content: formatTextWithBreaks(career.acfs?.timeoff) }
    ].filter(item => item.content); // データがある項目のみ表示

    // アコーディオンアイテムのHTMLを生成
    const itemsHtml = dataItems.map(item => `
      <dl>
        <dt>
          <span>${item.label}</span>
        </dt>
        <dd>
          <p>${item.content}</p>
        </dd>
      </dl>
    `).join('');

    return `
      <div class="c-accordion">
        <details class="c-accordion__wrap js-details">
          <summary class="c-accordion__head js-summary">
            <span class="c-accordion__head-title">${title}</span>
            <span class="c-accordion__head-category">${place}</span>
            <i class="c-accordion__head-icon">+</i>
          </summary>
          <div class="c-accordion__content js-content">
            ${itemsHtml}
          </div>
        </details>
      </div>
    `;
  }

  /**
   * キャリアポジション一覧をレンダリング
   */
  renderCareerPositions() {
    const positionContainer = document.querySelector('.p-career-position__content');

    if (!positionContainer) {
      console.warn('⚠️ Career position container not found');
      return;
    }

    // キャリアポジションのHTMLを生成
    const positionsHtml = this.careerData.map(career =>
      this.createCareerAccordion(career)
    ).join('');

    // コンテナに挿入
    positionContainer.innerHTML = positionsHtml;

    // console.log('✅ Career positions loaded:', this.careerData.length, '件');
  }

  /**
   * アコーディオンの動作を初期化
   */
  initCareerAccordions() {
    const accordions = document.querySelectorAll('.js-details');

    accordions.forEach(details => {
      const summary = details.querySelector('.js-summary');
      const content = details.querySelector('.js-content');
      const icon = summary.querySelector('.c-accordion__head-icon');

      // アコーディオンのトグル時のアニメーション
      summary.addEventListener('click', (e) => {
        e.preventDefault();

        if (details.open) {
          // 閉じる処理
          const animation = content.animate(
            [{ height: content.scrollHeight + 'px' }, { height: '0px' }],
            { duration: 300, easing: 'ease-out' }
          );

          animation.onfinish = () => {
            details.removeAttribute('open');
            icon.textContent = '+';
          };
        } else {
          // 開く処理
          details.setAttribute('open', '');
          const animation = content.animate(
            [{ height: '0px' }, { height: content.scrollHeight + 'px' }],
            { duration: 300, easing: 'ease-out' }
          );

          animation.onfinish = () => {
            content.style.height = 'auto';
            icon.textContent = '-';
          };
        }
      });
    });
  }

  // Interview表示状態をリセット
  resetInterview() {
    if (this.interviewMoreManager) {
      this.interviewMoreManager.reset();
    }
  }
}
