/**
 * News Pagination Manager
 * ニュース一覧のページネーション機能を管理
 */

export class NewsPaginationManager {
  constructor(apiManager) {
    this.apiManager = apiManager;
    this.currentPage = 1;
    this.totalItems = 0;
    this.totalPages = 0;
    this.paginationContainer = null;

    // 検索状態
    this.isSearchMode = false;
    this.currentSearchQuery = '';

    // ページネーション設定
    this.config = {
      itemsPerPage: 14,
      maxVisiblePages: 5,
      skipCount: 4 // 先頭から除外する件数
    };

    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.paginationContainer = document.querySelector('.pagination-container');
    this.bindEvents();
  }

  /**
   * イベントリスナーの設定
   */
  bindEvents() {
    document.addEventListener('click', (e) => {
      const pageButton = e.target.closest('[data-pagination-page]');
      if (pageButton) {
        e.preventDefault();
        const page = parseInt(pageButton.dataset.paginationPage);
        this.goToPage(page);
        return;
      }

      const arrowButton = e.target.closest('[data-pagination]');
      if (arrowButton) {
        e.preventDefault();
        const direction = arrowButton.dataset.pagination;

        if (direction === 'prev') {
          this.hidePickupArea();
          this.goToPreviousPage();
        } else if (direction === 'next') {
          this.hidePickupArea();
          this.goToNextPage();
        }
      }
    });
  }

  /**
   * 総ページ数を取得
   * 先頭4件を除いた計算
   */
  async fetchTotalPages() {
    try {
      const testEndpoint = `${this.apiManager.baseEndpoint}?lang=${this.apiManager.currentLanguage}&per_page=1&page=1`;

      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const totalItems = parseInt(response.headers.get('X-WP-Total') || '0');

      // 先頭4件を除いた実際のページネーション対象件数
      const paginationItems = Math.max(0, totalItems - this.config.skipCount);

      // ページ数を計算
      const totalPages = Math.ceil(paginationItems / this.config.itemsPerPage);

      this.totalItems = totalItems;
      this.totalPages = Math.max(1, totalPages);

      return {
        totalItems: this.totalItems,
        totalPages: this.totalPages,
        paginationItems
      };

    } catch (error) {
      console.error('❌ 総ページ数取得エラー:', error);
      this.totalItems = 18;
      this.totalPages = 1;
      return {
        totalItems: this.totalItems,
        totalPages: this.totalPages,
        paginationItems: 14
      };
    }
  }

  /**
   * ページネーションの表示状態を更新
   */
  async updatePaginationDisplay(newsData = []) {
    const { totalItems, totalPages, paginationItems } = await this.fetchTotalPages();

    if (totalPages <= 1) {
      this.hidePagination();
    } else {
      this.showPagination();
      this.renderPagination(totalPages);
    }
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
   */
  renderPagination(totalPages) {
    const paginationNav = document.querySelector('.c-pagination');
    if (!paginationNav) {
      console.warn('⚠️ ページネーションコンテナが見つかりません');
      return;
    }

    const paginationList = paginationNav.querySelector('.c-pagination__index');
    if (!paginationList) return;

    paginationList.innerHTML = '';
    this.createModernPagination(paginationList, totalPages);
  }

  /**
   * モダンなページネーションUIを生成
   */
  createModernPagination(container, totalPages) {
    const prevButton = this.createPrevButton();
    container.appendChild(prevButton);

    const pageNumbers = this.generateSmartPageNumbers(totalPages);
    pageNumbers.forEach(item => container.appendChild(item));

    const nextButton = this.createNextButton(totalPages);
    container.appendChild(nextButton);
  }

  /**
   * Prevボタンを作成
   */
  createPrevButton() {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'prev');

    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Prev';

    if (this.currentPage <= 1) {
      link.style.pointerEvents = 'none';
      link.style.opacity = '0.3';
    }

    li.appendChild(link);
    return li;
  }

  /**
   * Nextボタンを作成
   */
  createNextButton(totalPages) {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'next');

    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Next';

    if (this.currentPage >= totalPages) {
      link.style.pointerEvents = 'none';
      link.style.opacity = '0.3';
    }

    li.appendChild(link);
    return li;
  }

  /**
   * 賢いページ番号生成ロジック
   */
  generateSmartPageNumbers(totalPages) {
    const pages = [];
    const current = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(this.createPageItem(i));
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(this.createPageItem(i));
        }
        pages.push(this.createDottedItem());
        pages.push(this.createPageItem(totalPages));
      } else if (current >= totalPages - 3) {
        pages.push(this.createPageItem(1));
        pages.push(this.createDottedItem());
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(this.createPageItem(i));
        }
      } else {
        pages.push(this.createPageItem(1));
        pages.push(this.createDottedItem());
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(this.createPageItem(i));
        }
        pages.push(this.createDottedItem());
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
      const span = document.createElement('span');
      span.textContent = pageNumber;
      li.appendChild(span);
    } else {
      li.setAttribute('data-pagination-page', pageNumber);
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = pageNumber;
      li.appendChild(link);
    }

    return li;
  }

  /**
   * 省略記号を作成
   */
  createDottedItem() {
    const li = document.createElement('li');
    li.setAttribute('data-pagination', 'dotted');
    const span = document.createElement('span');
    span.textContent = '...';
    li.appendChild(span);
    return li;
  }

  /**
   * 検索モードを設定
   * @param {string} query - 検索クエリ
   * @param {Object} searchResult - 検索結果
   */
  setSearchMode(query, searchResult) {
    this.isSearchMode = true;
    this.currentSearchQuery = query;
    this.totalItems = searchResult.totalItems;
    this.totalPages = searchResult.totalPages;
    this.currentPage = searchResult.currentPage;

    // console.log('🔍 検索モードを設定:', {
    //   query,
    //   totalItems: this.totalItems,
    //   totalPages: this.totalPages,
    //   currentPage: this.currentPage
    // });

    // ページネーションを表示・更新
    if (this.totalPages > 1) {
      this.showPagination();
      this.renderPagination(this.totalPages);
    } else {
      this.hidePagination();
    }
  }

  /**
   * 検索モードを解除
   */
  clearSearchMode() {
    this.isSearchMode = false;
    this.currentSearchQuery = '';

    // console.log('🔄 検索モードを解除');
  }

  /**
   * 指定ページに移動
   */
  async goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    try {
      this.showLoading();

      // 検索モードか通常モードかで処理を分岐
      if (this.isSearchMode) {
        // 検索結果のページング
        await this.goToSearchPage(page);
      } else {
        // 通常のページング
        await this.goToNormalPage(page);
      }

      this.renderPagination(this.totalPages);
      this.updateURL(page);
      this.scrollToTop();

    } catch (error) {
      console.error('❌ ページ移動エラー:', error);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * 検索結果のページ移動
   * @param {number} page - ページ番号
   */
  async goToSearchPage(page) {
    // console.log(`🔍 検索結果のページ${page}に移動`);

    const searchResult = await this.apiManager.fetchSearchResults(
      this.currentSearchQuery,
      page,
      this.config.itemsPerPage
    );

    this.currentPage = page;

    // 検索結果を表示
    await this.apiManager.renderNewsComponents(searchResult.data);

    // ピックアップエリアを非表示に保つ
    this.hidePickupArea();
  }

  /**
   * 通常のページ移動
   * @param {number} page - ページ番号
   */
  async goToNormalPage(page) {
    this.apiManager.paginationConfig.currentPage = page;
    this.apiManager.apiEndpoint = this.apiManager.buildAPIEndpoint();
    this.currentPage = page;

    const newsData = await this.apiManager.fetchNewsData();
    await this.apiManager.renderNewsComponents(newsData);
  }

  /**
   * ピックアップエリアを非表示
   */
  hidePickupArea() {
    const pickupSection = document.querySelector('[data-pickup-section]');
    if (pickupSection) {
      pickupSection.style.display = 'none';
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
    if (this.currentPage < this.totalPages) {
      await this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * URLを更新
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
    // メインコンテンツリストの要素を取得
    const mainContentList = document.querySelector('.p-news-content__list');

    if (mainContentList) {
      // ヘッダー高さを取得（レスポンシブ対応）
      const headerOffset = this.getHeaderOffset();

      if (window.lenis) {
        // Lenisを使ったスムーススクロール
        window.lenis.scrollTo(mainContentList, {
          duration: 1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          offset: -headerOffset
        });
      } else {
        // フォールバック: 要素の位置を計算してスクロール
        const elementTop = mainContentList.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      // フォールバック: ヘッダー高さ分だけ下げてスクロール
      const headerOffset = this.getHeaderOffset();

      if (window.lenis) {
        window.lenis.scrollTo(headerOffset, {
          duration: 1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        window.scrollTo({ top: headerOffset, behavior: 'smooth' });
      }
    }
  }

  /**
   * 現在のブレイクポイントに応じたヘッダーオフセットを取得
   */
  getHeaderOffset() {
    // ウィンドウ幅でPC/SP判定
    const windowWidth = window.innerWidth;

    // SPブレイクポイント（通常768px以下）
    const isSmartPhone = windowWidth <= 768;

    return isSmartPhone ? 72 : 53.41;
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
   * URLパラメータから初期ページを設定
   */
  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');

    if (pageParam) {
      const page = parseInt(pageParam);
      if (!isNaN(page) && page > 0) {
        this.currentPage = page;
        this.apiManager.paginationConfig.currentPage = page;
        this.apiManager.apiEndpoint = this.apiManager.buildAPIEndpoint();
      }
    }
  }

  /**
   * 現在の状態を取得
   */
  getCurrentState() {
    return {
      currentPage: this.currentPage,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      skipCount: this.config.skipCount,
      timestamp: new Date().toISOString()
    };
  }
}
