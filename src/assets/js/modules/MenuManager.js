/**
 * ヘッダーメニュー機能を管理するクラス
 * ハンバーガーメニューの開閉とスクロール時の状態変更を制御
 */

export class MenuManager {
  constructor() {
    this.hamburgerBtn = null;
    this.header = null;
    this.menu = null;
    this.menuInner = null;
    this.isMenuOpen = false;
    this.isScrolled = false;
    this.scrollThreshold = 100; // スクロール判定の閾値
    this.lastScrollY = 0;

    this.init();
  }

  init() {
    this.hamburgerBtn = document.querySelector('.l-header__hamburger');
    this.header = document.querySelector('.l-header');
    this.menu = document.querySelector('.l-menu');
    this.menuInner = document.querySelector('.l-menu__inner');

    if (!this.hamburgerBtn || !this.header || !this.menu || !this.menuInner) {
      console.warn('HeaderMenuManager: 必要な要素が見つかりません');
      return;
    }

    this.bindEvents();
    this.handleScrollState();
  }

  bindEvents() {
    // ハンバーガーメニューのクリックイベント
    this.hamburgerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMenu();
    });

    // キーボードアクセシビリティ
    this.hamburgerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMenu();
      }
    });

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    // スクロールイベント
    window.addEventListener('scroll', () => {
      this.handleScrollState();
    }, { passive: true });

    // メニュー外クリックで閉じる
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen) {
        const target = e.target;
        if (!this.hamburgerBtn.contains(target) && !this.menuInner.contains(target)) {
          this.closeMenu();
        }
      }
    });

    // リサイズ時の処理（モバイル→PC切り替え時など）
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isMenuOpen = true;

    this.header.classList.add('is-opened');
    this.menu.classList.add('is-opened');

    // スクロール防止
    document.body.classList.add('menu-open');

    // アクセシビリティ属性設定
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');
    this.menu.setAttribute('aria-hidden', 'false');

    // フォーカス管理
    const firstFocusable = this.menu.querySelector('a, button, input, textarea, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // カスタムイベント発火
    this.dispatchCustomEvent('menuOpen');
  }

  closeMenu() {
    this.isMenuOpen = false;

    this.header.classList.remove('is-opened');
    this.menu.classList.remove('is-opened');

    // スクロール復活
    document.body.classList.remove('menu-open');

    // アクセシビリティ属性設定
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('aria-hidden', 'true');

    // フォーカスをハンバーガーボタンに戻す
    this.hamburgerBtn.focus();

    // カスタムイベント発火
    this.dispatchCustomEvent('menuClose');
  }

  handleScrollState() {
    const currentScrollY = window.scrollY;
    const shouldBeScrolled = currentScrollY > this.scrollThreshold;

    // スクロール状態が変わった場合のみ処理
    if (shouldBeScrolled !== this.isScrolled) {
      this.isScrolled = shouldBeScrolled;

      if (this.isScrolled) {
        this.header.classList.add('is-scrolled');
      } else {
        this.header.classList.remove('is-scrolled');
      }

      // カスタムイベント発火
      this.dispatchCustomEvent(this.isScrolled ? 'headerScrolled' : 'headerUnscrolled');
    }

    this.lastScrollY = currentScrollY;
  }

  handleResize() {
    const pcBreakpoint = 960;

    if (window.innerWidth >= pcBreakpoint && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  dispatchCustomEvent(eventName) {
    const customEvent = new CustomEvent(`headerMenu:${eventName}`, {
      detail: {
        isMenuOpen: this.isMenuOpen,
        isScrolled: this.isScrolled,
        header: this.header,
        menu: this.menu
      }
    });

    document.dispatchEvent(customEvent);
  }

  getState() {
    return {
      isMenuOpen: this.isMenuOpen,
      isScrolled: this.isScrolled
    };
  }

  forceCloseMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    }
  }

  forceOpenMenu() {
    if (!this.isMenuOpen) {
      this.openMenu();
    }
  }

  destroy() {
    if (this.isMenuOpen) {
      this.closeMenu();
    }

    if (this.hamburgerBtn) {
      this.hamburgerBtn.removeEventListener('click', this.toggleMenu);
      this.hamburgerBtn.removeEventListener('keydown', this.toggleMenu);
    }

    document.removeEventListener('keydown', this.closeMenu);
    document.removeEventListener('click', this.closeMenu);
    window.removeEventListener('scroll', this.handleScrollState);
    window.removeEventListener('resize', this.handleResize);

    this.hamburgerBtn = null;
    this.header = null;
    this.menu = null;
  }
}
