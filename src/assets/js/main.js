/**
 * メインJavaScriptファイル
 */

import { ViewManager } from './modules/ViewManager.js';
import { SliderManager } from './modules/SliderManager.js';
import { SearchManager } from './modules/SearchManager.js';
import { SearchUIManager } from './modules/SearchUIManager.js';
import { MenuManager } from './modules/MenuManager.js';
import { VideoScrollController } from './modules/VideoScrollController.js';
import { ShareButton } from './modules/ShareButton.js';
import { LenisManager } from './modules/LenisManager.js';
import { NavigationHover } from './modules/NavigationHover.js';
import AnchorLink from './modules/AnchorLink.js';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';
import { TeamDetail } from './pages/TeamDetail.js';
import { Career } from './pages/Career.js';
import { Jobs } from './pages/Jobs.js';
import Contact from './pages/Contact.js';
import { News } from './pages/News.js';
import { Projects } from './pages/Projects.js';
import { ProjectDetail } from './pages/ProjectDetail.js';
import { Team } from './pages/Team.js';
import { ApiTest } from './modules/ApiTest.js';

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
      this.initViewManager();
      this.initLenis();
      this.initSliders();
      this.initSearch();
      this.initSearchUI();
      this.initMenu();
      this.initVideoScrollController();
      this.initShareButtons();
      this.initNavigationHover();
      this.initAnchorLink();
      this.initHome();
      this.initAbout();
      this.initTeamDetail();
      this.initCareer();
      this.initJobs();
      this.initContact();
      this.initNews();
      this.initProjects();
      this.initProjectDetail();
      this.initTeam();
      this.initApiTest();
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }

  initViewManager() {
    // ページ内にメインコンテンツが存在する場合のみ初期化
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      this.components.set('viewManager', new ViewManager());
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
      const searchManager = new SearchManager();
      this.components.set('search', searchManager);
      // グローバルに公開（Projects.jsからアクセスできるように）
      window.searchManager = searchManager;
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

  initVideoScrollController() {
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

  initNavigationHover() {
    const hoverContainer = document.querySelector('.js-hover');
    if (hoverContainer) {
      this.components.set('navigationHover', new NavigationHover());
    }
  }

  initAnchorLink() {
    this.components.set('anchorLink', new AnchorLink());
  }

  initHome() {
    this.components.set('home', new Home());
  }

  initAbout() {
    this.components.set('about', new About());
  }

  initTeamDetail() {
    this.components.set('teamDetail', new TeamDetail());
  }

  initCareer() {
    this.components.set('career', new Career());
  }

  initJobs() {
    this.components.set('jobs', new Jobs());
  }

  initContact() {
    this.components.set('contact', new Contact());
  }

  initNews() {
    this.components.set('news', new News());
  }

  initProjects() {
    this.components.set('projects', new Projects());
  }

  initProjectDetail() {
    this.components.set('projectDetail', new ProjectDetail());
  }

  initTeam() {
    this.components.set('team', new Team());
  }

  initApiTest() {
    const apiTestButton = document.getElementById('testApiButton');
    if (apiTestButton) {
      this.components.set('apiTest', new ApiTest());
    }
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
