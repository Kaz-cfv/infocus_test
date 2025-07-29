/**
 * Lenis（慣性スクロール）管理クラス
 *
 */

import Lenis from 'lenis';

export class LenisManager {
  constructor(options = {}) {
    this.lenis = null;
    this.isDestroyed = false;

    // デフォルト設定
    this.defaultOptions = {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      direction: 'vertical',
      smooth: true,
      smoothTouch: true,
      touchMultiplier: 2,
      infinite: false,
      ...options
    };

    this.init();
  }

  init() {
    try {
      this.createLenis();
      this.bindEvents();
      this.startRAF();
    } catch (error) {
      console.error('LenisManager initialization error:', error);
    }
  }

  createLenis() {
    this.lenis = new Lenis(this.defaultOptions);

    // HTMLにクラスを追加
    document.documentElement.classList.add('lenis');

    // Lenisの状態に応じたクラス管理
    this.lenis.on('scroll', (e) => {
      document.documentElement.classList.toggle('lenis-scrolling', e.velocity !== 0);
    });
  }

  bindEvents() {
    // スクロール停止時のイベントハンドリング
    this.lenis.on('scroll', this.handleScroll.bind(this));

    // ウィンドウリサイズ時の再計算
    window.addEventListener('resize', this.handleResize.bind(this));

    // ページ遷移時の初期化
    document.addEventListener('astro:page-load', this.handlePageLoad.bind(this));
  }

  handleScroll(e) {
    // スクロール位置を他のコンポーネントで利用できるように
    // カスタムイベントを発火
    document.dispatchEvent(new CustomEvent('lenisScroll', {
      detail: {
        scroll: e.scroll,
        limit: e.limit,
        velocity: e.velocity,
        direction: e.direction,
        progress: e.progress
      }
    }));
  }

  handleResize() {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.resize();
    }
  }

  handlePageLoad() {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.scrollTo(0, { immediate: true });
    }
  }

  startRAF() {
    const raf = (time) => {
      if (this.lenis && !this.isDestroyed) {
        this.lenis.raf(time);
      }
      if (!this.isDestroyed) {
        requestAnimationFrame(raf);
      }
    };
    requestAnimationFrame(raf);
  }

  // 公開API
  scrollTo(target, options = {}) {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.scrollTo(target, options);
    }
  }

  stop() {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.stop();
      document.documentElement.classList.add('lenis-stopped');
    }
  }

  start() {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.start();
      document.documentElement.classList.remove('lenis-stopped');
    }
  }

  destroy() {
    if (this.lenis && !this.isDestroyed) {
      this.lenis.destroy();
      this.isDestroyed = true;
      document.documentElement.classList.remove('lenis', 'lenis-scrolling', 'lenis-stopped');

      // イベントリスナーの削除
      window.removeEventListener('resize', this.handleResize.bind(this));
      document.removeEventListener('astro:page-load', this.handlePageLoad.bind(this));
    }
  }

  // ゲッター
  get scrollProgress() {
    return this.lenis ? this.lenis.progress : 0;
  }

  get scrollDirection() {
    return this.lenis ? this.lenis.direction : 0;
  }

  get scrollVelocity() {
    return this.lenis ? this.lenis.velocity : 0;
  }
}
