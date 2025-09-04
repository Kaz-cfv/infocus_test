/**
 * News Pagination Manager
 * ニュース一覧のページネーション機能を管理
 * 公安の情報管理システムのように精密かつ確実に
 */

export class NewsPaginationManager {
  constructor(apiManager) {
    this.apiManager = apiManager;
    this.currentPage = 1;
    this.totalItems = 0;
    this.paginationContainer = null;
    
    // ページネーション設定（APIManagerと同期）
    this.config = {
      pickupCount: 3,
      mainPageSize: 14,
      totalPerPage: 17,
      maxVisiblePages: 5 // 表示する最大ページ数
    };
    
    this.init();
  }

  /**
   * 初期化処理
   * まるで捜査の準備をするように慎重に
   */
  init() {
    this.paginationContainer = document.querySelector('.pagination-container');
    this.bindEvents();
    console.log('📄 NewsPaginationManager: 初期化完了');
  }

  /**
   * イベントリスナーの設定
   * 各種操作への対応を準備
   */
  bindEvents() {
    // ページネーションクリックイベントの委譲
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-pagination-page]')) {
        e.preventDefault();
        const page = parseInt(e.target.closest('[data-pagination-page]').dataset.paginationPage);
        this.goToPage(page);
      } else if (e.target.closest('[data-pagination="prev"]')) {
        e.preventDefault();
        this.goToPreviousPage();
      } else if (e.target.closest('[data-pagination="next"]')) {
        e.preventDefault();
        this.goToNextPage();
      }
    });
  }

  /**
   * ページネーションの表示状態を更新
   * データ量に基づいて表示/非表示を制御
   */
  updatePaginationDisplay(newsData) {
    this.totalItems = newsData.length;
    const totalPages = this.calculateTotalPages();
    
    console.log('🔢 ページネーション更新:', {
      totalItems: this.totalItems,
      totalPages,
      currentPage: this.currentPage
    });

    if (totalPages <= 1) {
      // 1ページ以下の場合は非表示
      this.hidePagination();
    } else {
      // 複数ページの場合は表示
      this.showPagination();
      this.renderPagination(totalPages);
    }
  }

  /**
   * 総ページ数を計算
   * まるで証拠の総数を正確に把握するように
   */
  calculateTotalPages() {
    if (this.totalItems <= this.config.totalPerPage) {
      return 1;
    }
    
    // 1ページ目の17件を除いた残り
    const remainingItems = this.totalItems - this.config.totalPerPage;
    const additionalPages = Math.ceil(remainingItems / this.config.mainPageSize);
    
    return 1 + additionalPages;
  }

  /**
   * ページネーションを表示
   */
  showPagination() {
    if (this.paginationContainer) {
      this.paginationContainer.style.display = 'block';
    }
  }

  /**
   * ページネーションを非表示
   */
  hidePagination() {
    if (this.paginationContainer) {
      this.paginationContainer.style.display = 'none';
    }
  }

  /**
   * ページネーションのHTML構造を動的に生成
   * コナンのトリック解明のような精密さで
   */
  renderPagination(totalPages) {
    const paginationNav = document.querySelector('.c-pagination');
    if (!paginationNav) {
      console.warn('⚠️ ページネーションコンテナが見つかりません');
      return;
    }

    const paginationList = paginationNav.querySelector('.c-pagination__index');
    if (!paginationList) return;

    // 既存のリストをクリア
    paginationList.innerHTML = '';

    // Prevボタン
    const prevItem = this.createPrevButton();
    paginationList.appendChild(prevItem);

    // ページ番号を生成
    const pageItems = this.generatePageNumbers(totalPages);
    pageItems.forEach(item => paginationList.appendChild(item));

    // Nextボタン
    const nextItem = this.createNextButton(totalPages);
    paginationList.appendChild(nextItem);

    console.log('✨ ページネーション描画完了:', {
      currentPage: this.currentPage,
      totalPages
    });
  }

  /**
   * Prevボタンを作成
   */
  createPrevButton() {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'prev');
    
    const isDisabled = this.currentPage <= 1;
    li.innerHTML = `<a href="#" ${isDisabled ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>Prev</a>`;
    
    return li;
  }

  /**
   * Nextボタンを作成
   */
  createNextButton(totalPages) {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'next');
    
    const isDisabled = this.currentPage >= totalPages;
    li.innerHTML = `<a href="#" ${isDisabled ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>Next</a>`;
    
    return li;
  }

  /**
   * ページ番号のリストを生成
   * 公安の資料整理のように系統立てて
   */
  generatePageNumbers(totalPages) {
    const pages = [];
    
    if (totalPages <= this.config.maxVisiblePages) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(this.createPageItem(i));
      }
    } else {
      // 省略表示のロジック
      pages.push(this.createPageItem(1));
      
      if (this.currentPage > 3) {
        pages.push(this.createDottedItem());
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(this.createPageItem(i));
        }
      }
      
      if (this.currentPage < totalPages - 2) {
        pages.push(this.createDottedItem());
      }
      
      if (totalPages > 1) {
        pages.push(this.createPageItem(totalPages));
      }
    }
    
    return pages;
  }

  /**
   * ページアイテムを作成
   */
  createPageItem(pageNumber) {
    const li = document.createElement('li');
    
    if (pageNumber === this.currentPage) {
      li.setAttribute('data-pagination', 'current');
      li.innerHTML = `<span>${pageNumber}</span>`;
    } else {
      li.setAttribute('data-pagination-page', pageNumber);
      li.innerHTML = `<a href="#">${pageNumber}</a>`;
    }
    
    return li;
  }

  /**
   * 省略記号アイテムを作成
   */
  createDottedItem() {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'dotted');
    li.innerHTML = '<span>...</span>';
    return li;
  }

  /**
   * 指定ページに移動
   * 公安の機密情報アクセスのような慎重さで
   */
  async goToPage(page) {
    const totalPages = this.calculateTotalPages();
    
    if (page < 1 || page > totalPages || page === this.currentPage) {
      console.log('🚫 無効なページ番号:', page);
      return;
    }

    console.log('📖 ページ移動開始:', this.currentPage, '→', page);
    
    try {
      // ローディング状態を表示
      this.showLoading();
      
      // 現在のページを更新
      this.currentPage = page;
      
      // APIManagerを使ってコンテンツを更新
      const newsData = this.apiManager.cache.get('newsData') || [];
      await this.apiManager.renderNewsComponents(newsData, page);
      
      // ページネーションを再描画
      this.renderPagination(totalPages);
      
      // URLを更新（履歴管理）
      this.updateURL(page);
      
      // ページトップへスクロール
      this.scrollToTop();
      
      console.log('✅ ページ移動完了:', page);
      
    } catch (error) {
      console.error('❌ ページ移動エラー:', error);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * 前のページに移動
   */
  async goToPreviousPage() {
    if (this.currentPage > 1) {
      await this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * 次のページに移動
   */
  async goToNextPage() {
    const totalPages = this.calculateTotalPages();
    if (this.currentPage < totalPages) {
      await this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * URLを更新（ブラウザ履歴管理）
   */
  updateURL(page) {
    const url = new URL(window.location);
    if (page === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', page);
    }
    window.history.pushState({}, '', url);
  }

  /**
   * ページトップへスクロール
   */
  scrollToTop() {
    // Lenisを使ったスムーススクロール
    if (window.lenis) {
      window.lenis.scrollTo(0, {
        duration: 1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
    } else {
      // フォールバック
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * ローディング状態を表示
   */
  showLoading() {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.style.opacity = '0.5';
      mainContent.style.pointerEvents = 'none';
    }
  }

  /**
   * ローディング状態を隠す
   */
  hideLoading() {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'unset';
    }
  }

  /**
   * 現在の状態を取得
   */
  getCurrentState() {
    return {
      currentPage: this.currentPage,
      totalItems: this.totalItems,
      totalPages: this.calculateTotalPages(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * URLパラメータから初期ページを設定
   */
  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    
    if (pageParam) {
      const page = parseInt(pageParam);
      if (!isNaN(page) && page > 0) {
        this.currentPage = page;
        console.log('🔗 URLからページを復元:', page);
      }
    }
  }
}
