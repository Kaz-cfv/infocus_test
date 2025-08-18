/**
 * AnchorLink Class with GSAP
 * 同一ページ内のアンカーリンクを管理するクラス
 * GSAPのScrollToPluginを使用した高品質なスクロールアニメーション
 */
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);
class AnchorLink {
  constructor(options = {}) {
    this.config = {
      headerSelector: '.l-header',
      anchorParamName: 'id',
      scrollDuration: 1,
      scrollOffset: 0,
      scrollEase: 'power2.inOut',
      autoKill: false,
      ...options
    };

    // 要素の取得
    this.header = document.querySelector(this.config.headerSelector);

    // 初期化
    this.init();
  }

  /**
   * 初期化メソッド
   */
  init() {
    // URLパラメータからのアンカーリンクを処理
    this.handleUrlAnchor();

    // クリックイベントの設定
    this.setupClickEvents();
  }

  /**
   * URLパラメータからアンカーリンクを処理
   */
  handleUrlAnchor() {
    const urlParams = new URLSearchParams(window.location.search);
    const anchorId = urlParams.get(this.config.anchorParamName);

    if (anchorId) {
      // DOM読み込み後にスクロール実行
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.scrollToAnchor(anchorId);
        });
      } else {
        // 少し遅延を入れて確実にレンダリング後にスクロール
        setTimeout(() => {
          this.scrollToAnchor(anchorId);
        }, 100);
      }
    }
  }

  /**
   * クリックイベントの設定
   */
  setupClickEvents() {
    // アンカーリンクのクリックイベントを設定
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[href*="id="]');
      if (!target) return;

      const href = target.getAttribute('href');
      const match = href.match(/id=([a-zA-Z0-9_-]+)/);

      if (match && match[1]) {
        const anchorId = match[1];
        const targetElement = document.getElementById(anchorId);

        if (targetElement) {
          event.preventDefault();
          this.scrollToAnchor(anchorId);
        }
      }
    });
  }

  /**
   * 指定されたアンカーIDにスクロール
   * @param {string} anchorId - アンカーID
   */
  scrollToAnchor(anchorId) {
    const targetElement = document.getElementById(anchorId);
    if (!targetElement) {
      console.warn(`アンカー要素が見つかりません: #${anchorId}`);
      return;
    }

    const headerHeight = this.header ? this.header.offsetHeight : 0;
    const targetPosition = targetElement.offsetTop - headerHeight - this.config.scrollOffset;

    // GSAPでスムーズスクロール
    gsap.to(window, {
      scrollTo: {
        y: targetPosition,
        autoKill: this.config.autoKill
      },
      duration: this.config.scrollDuration,
      ease: this.config.scrollEase,
      onComplete: () => {
        // スクロール完了時の処理
        this.onScrollComplete(anchorId);
      }
    });
  }

  /**
   * スクロール完了時の処理
   * @param {string} anchorId - アンカーID
   */
  onScrollComplete(anchorId) {
    // フォーカスを移動（アクセシビリティ対応）
    const targetElement = document.getElementById(anchorId);
    if (targetElement) {
      targetElement.focus();
    }

    // カスタムイベントの発火
    const customEvent = new CustomEvent('anchorScrollComplete', {
      detail: { anchorId }
    });
    document.dispatchEvent(customEvent);
  }

  /**
   * 設定を動的に更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.header = document.querySelector(this.config.headerSelector);
  }

  /**
   * 特定のアンカーにプログラムでスクロール
   * @param {string} anchorId - アンカーID
   */
  scrollTo(anchorId) {
    this.scrollToAnchor(anchorId);
  }

  /**
   * 現在のスクロール位置を取得
   * @returns {number} 現在のスクロール位置
   */
  getCurrentScrollPosition() {
    return window.pageYOffset || document.documentElement.scrollTop;
  }

  /**
   * ヘッダーの高さを再取得
   */
  refreshHeaderHeight() {
    this.header = document.querySelector(this.config.headerSelector);
  }
}

export default AnchorLink;
