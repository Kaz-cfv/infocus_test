/**
 * 検索機能を管理するクラス
 * WordPress APIから取得したデータの検索機能を提供
 */

export class SearchManager {
  constructor() {
    this.searchElements = document.querySelectorAll('[data-search]');
    this.searchData = [];
    this.currentResults = [];
    this.init();
  }

  init() {
    if (this.searchElements.length > 0) {
      this.bindEvents();
      this.loadSearchData();
    }
  }

  bindEvents() {
    this.searchElements.forEach(element => {
      const searchInput = element.querySelector('[data-search-input]');
      const searchButton = element.querySelector('[data-search-button]');
      const searchResults = element.querySelector('[data-search-results]');

      if (searchInput) {
        // リアルタイム検索
        searchInput.addEventListener('input', (e) => {
          this.debounce(() => this.performSearch(e.target.value), 300);
        });

        // Enterキーでの検索
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch(e.target.value);
          }
        });
      }

      if (searchButton) {
        searchButton.addEventListener('click', (e) => {
          e.preventDefault();
          const query = searchInput ? searchInput.value : '';
          this.performSearch(query);
        });
      }
    });
  }

  async loadSearchData() {
    try {
      // WordPress APIからデータを取得
      // 実際のAPIエンドポイントに合わせて調整してください
      const response = await fetch('/api/search-data');
      this.searchData = await response.json();
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  }

  performSearch(query) {
    if (!query || query.trim().length < 2) {
      this.clearResults();
      return;
    }

    const searchQuery = query.toLowerCase().trim();

    this.currentResults = this.searchData.filter(item => {
      return (
        this.matchTitle(item, searchQuery) ||
        this.matchTags(item, searchQuery) ||
        this.matchCategory(item, searchQuery) ||
        this.matchBasicInfo(item, searchQuery) ||
        this.matchProjectOverview(item, searchQuery)
      );
    });

    this.displayResults(this.currentResults);
  }

  matchTitle(item, query) {
    return item.title && item.title.toLowerCase().includes(query);
  }

  matchTags(item, query) {
    return item.tags && item.tags.some(tag =>
      tag.toLowerCase().includes(query)
    );
  }

  matchCategory(item, query) {
    return item.category && item.category.toLowerCase().includes(query);
  }

  matchBasicInfo(item, query) {
    return item.basicInfo && item.basicInfo.toLowerCase().includes(query);
  }

  matchProjectOverview(item, query) {
    return item.projectOverview && item.projectOverview.toLowerCase().includes(query);
  }

  displayResults(results) {
    const resultsContainer = document.querySelector('[data-search-results]');
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="search-no-results">検索結果が見つかりませんでした。</p>';
      return;
    }

    const resultsHTML = results.map(item => this.createResultHTML(item)).join('');
    resultsContainer.innerHTML = resultsHTML;
  }

  createResultHTML(item) {
    return `
      <div class="search-result-item" data-id="${item.id}">
        <h3 class="search-result-title">
          <a href="${item.url}">${item.title}</a>
        </h3>
        <p class="search-result-excerpt">${item.excerpt || ''}</p>
        <div class="search-result-meta">
          ${item.category ? `<span class="category">${item.category}</span>` : ''}
          ${item.tags ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
        </div>
      </div>
    `;
  }

  clearResults() {
    const resultsContainer = document.querySelector('[data-search-results]');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
  }

  // デバウンス機能
  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  destroy() {
    this.searchElements.forEach(element => {
      const searchInput = element.querySelector('[data-search-input]');
      if (searchInput) {
        searchInput.removeEventListener('input', this.performSearch);
        searchInput.removeEventListener('keypress', this.performSearch);
      }
    });
  }
}
