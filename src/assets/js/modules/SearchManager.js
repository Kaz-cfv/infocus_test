/**
 * 検索機能を管理するクラス
 * WordPress APIから取得したデータの検索機能を提供
 * 汎用化対応版
 */

export class SearchManager {
  constructor() {
    this.searchElements = document.querySelectorAll('[data-search]');
    this.searchData = [];
    this.allProjectsData = []; // 全プロジェクトデータを保持
    this.currentResults = [];
    this.currentQuery = ''; // 現在の検索クエリを保持
    this.useClientSideSearch = false; // クライアント側検索を使用するフラグ
    this.init();
  }

  init() {
    if (this.searchElements.length > 0) {
      this.bindEvents();
      this.setupProjectsDataListener();
    } else {
      console.log('🔍 検索要素が見つかりませんでした');
    }
  }

  /**
   * プロジェクトデータの読み込みを監視
   */
  setupProjectsDataListener() {
    document.addEventListener('projectsDataLoaded', (event) => {
      this.allProjectsData = event.detail || [];
      this.useClientSideSearch = true;
      // console.log(`✅ SearchManager: プロジェクトデータ受信完了 (${this.allProjectsData.length}件)`);
    });
  }

  bindEvents() {
    // 検索入力フィールドを取得
    const searchInputPC = document.querySelector('#search_category');
    const searchInputSP = document.querySelector('#search_category_sp');
    const searchButton = document.querySelector('.js-search-btn[data-btn="open"]');

    // PC用検索フィールドのエンターキー処理
    if (searchInputPC) {
      searchInputPC.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = e.target.value.trim();
          this.performSearch(query, 'pc-enter');
        }
      });
    }

    // SP用検索フィールドのエンターキー処理
    if (searchInputSP) {
      searchInputSP.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = e.target.value.trim();
          this.performSearch(query, 'sp-enter');
        }
      });
    }

    // 検索ボタンのクリック処理
    if (searchButton) {
      searchButton.addEventListener('click', (e) => {
        // デバイス判定（SP用）
        const isMobile = window.innerWidth <= 768;

        // SPの検索UIが開いているかどうかを確認
        const projectHead = document.querySelector('.p-project-head');
        const currentDataType = projectHead ? projectHead.getAttribute('data-type') : '';
        const isSearchMode = currentDataType === 'search';

        // SPの場合の処理分岐
        if (isMobile) {
          if (isSearchMode) {
            // data-type="search"の場合：検索を実行
            e.preventDefault();
            const query = searchInputSP ? searchInputSP.value.trim() : '';
            this.performSearch(query, 'sp-button-search');
          } else {
            // data-typeが空の場合：SearchUIManagerに処理を委任（UI開く）
            // e.preventDefault()を呼ばない = SearchUIManagerが処理する
          }
        } else {
          // PCの場合：常に検索実行
          e.preventDefault();
          const query = searchInputPC ? searchInputPC.value.trim() : '';
          this.performSearch(query, 'pc-button');
        }
      });
    }
  }

  /**
   * Stage 2: 検索処理（WordPress APIから検索結果を取得してページネーション対応）
   * @param {string} query - 検索クエリ
   * @param {string} trigger - 検索トリガー（pc-enter, sp-enter, pc-button, sp-button）
   */
  async performSearch(query, trigger) {
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // console.log('🔍 検索実行 - Stage 2 (with Pagination)');
    // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!query || query.length < 2) {
      console.log('⚠️ 検索条件不足: 2文字以上入力してください');
      return;
    }

    // 現在の検索クエリを保存
    this.currentQuery = query;

    // コンテンツタイプを判定
    const contentType = this.getCurrentContentType();

    try {
      // Newsの場合: ページネーション対応検索
      if (contentType === 'news') {
        await this.performNewsSearch(query);
      }
      // Projectsの場合: 既存の検索処理
      else {
        await this.performProjectsSearch(query);
      }

    } catch (error) {
      console.error('❌ 検索処理中にエラーが発生:', error);
      this.showError();
    }
  }

  /**
   * Newsの検索処理（ページネーション対応）
   * @param {string} query - 検索クエリ
   */
  async performNewsSearch(query) {
    // newsManagerからAPIマネージャーを取得
    const apiManager = window.newsManager?.getAPIManager();
    const paginationManager = window.newsManager?.getPaginationManager();

    if (!apiManager || !paginationManager) {
      console.error('❌ newsManagerまたはpaginationManagerが見つかりません');
      return;
    }

    // 検索結果を取得（1ページ目、14件）
    const searchResult = await apiManager.fetchSearchResults(query, 1, 14);

    // console.log('🎯 News検索結果取得成功:', {
    //   'クエリ': query,
    //   '結果件数': searchResult.totalItems,
    //   '総ページ数': searchResult.totalPages,
    //   '現在ページ': searchResult.currentPage
    // });

    if (searchResult.totalItems > 0) {
      // ピックアップエリアを非表示
      this.hidePickupArea();

      // 検索結果を表示
      await apiManager.renderNewsComponents(searchResult.data);

      // ページネーションマネージャーに検索モードを設定
      paginationManager.setSearchMode(query, searchResult);

      // 検索状態の表示を更新
      this.updateSearchDisplay(query, searchResult.totalItems);

    } else {
      console.log('🚫 該当する検索結果が見つかりませんでした');
      this.hidePickupArea();
      this.showNoResults();
      this.updateSearchDisplay(query, 0);

      // ページネーションを非表示
      paginationManager.hidePagination();
    }
  }

  /**
   * Projectsの検索処理（クライアント側検索対応版）
   * @param {string} query - 検索クエリ
   */
  async performProjectsSearch(query) {
    let searchResults = [];

    // クライアント側検索が有効な場合（プロジェクトデータ受信済み）
    if (this.useClientSideSearch && this.allProjectsData.length > 0) {
      console.log('🔍 クライアント側検索を実行 (深い検索対応)');
      searchResults = this.performDeepSearch(query);
    } else {
      // フォールバック: WordPress API検索
      console.log('🔍 WordPress API検索を実行 (標準検索)');
      searchResults = await this.fetchSearchResults(query);
    }

    console.log('🎯 Projects検索結果取得成功:', {
      'クエリ': query,
      '結果件数': searchResults.length,
      '検索方式': this.useClientSideSearch ? 'クライアント側' : 'API',
      '言語': this.getCurrentLanguage()
    });

    if (searchResults.length > 0) {
      this.hidePickupArea();
      this.filterDisplayItems(searchResults);
      this.updateSearchDisplay(query, searchResults.length);
    } else {
      console.log('🚫 該当する検索結果が見つかりませんでした');
      this.hidePickupArea();
      this.showNoResults();
      this.updateSearchDisplay(query, 0);
    }
  }

  /**
   * 検索状態の表示を更新（汎用化対応）
   * @param {string} query - 検索クエリ
   * @param {number} resultCount - 検索結果件数
   */
  updateSearchDisplay(query, resultCount) {
    // 汎用セレクター: .js-search-info（優先）
    const defaultTitle = document.querySelector('.js-search-info[data-filter-type="default"]');
    if (defaultTitle) {
      defaultTitle.setAttribute('data-state', 'false');
    }

    const filteredTitle = document.querySelector('.js-search-info[data-filter-type="filtered"]');
    if (filteredTitle) {
      filteredTitle.setAttribute('data-state', 'true');

      // 検索ワードを表示するspan要素を取得（汎用化対応）
      const titleNameSpan = filteredTitle.querySelector('.js-search-info span');
      if (titleNameSpan) {
        titleNameSpan.textContent = `Search results for "${query}"`;
      }
    }

    // レガシーサポート: .p-project-info__title（Projectsページ用）
    const legacyDefaultTitle = document.querySelector('.p-project-info__title[data-filter-type="default"]');
    if (legacyDefaultTitle) {
      legacyDefaultTitle.setAttribute('data-state', 'false');
    }

    const legacyFilteredTitle = document.querySelector('.p-project-info__title[data-filter-type="filtered"]');
    if (legacyFilteredTitle) {
      legacyFilteredTitle.setAttribute('data-state', 'true');

      // Projects用の既存のspan要素も更新
      const legacyTitleNameSpan = legacyFilteredTitle.querySelector('.p-project-info__title-name');
      if (legacyTitleNameSpan) {
        legacyTitleNameSpan.textContent = `Search results for "${query}"`;
      }
    }

    // カテゴリー選択状態をリセット
    this.resetCategorySelection();
  }

  /**
   * WordPress APIから検索結果を取得
   * @param {string} query - 検索クエリ
   * @returns {Promise<Array>} 検索結果の配列
   */
  async fetchSearchResults(query) {
    const endpoint = this.buildSearchEndpoint(query);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  }

  /**
   * クライアント側の深い検索処理（acfs.team[].post_title含む）
   * @param {string} query - 検索クエリ
   * @returns {Array} 検索結果の配列
   */
  performDeepSearch(query) {
    const queryLower = query.toLowerCase();
    const searchResults = [];

    this.allProjectsData.forEach(project => {
      let isMatch = false;

      // 1. タイトルで検索
      if (project.title?.rendered) {
        const title = this.stripHTML(project.title.rendered).toLowerCase();
        if (title.includes(queryLower)) {
          isMatch = true;
        }
      }

      // 2. 案件概要で検索 (acfs.outline)
      if (!isMatch && project.acfs?.outline) {
        const outline = this.stripHTML(project.acfs.outline).toLowerCase();
        if (outline.includes(queryLower)) {
          isMatch = true;
        }
      }

      // 3. タグで検索 (acfs.tags)
      if (!isMatch && project.acfs?.tags) {
        const tags = Array.isArray(project.acfs.tags) ? project.acfs.tags : [];
        for (const tag of tags) {
          const tagName = (tag.name || '').toLowerCase();
          if (tagName.includes(queryLower)) {
            isMatch = true;
            break;
          }
        }
      }

      // 4. カテゴリーで検索 (taxonomy.projects)
      if (!isMatch && project.taxonomy?.projects) {
        const categories = Array.isArray(project.taxonomy.projects) ? project.taxonomy.projects : [];
        for (const category of categories) {
          const categoryName = (category.name || '').toLowerCase();
          if (categoryName.includes(queryLower)) {
            isMatch = true;
            break;
          }
        }
      }

      // 5. 基礎情報で検索 (acfs.basics)
      if (!isMatch && project.acfs?.basics) {
        const basics = project.acfs.basics;
        const basicsText = Object.values(basics).join(' ').toLowerCase();
        if (basicsText.includes(queryLower)) {
          isMatch = true;
        }
      }

      // 6. クレジット名で検索 (acfs.team[].post_title) ← 新規追加！
      if (!isMatch && project.acfs?.team) {
        const teamMembers = Array.isArray(project.acfs.team) ? project.acfs.team : [];
        for (const member of teamMembers) {
          const memberName = (member.post_title || '').toLowerCase();
          if (memberName.includes(queryLower)) {
            isMatch = true;
            console.log(`✅ クレジット名でヒット: "${member.post_title}" in project "${project.title?.rendered}"`);
            break;
          }
        }
      }

      if (isMatch) {
        searchResults.push(project);
      }
    });

    return searchResults;
  }

  /**
   * HTMLタグを除去するユーティリティメソッド
   * @param {string} html - HTML文字列
   * @returns {string} プレーンテキスト
   */
  stripHTML(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * 検索用APIエンドポイントを構築
   * @param {string} query - 検索クエリ
   * @returns {string} 完全なAPIエンドポイントURL
   */
  buildSearchEndpoint(query) {
    const baseUrl = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2';
    const contentType = this.getCurrentContentType();
    const language = this.getCurrentLanguage();

    // URLエンコードした検索クエリ
    const encodedQuery = encodeURIComponent(query);

    const endpoint = `${baseUrl}/${contentType}?search=${encodedQuery}&lang=${language}`;

    return endpoint;
  }

  /**
   * 現在のページのコンテンツタイプを判定
   * @returns {string} 'projects' または 'news'
   */
  getCurrentContentType() {
    // data-search属性から判定を試行
    const searchElement = document.querySelector('[data-search]');
    if (searchElement) {
      const dataSearch = searchElement.getAttribute('data-search');
      if (dataSearch === 'projects' || dataSearch === 'news') {
        return dataSearch;
      }
    }

    // URLパスから判定を試行
    const pathname = window.location.pathname;
    if (pathname.includes('/projects')) {
      return 'projects';
    } else if (pathname.includes('/news')) {
      return 'news';
    }
    return 'projects';
  }

  /**
   * 現在のページの言語を取得
   * @returns {string} 'ja' または 'en'
   */
  getCurrentLanguage() {
    const htmlLang = document.documentElement.lang;
    const language = htmlLang && (htmlLang === 'en' || htmlLang === 'ja') ? htmlLang : 'ja';

    return language;
  }

  /**
   * 現在使用中のAPIエンドポイントを取得（デバッグ用）
   * @returns {string} 現在のエンドポイント
   */
  getCurrentEndpoint() {
    const baseUrl = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2';
    const contentType = this.getCurrentContentType();
    const language = this.getCurrentLanguage();
    return `${baseUrl}/${contentType}?lang=${language}`;
  }

  // 将来の実装用（Stage 3以降）
  filterSearchResults(query) {
    console.log('🔍 Stage 3で実装予定: 検索結果のフィルタリング');
  }

  /**
   * 検索結果に基づいて表示項目をフィルタリング（汎用版）
   * @param {Array} searchResults - WordPress APIから取得した検索結果
   */
  filterDisplayItems(searchResults) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 汎用表示項目フィルタリング開始');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 汎用的な検索ターゲット要素を取得
    const allItems = document.querySelectorAll('.js-search-target');
    console.log('📋 検索対象要素数:', allItems.length);

    if (allItems.length === 0) {
      console.log('⚠️ .js-search-target要素が見つかりません');
      return;
    }

    // 検索結果のIDを配列に変換
    const resultIds = searchResults.map(item => item.id.toString());
    console.log('🔍 検索結果ID一覧:', resultIds);

    let visibleCount = 0;
    let hiddenCount = 0;

    allItems.forEach((item, index) => {
      // data-project-id または data-news-id から ID を取得（汎用対応）
      const projectId = item.getAttribute('data-project-id');
      const newsId = item.getAttribute('data-news-id');
      const itemId = projectId || newsId;

      const shouldShow = itemId && resultIds.includes(itemId);

      if (shouldShow) {
        // 該当項目を表示
        item.style.display = '';
        item.style.opacity = '1';
        visibleCount++;
      } else {
        // 非該当項目を非表示
        item.style.display = 'none';
        item.style.opacity = '0';
        hiddenCount++;
      }
    });

    // 検索結果表示の統計をコンソールに出力
    if (visibleCount > 0) {
      console.log(`✅ ${visibleCount}件の項目が表示されました（汎用検索）`);
    } else {
      console.log('⚠️ 表示可能な項目が見つかりませんでした（汎用検索）');
    }
  }

  /**
   * ピックアップエリアを非表示にする
   */
  hidePickupArea() {
    // ピックアップエリアのセレクター候補
    const pickupSelectors = [
      '.p-news-pickup',
      '[data-pickup-section]',
      '.p-news-pickup__list',
      '.p-news-pickup__list-fixed',
      '.p-news-pickup__list-index'
    ];

    let hiddenCount = 0;

    pickupSelectors.forEach(selector => {
      const pickupElements = document.querySelectorAll(selector);
      pickupElements.forEach(element => {
        element.style.display = 'none';
        hiddenCount++;
      });
    });
  }

  /**
   * ピックアップエリアを表示に戻す
   */
  showPickupArea() {
    // ピックアップエリアのセレクター候補
    const pickupSelectors = [
      '.p-news-pickup',
      '[data-pickup-section]',
      '.p-news-pickup__list',
      '.p-news-pickup__list-fixed',
      '.p-news-pickup__list-index'
    ];

    let restoredCount = 0;

    pickupSelectors.forEach(selector => {
      const pickupElements = document.querySelectorAll(selector);
      pickupElements.forEach(element => {
        element.style.display = '';
        restoredCount++;
      });
    });
  }

  showNoResults() {
    console.log('🚫━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚫 検索結果0件の表示処理（汎用版）');
    console.log('🚫━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 汎用的な検索ターゲット要素をすべて非表示
    const allItems = document.querySelectorAll('.js-search-target');
    allItems.forEach(item => {
      item.style.display = 'none';
      item.style.opacity = '0';
    });

    console.log(`❌ 全${allItems.length}件の.js-search-target要素を非表示にしました`);
    console.log('🚫━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * エラー発生時の表示処理（汎用版）
   */
  showError() {
    console.log('❌━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ エラー時の表示処理（汎用版）');
    console.log('❌━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // エラー時は全項目を表示（通常状態に戻す）
    const allItems = document.querySelectorAll('.js-search-target');
    allItems.forEach(item => {
      item.style.display = '';
      item.style.opacity = '1';
    });

    // ピックアップエリアも表示に戻す
    this.showPickupArea();

    console.log(`🔄 エラーのため全${allItems.length}件の.js-search-target要素を表示状態に戻しました`);
    console.log('❌━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * 検索状態をリセットして通常表示に戻す
   */
  resetSearch() {
    // 全ての検索対象要素を表示状態に戻す
    const allItems = document.querySelectorAll('.js-search-target');
    allItems.forEach(item => {
      item.style.display = '';
      item.style.opacity = '1';
    });

    // ピックアップエリアを表示に戻す
    this.showPickupArea();

    // 検索フィールドをクリア
    const searchInputPC = document.querySelector('#search_category');
    const searchInputSP = document.querySelector('#search_category_sp');

    if (searchInputPC) {
      searchInputPC.value = '';
    }
    if (searchInputSP) {
      searchInputSP.value = '';
    }

    // 表示状態をリセット
    this.resetDisplayState();

    // 現在の検索クエリをクリア
    this.currentQuery = '';

    // Newsの場合は検索モードをクリア
    const paginationManager = window.newsManager?.getPaginationManager();
    if (paginationManager) {
      paginationManager.clearSearchMode();
    }

    console.log('🔄 検索状態をリセットしました');
  }

  /**
   * 表示状態をリセット（デフォルトに戻す）- 汎用化対応
   */
  resetDisplayState() {
    // 汎用セレクター: .js-search-info（優先）
    const defaultTitle = document.querySelector('.js-search-info[data-filter-type="default"]');
    if (defaultTitle) {
      defaultTitle.setAttribute('data-state', 'true');
    }

    const filteredTitle = document.querySelector('.js-search-info[data-filter-type="filtered"]');
    if (filteredTitle) {
      filteredTitle.setAttribute('data-state', 'false');

      // 検索ワードをクリア（汎用化対応）
      const titleNameSpan = filteredTitle.querySelector('.js-search-info span');
      if (titleNameSpan) {
        titleNameSpan.textContent = '';
      }
    }

    // レガシーサポート: .p-project-info__title（Projectsページ用）
    const legacyDefaultTitle = document.querySelector('.p-project-info__title[data-filter-type="default"]');
    if (legacyDefaultTitle) {
      legacyDefaultTitle.setAttribute('data-state', 'true');
    }

    const legacyFilteredTitle = document.querySelector('.p-project-info__title[data-filter-type="filtered"]');
    if (legacyFilteredTitle) {
      legacyFilteredTitle.setAttribute('data-state', 'false');

      // Projects用の既存のspan要素もクリア
      const legacyTitleNameSpan = legacyFilteredTitle.querySelector('.p-project-info__title-name');
      if (legacyTitleNameSpan) {
        legacyTitleNameSpan.textContent = '';
      }
    }

    // カテゴリー選択状態を復活（必要に応じて）
    this.restoreCategorySelection();
  }

  /**
   * カテゴリー選択状態をリセット（検索時）
   */
  resetCategorySelection() {
    const categoryLinks = document.querySelectorAll('.js-search-category-reset > a[aria-current]');
    let resetCount = 0;

    categoryLinks.forEach((link, index) => {
      const currentAriaCurrent = link.getAttribute('aria-current');
      if (currentAriaCurrent && currentAriaCurrent !== 'false') {
        // aria-current をfalseに設定
        link.setAttribute('aria-current', 'false');
        resetCount++;
      }
    });
  }

  /**
   * カテゴリー選択状態を復活（リセット時、必要に応じて）
   */
  restoreCategorySelection() {
    // 必要に応じて "ALL" カテゴリーをアクティブにする処理など
    const allCategoryLink = document.querySelector('.js-search-category-reset > a[href*="projects"]');
    if (allCategoryLink && !allCategoryLink.getAttribute('aria-current')) {
      allCategoryLink.setAttribute('aria-current', 'page');
    }
  }

  // 将来の実装用（Stage 4以降）
  displayResults(results = []) {
    console.log('🔍 Stage 4で実装予定: 検索結果の表示');
  }
}

// デバッグ用: グローバルにSearchManagerを公開
if (typeof window !== 'undefined') {
  window.SearchManager = SearchManager;
}
