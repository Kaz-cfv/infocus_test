/**
 * 汎用的な検索UIの状態を管理するクラス
 * 複数のページ（Projects、Newsなど）で使用可能
 */

export class SearchUIManager {
  constructor(options = {}) {
    // オプションから設定を取得（デフォルト値付き）
    this.config = {
      // ターゲット要素のセレクター（優先順位順）
      targetSelectors: options.targetSelectors || ['.p-project-head', '.p-project', '.p-news-head', '.p-news'],
      // 検索トリガーボタンのセレクター
      searchTrigger: options.searchTrigger || '.js-search',
      // 検索クローズボタンのセレクター
      searchCloseTrigger: options.searchCloseTrigger || '.js-search-close',
      // 検索入力フィールドの設定
      searchInputs: options.searchInputs || {
        pc: { id: 'search_category', labelSelector: 'label[for="search_category"]' },
        sp: { id: 'search_category_sp', labelSelector: 'label[for="search_category_sp"]' }
      },
      // 検索開始時に付与するdata属性
      searchDataAttribute: options.searchDataAttribute || 'data-type',
      searchDataValue: options.searchDataValue || 'search',
      // デバッグモード
      debug: options.debug || false
    };

    // 要素を取得
    this.targetElement = this.findTargetElement();
    this.searchTrigger = document.querySelector(this.config.searchTrigger);
    this.searchCloseTrigger = document.querySelector(this.config.searchCloseTrigger);

    // 検索入力フィールドとラベルを取得
    this.searchElements = this.getSearchElements();

    this.init();
  }

  /**
   * ターゲット要素を見つける（優先順位に従って）
   * @returns {HTMLElement|null} 見つかったターゲット要素
   */
  findTargetElement() {
    for (const selector of this.config.targetSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.log(`Target element found: ${selector}`);
        return element;
      }
    }

    this.log('No target element found from selectors:', this.config.targetSelectors);
    return null;
  }

  /**
   * 検索入力要素とラベルを取得
   * @returns {Object} 検索要素のオブジェクト
   */
  getSearchElements() {
    const elements = {};

    Object.entries(this.config.searchInputs).forEach(([key, config]) => {
      const input = document.getElementById(config.id);
      const label = document.querySelector(config.labelSelector);

      if (input && label) {
        elements[key] = { input, label };
        this.log(`Search elements found for ${key}: input(${config.id}), label(${config.labelSelector})`);
      } else {
        this.log(`Search elements not found for ${key}: input(${!!input}), label(${!!label})`);
      }
    });

    return elements;
  }

  /**
   * 検索入力フィールドのイベントをバインド
   */
  bindInputEvents() {
    Object.entries(this.searchElements).forEach(([key, { input, label }]) => {
      const handleInput = () => {
        this.toggleLabel(input, label);
      };

      // 複数のイベントをバインド
      ['input', 'change', 'blur'].forEach(eventType => {
        input.addEventListener(eventType, handleInput);
      });

      // 初期状態をチェック
      this.toggleLabel(input, label);

      this.log(`Input events bound for ${key} (${input.id})`);
    });
  }

  /**
   * 入力値に応じてラベルの表示/非表示を切り替え
   * @param {HTMLElement} input - 入力フィールド
   * @param {HTMLElement} label - 対応するラベル
   */
  toggleLabel(input, label) {
    if (!input || !label) return;

    const hasValue = input.value.trim().length > 0;

    if (hasValue) {
      // 文字が入力されている場合はラベルを隠す
      label.style.opacity = '0';
      label.style.visibility = 'hidden';
      this.log(`Label hidden for ${input.id}`);
    } else {
      // 文字が入力されていない場合はラベルを表示
      label.style.opacity = '';
      label.style.visibility = '';
      this.log(`Label shown for ${input.id}`);
    }
  }

  /**
   * デバッグログを出力
   * @param {...any} args - ログ出力する引数
   */
  log(...args) {
    if (this.config.debug) {
      // console.log('[SearchUIManager]', ...args);
    }
  }

  init() {
    this.log('SearchUIManager initialized');
    this.log('Target element found:', !!this.targetElement);
    this.log('Search trigger found:', !!this.searchTrigger);
    this.log('Search close trigger found:', !!this.searchCloseTrigger);
    this.log('Search elements:', Object.keys(this.searchElements));

    if (!this.targetElement) {
      console.warn('SearchUIManager: No target element found. Available selectors:', this.config.targetSelectors);
      return;
    }

    this.bindEvents();
    this.bindInputEvents();
  }

  bindEvents() {
    // 検索開くボタンのイベント
    if (this.searchTrigger) {
      const openHandler = (e) => {
        this.log('Search button clicked/touched');
        e.preventDefault();
        this.openSearch();
      };

      this.searchTrigger.addEventListener('click', openHandler);
      this.searchTrigger.addEventListener('touchend', openHandler);
      this.log('Events bound to search trigger');
    } else {
      console.warn('SearchUIManager: Search trigger element not found');
    }

    // 検索閉じるボタンのイベント
    if (this.searchCloseTrigger) {
      const closeHandler = (e) => {
        this.log('Search close button clicked/touched');
        e.preventDefault();
        this.closeSearch();
      };

      this.searchCloseTrigger.addEventListener('click', closeHandler);
      this.searchCloseTrigger.addEventListener('touchend', closeHandler);
      this.log('Events bound to search close trigger');
    } else {
      console.warn('SearchUIManager: Search close trigger element not found');
    }
  }

  /**
   * 検索UIを開く
   */
  openSearch() {
    this.log('openSearch called');
    if (this.targetElement) {
      this.targetElement.setAttribute(this.config.searchDataAttribute, this.config.searchDataValue);
      this.log(`${this.config.searchDataAttribute}="${this.config.searchDataValue}" set on`, this.targetElement.className);

      // カスタムイベントを発火
      this.dispatchEvent('searchui:open');
    }
  }

  /**
   * 検索UIを閉じる
   */
  closeSearch() {
    this.log('closeSearch called');
    if (this.targetElement) {
      this.targetElement.removeAttribute(this.config.searchDataAttribute);
      this.log(`${this.config.searchDataAttribute} removed from`, this.targetElement.className);

      // カスタムイベントを発火
      this.dispatchEvent('searchui:close');
    }
  }

  /**
   * 現在の検索UIの状態を取得
   * @returns {boolean} 検索UIが開いているかどうか
   */
  isSearchOpen() {
    return this.targetElement &&
           this.targetElement.getAttribute(this.config.searchDataAttribute) === this.config.searchDataValue;
  }

  /**
   * カスタムイベントを発火する
   * @param {string} eventName - イベント名
   */
  dispatchEvent(eventName) {
    const event = new CustomEvent(eventName, {
      detail: {
        targetElement: this.targetElement,
        isOpen: this.isSearchOpen(),
        config: this.config
      }
    });

    document.dispatchEvent(event);
  }

  /**
   * 現在の設定を更新
   * @param {Object} newConfig - 新しい設定オブジェクト
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log('Config updated:', this.config);
  }

  /**
   * イベントリスナーを削除してインスタンスを破棄
   */
  destroy() {
    // 検索トリガーのイベント削除
    if (this.searchTrigger) {
      this.searchTrigger.removeEventListener('click', this.openSearch);
      this.searchTrigger.removeEventListener('touchend', this.openSearch);
    }

    // 検索クローズトリガーのイベント削除
    if (this.searchCloseTrigger) {
      this.searchCloseTrigger.removeEventListener('click', this.closeSearch);
      this.searchCloseTrigger.removeEventListener('touchend', this.closeSearch);
    }

    // 入力フィールドのイベント削除
    Object.values(this.searchElements).forEach(({ input }) => {
      if (input) {
        ['input', 'change', 'blur'].forEach(eventType => {
          // 匿名関数で作成したハンドラーは削除できないため、
          // より適切には各ハンドラーを保存しておく必要がある
          input.removeEventListener(eventType, this.toggleLabel);
        });
      }
    });

    this.log('SearchUIManager destroyed');
  }
}
