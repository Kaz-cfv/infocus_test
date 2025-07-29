/**
 * メインJavaScriptファイル
 */

import { SliderManager } from './modules/SliderManager.js';
import { SearchManager } from './modules/SearchManager.js';
import { SearchUIManager } from './modules/SearchUIManager.js';
import { MenuManager } from './modules/MenuManager.js';
import { VideoManager } from './modules/VideoManager.js';
import { VideoScrollController } from './modules/VideoScrollController.js';
import { ShareButton } from './modules/ShareButton.js';
import { LenisManager } from './modules/LenisManager.js';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';
import { TeamDetail } from './pages/TeamDetail.js';
import { News } from './pages/News.js';

class App {
  constructor() {
    this.components = new Map();
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    try {
      this.initLenis();
      this.initSliders();
      this.initSearch();
      this.initSearchUI();
      this.initMenu();
      this.initVideo();
      this.initShareButtons();
      this.initHome();
      this.initAbout();
      this.initTeamDetail();
      this.initNews();
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }

  initLenis() {
    // 慣性スクロールは全ページで有効化
    this.components.set('lenis', new LenisManager());
  }

  initSliders() {
    const sliderElements = document.querySelectorAll('[data-slider]');
    if (sliderElements.length > 0) {
      this.components.set('slider', new SliderManager());
    }
  }

  initSearch() {
    const searchElements = document.querySelectorAll('[data-search]');
    if (searchElements.length > 0) {
      this.components.set('search', new SearchManager());
    }
  }

  initSearchUI() {
    // .js-searchまたは.js-search-closeが存在する場合のみ初期化
    const searchUIElements = document.querySelectorAll('.js-search, .js-search-close');
    if (searchUIElements.length > 0) {
      // デフォルト設定で初期化（ProjectsページとNewsページの両方に対応）
      // カスタム設定が必要な場合は、ページごとに設定を渡すことが可能
      this.components.set('searchUI', new SearchUIManager({
        debug: process.env.NODE_ENV === 'development' // 開発時のみデバッグログを有効化
      }));
    }
  }

  initMenu() {
    const menuElements = document.querySelectorAll('[data-menu]');
    if (menuElements.length > 0) {
      this.components.set('menu', new MenuManager());
    }
  }

  initVideo() {
    const videoElements = document.querySelectorAll('[data-video]');
    if (videoElements.length > 0) {
      this.components.set('video', new VideoManager());
    }
    // 動画カードのスクロール監視システムを初期化
    const videoCards = document.querySelectorAll('.c-project-card');
    if (videoCards.length > 0) {
      this.components.set('videoScroll', new VideoScrollController());
    }
  }

  initShareButtons() {
    const shareElements = document.querySelectorAll('[data-share]');
    if (shareElements.length > 0) {
      this.components.set('shareButton', new ShareButton());
    }
  }

  initHome() {
    // Home API Manager - トップページでのみ動作
    this.components.set('home', new Home());
  }

  initAbout() {
    // About Page Manager - Aboutページでのみ動作
    this.components.set('about', new About());
  }

  initTeamDetail() {
    // TeamDetail Page Manager - チーム詳細ページでのみ動作
    this.components.set('teamDetail', new TeamDetail());
  }

  initNews() {
    // News Page Manager - ニュースページでのみ動作
    this.components.set('news', new News());
  }
}

// グローバルにアプリインスタンスを作成
window.App = new App();

// 開発時のデバッグ用
if (process.env.NODE_ENV === 'development') {
  window.DEBUG = {
    app: window.App,
    components: window.App.components,
    lenis: window.App.components.get('lenis')
  };
}

// Lenisをグローバルに公開（他のコンポーネントからアクセス可能に）
window.lenis = window.App.components.get('lenis');
