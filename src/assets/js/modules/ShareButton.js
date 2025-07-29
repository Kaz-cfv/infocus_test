/**
 * シェアボタン機能を管理するクラス
 * Instagram、X（旧Twitter）、URLコピー機能を提供
 */

export class ShareButton {
  constructor() {
    this.shareButtons = null;
    this.currentUrl = '';
    this.currentTitle = '';
    this.tooltip = null;
    this.tooltipTimeout = null;

    this.init();
  }

  init() {
    // data-share属性を持つ要素を取得
    this.shareButtons = document.querySelectorAll('[data-share]');

    if (!this.shareButtons.length) {
      console.warn('ShareButton: シェアボタンが見つかりません');
      return;
    }

    this.getCurrentPageInfo();
    this.bindEvents();
    this.createTooltip();
  }

  /**
   * 現在のページ情報を取得
   */
  getCurrentPageInfo() {
    this.currentUrl = window.location.href;
    this.currentTitle = document.title || '';
  }

  /**
   * イベントリスナーをバインド
   */
  bindEvents() {
    this.shareButtons.forEach(button => {
      const link = button.querySelector('a');
      if (!link) return;

      // js-share-btnクラスを追加
      link.classList.add('js-share-btn');

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const shareType = button.dataset.share;
        this.handleShare(shareType, button);
      });

      // キーボードアクセシビリティ
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const shareType = button.dataset.share;
          this.handleShare(shareType, button);
        }
      });
    });
  }

  /**
   * シェア処理のメインハンドラー
   * @param {string} shareType - シェアの種類
   * @param {Element} buttonElement - クリックされたボタン要素
   */
  handleShare(shareType, buttonElement) {
    switch (shareType) {
      case 'instagram':
        this.shareToInstagram();
        break;
      case 'x':
        this.shareToX();
        break;
      case 'copy':
        this.copyUrlToClipboard(buttonElement);
        break;
      default:
        console.warn(`ShareButton: 未知のシェアタイプ: ${shareType}`);
    }

    // カスタムイベント発火
    this.dispatchCustomEvent('shareClicked', {
      shareType,
      url: this.currentUrl,
      title: this.currentTitle
    });
  }

  /**
   * Instagramシェア
   * InstagramはWeb共有に対応していないため、Instagramアプリを開く
   */
  shareToInstagram() {
    try {
      // モバイルデバイスの場合はInstagramアプリを試行
      if (this.isMobileDevice()) {
        const instagramUrl = `instagram://camera`;
        window.open(instagramUrl, '_blank');

        // フォールバック: 2秒後にInstagram Webサイトを開く
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        }, 2000);
      } else {
        // デスクトップの場合はInstagram Webサイトを開く
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Instagram共有エラー:', error);
      // エラー時のフォールバック
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * X（旧Twitter）シェア
   */
  shareToX() {
    try {
      const text = encodeURIComponent(this.currentTitle);
      const url = encodeURIComponent(this.currentUrl);
      const xShareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

      window.open(xShareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    } catch (error) {
      console.error('X共有エラー:', error);
    }
  }

  /**
   * URLをクリップボードにコピー
   * @param {Element} buttonElement - クリックされたボタン要素
   */
  async copyUrlToClipboard(buttonElement) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // モダンブラウザのClipboard API
        await navigator.clipboard.writeText(this.currentUrl);
      } else {
        // フォールバック: 古いブラウザ対応
        const textArea = document.createElement('textarea');
        textArea.value = this.currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '1';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // ツールチップ表示
      this.showTooltip(buttonElement, 'クリップボードにコピーしました。');

      // 成功のカスタムイベント発火
      this.dispatchCustomEvent('urlCopied', {
        url: this.currentUrl
      });

    } catch (error) {
      console.error('URLコピーエラー:', error);

      // エラー時のツールチップ表示
      this.showTooltip(buttonElement, 'コピーに失敗しました。');

      // エラーのカスタムイベント発火
      this.dispatchCustomEvent('urlCopyError', {
        error: error.message
      });
    }
  }

  /**
   * ツールチップ要素を作成
   */
  createTooltip() {
    // Astroファイル内のツールチップを使用
    this.tooltip = document.getElementById('shareTooltip');

    if (!this.tooltip) {
      console.warn('ShareButton: ツールチップ要素が見つかりません');
      return;
    }
  }

  /**
   * ツールチップを表示
   * @param {Element} targetElement - ツールチップの対象要素
   * @param {string} message - 表示するメッセージ
   */
  showTooltip(targetElement, message) {
    if (!this.tooltip) return;

    // 既存のタイマーをクリア
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }

    // メッセージを設定
    const tooltipText = this.tooltip.querySelector('.p-news-detail__share-tooltip-text');
    if (tooltipText) {
      tooltipText.textContent = message;
    }

    // シンプルな表示（クラス付与のみ）
    this.tooltip.classList.add('is-visible');

    // 3秒後に非表示
    this.tooltipTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 3000);
  }

  /**
   * ツールチップを非表示
   */
  hideTooltip() {
    if (!this.tooltip) return;

    // シンプルな非表示（クラス除去のみ）
    this.tooltip.classList.remove('is-visible');

    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
  }

  /**
   * モバイルデバイスかどうかを判定
   * @returns {boolean}
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * カスタムイベントを発火
   * @param {string} eventName - イベント名
   * @param {Object} detail - イベントの詳細データ
   */
  dispatchCustomEvent(eventName, detail = {}) {
    const customEvent = new CustomEvent(`shareButton:${eventName}`, {
      detail: {
        ...detail,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(customEvent);
  }

  /**
   * 現在のページ情報を再取得（動的ページ用）
   */
  refreshPageInfo() {
    this.getCurrentPageInfo();
  }

  /**
   * ShareButtonインスタンスを破棄
   */
  destroy() {
    // イベントリスナーを除去
    this.shareButtons.forEach(button => {
      const link = button.querySelector('a');
      if (link) {
        link.classList.remove('js-share-btn');
        // イベントリスナーの除去は複製を保持していないため、
        // 新しいクローンで置き換える方法を使用
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
      }
    });

    // ツールチップを除去（シンプルにクラス除去）
    if (this.tooltip) {
      this.tooltip.classList.remove('is-visible');
    }

    // タイマーをクリア
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }

    // プロパティをリセット
    this.shareButtons = null;
    this.tooltip = null;
    this.tooltipTimeout = null;
  }
}
