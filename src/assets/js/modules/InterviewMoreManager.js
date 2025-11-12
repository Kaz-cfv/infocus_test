/**
 * InterviewMoreManager - インタビューカード用の「VIEW MORE」機能マネージャー
 *
 * 特徴:
 * - 最初の6件を表示、残りを非表示
 * - VIEW MOREクリックで全て表示
 * - スムーズなアニメーション付き
 * - レスポンシブ対応
 *
 * 使用例:
 * new InterviewMoreManager({
 *   contentSelector: '.js-more-content',
 *   itemsSelector: '.js-more-item',
 *   buttonSelector: '.js-more',
 *   maxVisibleItems: 6
 * });
 */

export class InterviewMoreManager {
  constructor(options = {}) {
    this.config = {
      contentSelector: '.js-more-content',
      itemsSelector: '.js-more-item',
      buttonSelector: '.js-more',
      maxVisibleItems: 6,
      animationDuration: 400,
      debug: false,
      ...options
    };

    this.isExpanded = false;
    this.allItems = [];
    this.hiddenItems = [];
    this.init();
  }

  init() {
    if (this.config.debug) {
      // console.log('InterviewMoreManager initialized with config:', this.config);
    }

    this.collectItems();
    this.setupInitialVisibility();
    this.setupViewMoreButton();
  }

  collectItems() {
    this.allItems = Array.from(document.querySelectorAll(this.config.itemsSelector));

    if (this.config.debug) {
      // console.log('Total items found:', this.allItems.length);
    }

    // maxVisibleItemsを超えるアイテムを隠すアイテムとして設定
    this.hiddenItems = this.allItems.slice(this.config.maxVisibleItems);

    if (this.config.debug) {
      // console.log('Items to hide:', this.hiddenItems.length);
    }
  }

  setupInitialVisibility() {
    const button = document.querySelector(this.config.buttonSelector);

    // 隠すべきアイテムがない場合はボタンを非表示
    // if (this.hiddenItems.length === 0) {
    //   if (button) {
    //     button.style.display = 'none';
    //   }
    //   if (this.config.debug) {
    //     // console.log('No items to hide, button hidden');
    //   }
    //   return;
    // }

    // 隠すアイテムにクラスを追加
    this.hiddenItems.forEach((item) => {
      item.classList.add('is-hidden');
    });
  }

  setupViewMoreButton() {
    const button = document.querySelector(this.config.buttonSelector);

    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMoreItems();
      });
    } else if (this.config.debug) {
      console.warn('Button not found:', this.config.buttonSelector);
    }
  }

  showMoreItems() {
    if (this.isExpanded) {
      return; // 既に展開済み
    }

    const button = document.querySelector(this.config.buttonSelector);

    // 隠されたアイテムを全て表示
    this.hiddenItems.forEach((item) => {
      item.classList.remove('is-hidden');
    });

    // ボタンを非表示
    if (button) {
      button.style.display = 'none';
    }

    this.isExpanded = true;
    this.dispatchCustomEvent('interview:expanded');

    // if (this.config.debug) {
    //   console.log('Showing all hidden items');
    // }
  }

  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        manager: this,
        config: this.config,
        totalItems: this.allItems.length,
        hiddenItemsCount: this.hiddenItems.length,
        ...detail
      }
    });

    document.dispatchEvent(event);

    // if (this.config.debug) {
    //   console.log(`Dispatched event "${eventName}"`, detail);
    // }
  }

  // リセット機能（必要に応じて）
  reset() {
    this.hiddenItems.forEach(item => {
      item.classList.add('is-hidden');
    });

    const button = document.querySelector(this.config.buttonSelector);
    if (button) {
      button.style.display = '';
    }

    this.isExpanded = false;

    if (this.config.debug) {
      console.log('Reset to initial state');
    }
  }

  // 現在の状態を取得
  getState() {
    return {
      isExpanded: this.isExpanded,
      totalItems: this.allItems.length,
      visibleItems: this.allItems.length - this.hiddenItems.length,
      hiddenItems: this.hiddenItems.length
    };
  }
}
