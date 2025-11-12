/**
 * ViewMoreManager - 「VIEW ALL」機能の汎用マネージャー
 *
 * 使用例:
 * // About/Awards向け
 * new ViewMoreManager({
 *   contentSelector: '.js-awards-summary-content',
 *   itemsSelector: '.js-awards-hidden',
 *   buttonSelector: '.js-awards-more-btn',
 *   moreContainerSelector: '.js-awards-more',
 *   useItemBasedHeight: true,
 *   firstItemSelector: '.p-about-awards__summary-item:first-child'
 * });
 *
 * // Team/Related向け
 * new ViewMoreManager({
 *   contentSelector: '.js-more-content',
 *   itemsSelector: '.p-team-detail__related-item.is-preview, .p-team-detail__related-item.is-hidden',
 *   buttonSelector: '.js-more-btn',
 *   moreContainerSelector: '.p-team-detail__related-more',
 *   maxVisibleItems: 10,
 *   useItemBasedHeight: false
 * });
 */

export class ViewMoreManager {
  constructor(options = {}) {
    this.config = {
      // セレクタ設定
      contentSelector: '[data-viewmore-content]',
      itemsSelector: '[data-viewmore-hidden]',
      buttonSelector: '[data-viewmore-btn]',
      moreContainerSelector: '[data-viewmore-container]',

      // 表示制御
      maxVisibleItems: 10,
      previewItems: 5, // プレビュー表示する件数（うっすら見える）

      // 高さ計算方式
      useItemBasedHeight: false, // trueの場合、最初のアイテム基準で高さ計算
      firstItemSelector: null,
      collapsedHeightOffset: 150, // 折りたたみ時の追加オフセット
      collapsedHeightProperty: '--collapsed-height',

      // グラデーション設定
      enableGradientOverlay: true,
      gradientHeight: 150, // グラデーションの高さ
      gradientStops: [
        { position: 0, opacity: 0 },
        { position: 20, opacity: 0.1 },
        { position: 40, opacity: 0.3 },
        { position: 70, opacity: 0.6 },
        { position: 100, opacity: 1 }
      ],

      // アニメーション
      animationDuration: 600,

      // デバッグ
      debug: false,

      ...options
    };

    this.isExpanded = false;
    this.init();
  }

  init() {
    // if (this.config.debug) {
    //   console.log('ViewMoreManager initialized with config:', this.config);
    // }

    this.setupViewMoreButton();
    this.setupInitialVisibility();
    this.calculateCollapsedHeight();

    // リサイズ時の高さ再計算
    window.addEventListener('resize', () => {
      if (!this.isExpanded) {
        this.calculateCollapsedHeight();
      }
    });
  }

  calculateCollapsedHeight() {
    const content = document.querySelector(this.config.contentSelector);

    if (!content) {
      if (this.config.debug) {
        console.warn('ViewMoreManager: Content element not found:', this.config.contentSelector);
      }
      return;
    }

    // 一時的に制限を解除して計算
    content.classList.remove('is-collapsed');

    requestAnimationFrame(() => {
      let collapsedHeight = 0;

      if (this.config.useItemBasedHeight && this.config.firstItemSelector) {
        // 最初のアイテム基準での高さ計算（Aboutページ向け）
        collapsedHeight = this.calculateItemBasedHeight(content);
      } else {
        // 最大表示アイテム数基準での高さ計算（Team詳細ページ向け）
        collapsedHeight = this.calculateMaxItemsBasedHeight(content);
      }

      if (collapsedHeight > 0) {
        document.documentElement.style.setProperty(
          this.config.collapsedHeightProperty,
          `${collapsedHeight}px`
        );
        content.classList.add('is-collapsed');

        // if (this.config.debug) {
        //   console.log('ViewMoreManager: Collapsed height set to:', collapsedHeight + 'px');
        // }
      }
    });
  }

  calculateItemBasedHeight(content) {
    const firstItem = document.querySelector(this.config.firstItemSelector);
    if (!firstItem) return 0;

    const firstItemRect = firstItem.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    return firstItemRect.bottom - contentRect.top + this.config.collapsedHeightOffset;
  }

  calculateMaxItemsBasedHeight(content) {
    // アイテムリストを取得（ulなどの親要素を考慮）
    const listElement = content.querySelector('ul, ol') || content;
    const items = listElement.querySelectorAll(':scope > li, :scope > .p-team-detail__related-item, :scope > *:not(.p-team-detail__related-columns)');

    // if (this.config.debug) {
    //   console.log('ViewMoreManager: Found items:', items.length);
    // }

    if (items.length <= this.config.maxVisibleItems) {
      // if (this.config.debug) {
      //   console.log('ViewMoreManager: Items less than maxVisibleItems, no collapse needed');
      // }
      return 0;
    }

    // 最大表示件数目のアイテムを基準に計算
    const targetIndex = Math.min(this.config.maxVisibleItems - 1, items.length - 1);
    const targetItem = items[targetIndex];

    if (targetItem) {
      const targetItemRect = targetItem.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      const calculatedHeight = targetItemRect.bottom - contentRect.top + this.config.collapsedHeightOffset;

      // if (this.config.debug) {
      //   console.log('ViewMoreManager: Target item index:', targetIndex);
      //   console.log('ViewMoreManager: Calculated height:', calculatedHeight);
      // }

      return calculatedHeight;
    }

    return 0;
  }

  setupInitialVisibility() {
    const items = document.querySelectorAll(this.config.itemsSelector);
    const viewMoreButton = document.querySelector(this.config.moreContainerSelector);

    // 隠された項目がない場合はボタンを非表示
    if (items.length === 0) {
      if (viewMoreButton) {
        viewMoreButton.classList.add('is-hidden');
      }

      // if (this.config.debug) {
      //   console.log('ViewMoreManager: No hidden items found, hiding button');
      // }
    }
  }

  setupViewMoreButton() {
    const button = document.querySelector(this.config.buttonSelector);

    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleViewMore();
      });

      // if (this.config.debug) {
      //   console.log('ViewMoreManager: Button event listener attached');
      // }
    } else if (this.config.debug) {
      console.warn('ViewMoreManager: Button not found:', this.config.buttonSelector);
    }
  }

  toggleViewMore() {
    const hiddenItems = document.querySelectorAll(this.config.itemsSelector);
    const viewMoreButton = document.querySelector(this.config.moreContainerSelector);
    const content = document.querySelector(this.config.contentSelector);

    if (!this.isExpanded && hiddenItems.length > 0) {
      // 全て表示
      hiddenItems.forEach((item) => {
        item.classList.remove('js-awards-hidden', 'is-hidden', 'is-preview');
        // data属性からも削除
        if (item.hasAttribute('data-viewmore-hidden')) {
          item.removeAttribute('data-viewmore-hidden');
        }
      });

      // 高さ制限を解除
      if (content) {
        content.classList.remove('is-collapsed');
      }

      // ボタンを非表示
      if (viewMoreButton) {
        viewMoreButton.classList.add('is-hidden');
      }

      this.isExpanded = true;

      if (this.config.debug) {
        console.log('ViewMoreManager: Expanded view, showing all items');
      }

      // カスタムイベントを発火
      this.dispatchCustomEvent('viewmore:expanded', {
        hiddenItemsCount: hiddenItems.length
      });
    }
  }

  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        manager: this,
        config: this.config,
        ...detail
      }
    });

    document.dispatchEvent(event);

    if (this.config.debug) {
      console.log(`ViewMoreManager: Dispatched event "${eventName}"`, detail);
    }
  }

  // 動的に設定を更新するメソッド
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (this.config.debug) {
      console.log('ViewMoreManager: Config updated:', this.config);
    }
  }

  // 手動で展開状態をリセット
  reset() {
    this.isExpanded = false;
    const content = document.querySelector(this.config.contentSelector);
    const viewMoreButton = document.querySelector(this.config.moreContainerSelector);

    if (content) {
      content.classList.add('is-collapsed');
    }

    if (viewMoreButton) {
      viewMoreButton.classList.remove('is-hidden');
    }

    this.calculateCollapsedHeight();

    if (this.config.debug) {
      console.log('ViewMoreManager: Reset to initial state');
    }
  }

  // 現在の状態を取得
  getState() {
    return {
      isExpanded: this.isExpanded,
      config: this.config,
      hiddenItemsCount: document.querySelectorAll(this.config.itemsSelector).length
    };
  }
}
