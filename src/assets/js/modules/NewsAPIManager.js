/**
 * News API Manager
 * WordPress APIからニュースデータを取得し、動的にコンポーネントに渡す
 */

export class NewsAPIManager {
  constructor() {
    this.baseEndpoint = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2/news';
    this.currentLanguage = this.detectLanguage();
    this.cache = new Map();
    this.isLoading = false;

    // ページネーション設定
    this.paginationConfig = {
      itemsPerPage: 14,      // 1ページあたり14件
      currentPage: 1,        // 現在のページ
      skipCount: 4          // 先頭から除外する件数 (固定1件 + リスト3件 = 4件)
    };

    // エンドポイントは設定完了後に構築
    this.apiEndpoint = this.buildAPIEndpoint();

    // 固定ピックアップ記事のIDを格納
    this.fixedPickupId = null;
  }

  /**
   * 現在の言語を検出
   */
  detectLanguage() {
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname;
      return currentPath.includes('/en/') ? 'en' : 'ja';
    }
    return 'ja';
  }

  /**
   * 言語に応じたAPIエンドポイントを構築
   * offsetパラメータで先頭4件をスキップ
   */
  buildAPIEndpoint() {
    const langParam = `lang=${this.currentLanguage}`;
    const perPageParam = `per_page=${this.paginationConfig.itemsPerPage}`;

    // スキップすべき合計記事数
    const offset = this.paginationConfig.skipCount + (this.paginationConfig.currentPage - 1) * this.paginationConfig.itemsPerPage;
    const offsetParam = `offset=${offset}`;

    return `${this.baseEndpoint}?${langParam}&${perPageParam}&${offsetParam}`;
  }

  /**
   * 言語に応じたニュース詳細URLを生成
   */
  getLocalizedNewsURL(slug) {
    if (this.currentLanguage === 'en') {
      return `/en/news/${slug}`;
    } else {
      return `/news/${slug}`;
    }
  }

  /**
   * 初期化処理
   */
  async init() {
    try {
      // 1. 固定ピックアップ記事のIDを取得 (API-1のみ利用)
      if (this.paginationConfig.currentPage === 1) {
          await this.fetchFixedPickupId();
      }

      // ページネーション更新: currentPage が変わった場合は endpoint を更新
      this.apiEndpoint = this.buildAPIEndpoint();

      // 2. メインニュースデータとリストピックアップデータを取得
      const { fixedNewsItem, listPickupData, mainNewsData } = await this.fetchNewsDataAndSeparate();

      // 3. 固定ピックアップエリアを描画 (1ページ目のみ)
      if (this.paginationConfig.currentPage === 1 && fixedNewsItem) {
          this.appendToFixedPickupArea(fixedNewsItem);
      } else if (this.paginationConfig.currentPage > 1) {
          this.removeFixedPickupSkeleton();
      }

      // 4. ピックアップリスト（残り3件）を描画 (1ページ目のみ)
      if (this.paginationConfig.currentPage === 1) {
          this.renderPickupListArea(listPickupData);
      } else if (this.paginationConfig.currentPage > 1) {
          this.removeListPickupSkeleton();
      }

      // 5. メインリストを描画
      await this.renderNewsComponents(mainNewsData);

      return mainNewsData;

    } catch (error) {
      console.error(`❌ NewsAPIManager: データ取得に失敗 (${this.currentLanguage})`, error);
      this.handleError(error);
      return [];
    }
  }

  /**
   * 固定ピックアップ記事のIDを取得（API-1: infocus/v1/options/news）
   */
  async fetchFixedPickupId() {
    const fixedPickupEndpoint = 'https://infocus.wp.site-prev2.com/wp-json/infocus/v1/options/news';

    try {
      const response = await fetch(fixedPickupEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Fixed Pickup API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      let rawFixedNewsItem = null;

      // API-1のレスポンス構造: { home: { pickup_news: [...] } } からIDを抽出
      if (rawData?.home?.pickup_news && Array.isArray(rawData.home.pickup_news) && rawData.home.pickup_news.length > 0) {
        rawFixedNewsItem = rawData.home.pickup_news[0];
      }

      if (rawFixedNewsItem?.ID) {
          this.fixedPickupId = rawFixedNewsItem.ID;
          // console.log(`✅ Fixed Pickup ID found: ${this.fixedPickupId}`);
      } else {
          // console.warn('⚠️ 固定ピックアップIDが見つかりません。');
      }

    } catch (error) {
      console.error('❌ 固定ピックアップID取得エラー:', error);
    }
  }

  /**
   * WordPress APIからメインリストのデータ（offset適用済み）を取得
   * ページネーションマネージャーが依存しているため、このメソッドを再定義
   */
  async fetchNewsData() {
    // キャッシュロジックは省略し、直接メインリストを取得する新しいメソッドを呼び出す
    try {
        return await this.fetchMainNewsList();
    } catch (error) {
        console.error(`🚨 fetchNewsDataエラー:`, error);
        throw error;
    }
  }

  /**
   * メインリスト用データ取得 (オフセット適用済み)
   */
  async fetchMainNewsList() {
    const cacheKey = `newsData_${this.currentLanguage}_page_${this.paginationConfig.currentPage}`;

    // APIエンドポイントが最新か確認
    this.apiEndpoint = this.buildAPIEndpoint();

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const formattedData = this.formatNewsData(rawData);

      // キャッシュに保存
      this.cache.set(cacheKey, formattedData);
      this.cache.set(`lastFetch_${this.currentLanguage}`, Date.now());

      return formattedData;

    } catch (error) {
      console.error(`🚨 メインリスト取得エラーの詳細 (${this.currentLanguage}):`, error);
      throw error;
    }
  }

  /**
   * メインAPI (API-2) から全データを取得し、固定・リスト・メインに分離
   */
  async fetchNewsDataAndSeparate() {
    const langParam = `lang=${this.currentLanguage}`;

    let listPlusData = [];
    if (this.paginationConfig.currentPage === 1) {
        // 1. ピックアップ用 (固定 + リスト3件) のデータ取得
        const pickupLimit = this.fixedPickupId ? 10 : 4;
        const listEndpoint = `${this.baseEndpoint}?${langParam}&per_page=${pickupLimit}&page=1`;

        const rawListPlusData = await fetch(listEndpoint).then(res => res.json());
        listPlusData = this.formatNewsData(rawListPlusData);
    }

    // 2. メインリスト用データ取得 (fetchMainNewsListを使用)
    const formattedMainListData = await this.fetchMainNewsList();

    let fixedNewsItem = null;
    let listPickupData = [];

    if (this.paginationConfig.currentPage === 1) {
        if (this.fixedPickupId) {
            // 固定記事を抽出
            fixedNewsItem = listPlusData.find(item => item.id.toString() === this.fixedPickupId.toString());

            // 固定記事を除いた最新記事からリストピックアップ記事（3件）を決定
            const nonFixedNews = listPlusData.filter(item => item.id.toString() !== this.fixedPickupId.toString());
            listPickupData = nonFixedNews.slice(0, 3);

        } else {
            // 固定記事がない場合、最新の1件目を固定エリアに、2-4件目をリストエリアに
            fixedNewsItem = listPlusData[0];
            listPickupData = listPlusData.slice(1, 4);
        }
    }

    return {
      fixedNewsItem,
      listPickupData,
      mainNewsData: formattedMainListData
    };
  }

  /**
   * APIから取得したデータをコンポーネント用に整形
   */
  formatNewsData(rawData) {
    if (!Array.isArray(rawData)) return [];

    return rawData.map(item => {
      // 日付をフォーマット
      const date = new Date(item.date || item.post_date);
      let formattedDate;

      if (this.currentLanguage === 'en') {
        formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '.');
      } else {
        formattedDate = date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '.');
      }

      // カテゴリー情報を取得
      const newsCategories = item.taxonomy?.news || item.categories || [];
      const primaryCategory = Array.isArray(newsCategories) ? newsCategories[0] : newsCategories;

      const categoryName = primaryCategory?.name || (this.currentLanguage === 'en' ? 'Other' : 'その他');
      const categorySlug = primaryCategory?.slug || 'other';

      // アイキャッチ画像の処理 (medium_largeとlargeを確実に取得)
      let featuredImageFallback = 'placeholder-url.jpg';
      let featuredImageMediumLarge = 'placeholder-url.jpg';
      let featuredImageLarge = 'placeholder-url.jpg';
      let imageObject = null;

      // 1. API-2 形式 (ACF: item.acfs.news_mv) を試す
      if (item.acfs?.news_mv?.url) {
        imageObject = item.acfs.news_mv;
      }

      // 2. API-1/API-2 共通のカスタム形式 (item.image) を試す
      if (!imageObject && item.image?.url) {
          imageObject = item.image;
      }

      // 画像オブジェクトから medium_large と large を抽出
      if (imageObject) {
          const sizes = imageObject.sizes;
          const originalUrl = imageObject.url || 'placeholder-url.jpg';

          // large (PC用) を取得
          featuredImageLarge = sizes?.large?.url || originalUrl;

          // medium_large (SP/Fallback用) を取得
          featuredImageMediumLarge = sizes?.medium_large?.url || originalUrl;

          // フォールバックを設定
          featuredImageFallback = originalUrl;
      }

      // 3. その他のフラットな画像URLを試す (念のため)
      if (featuredImageMediumLarge === 'placeholder-url.jpg') {
          const flatUrl = item.featured_image_url || item.image_url || '';
          if (flatUrl) {
              featuredImageMediumLarge = flatUrl;
              featuredImageLarge = flatUrl;
              featuredImageFallback = flatUrl;
          }
      }

      // タイトルの処理
      let newsTitle = this.currentLanguage === 'en' ? 'No Title' : 'タイトルなし';
      if (typeof item.title === 'string') {
        newsTitle = item.title;
      } else if (item.title?.rendered) {
        newsTitle = item.title.rendered;
      } else if (item.post_title) { // カスタムレスポンスの場合
        newsTitle = item.post_title;
      }


      // スラッグの処理
      const newsSlug = item.slug || item.post_name || 'no-slug';

      return {
        id: item.id || item.ID,
        title: newsTitle,
        date: formattedDate,
        category: categoryName,
        categorySlug: categorySlug,
        url: this.getLocalizedNewsURL(newsSlug),
        picMediumLarge: featuredImageMediumLarge,
        picLarge: featuredImageLarge,
        picFallback: featuredImageFallback,
        slug: newsSlug,
        excerpt: item.excerpt?.rendered || '',
        content: item.content?.rendered || '',
        language: this.currentLanguage,
        rawData: item
      };
    }).filter(item => {
      // ID、タイトル、スラッグ、有効な画像URLがあることを確認
      return item.id && item.title && item.slug && item.picMediumLarge !== 'placeholder-url.jpg' && item.picLarge !== 'placeholder-url.jpg';
    });
  }

  /**
   * 固定ピックアップエリアのスケルトンを削除
   */
  removeFixedPickupSkeleton() {
    const fixedInner = document.querySelector('.p-news-pickup__list-fixedInner');
    if (fixedInner) {
      const skeleton = fixedInner.querySelector('.skeleton-item, .c-news-card.skeleton');
      if (skeleton) {
          skeleton.classList.add('fade-out');
          setTimeout(() => skeleton.remove(), 300);
      }
    }
  }

  /**
   * ピックアップリストエリアのスケルトンを削除
   */
  removeListPickupSkeleton() {
    const pickupList = document.querySelector('.p-news-pickup__list-index');
    if (pickupList) {
      const skeletonItems = pickupList.querySelectorAll('.skeleton-item');
      if (skeletonItems.length > 0) {
          skeletonItems.forEach(item => item.classList.add('fade-out'));
          setTimeout(() => pickupList.innerHTML = '', 300);
      }
    }
  }

  /**
   * ピックアップリストを描画 (2〜4件目)
   */
  renderPickupListArea(listPickupData) {
    const pickupList = document.querySelector('.p-news-pickup__list-index');
    if (!pickupList || !listPickupData.length) {
      console.warn('⚠️ ピックアップリストまたはデータが見つかりません');
      this.removeListPickupSkeleton(); // データがない場合もスケルトンは削除
      return;
    }

    // スケルトンをフェードアウトさせてから削除
    const skeletonItems = pickupList.querySelectorAll('.skeleton-item');
    if (skeletonItems.length > 0) {
      skeletonItems.forEach(item => item.classList.add('fade-out'));

      setTimeout(() => {
          pickupList.innerHTML = '';

          // 取得したリストデータ（2件目以降に相当）をリストに追加
          listPickupData.forEach((newsItem, index) => {
              const listItem = this.createPickupListItem(newsItem, index + 2);
              pickupList.appendChild(listItem);
          });

          // console.log('✨ Pickup list (2-4 items) rendered');
      }, 300);
    } else {
      pickupList.innerHTML = '';
      listPickupData.forEach((newsItem, index) => {
        const listItem = this.createPickupListItem(newsItem, index + 2);
        pickupList.appendChild(listItem);
      });
    }
  }

  /**
   * 固定ピックアップエリアに1件目を挿入
   */
  appendToFixedPickupArea(newsItem) {
    const fixedInner = document.querySelector('.p-news-pickup__list-fixedInner');
    if (!fixedInner) {
      console.warn('⚠️ 固定ピックアップエリアが見つかりません');
      return;
    }

    // スケルトンを検出
    const skeleton = fixedInner.querySelector('.skeleton-item, .c-news-card.skeleton');

    if (skeleton) {
      // スケルトンをフェードアウト
      skeleton.classList.add('fade-out');

      setTimeout(() => {
        skeleton.remove();

        // 新しいカードを作成して追加
        const newsCard = this.createNewsCardElement(newsItem);
        fixedInner.appendChild(newsCard);

        // console.log('✨ Fixed pickup area rendered');
      }, 300);
    } else {
      // 既存のカードがある場合
      const existingCard = fixedInner.querySelector('.c-news-card');

      if (existingCard) {
        // 既存のカードの内容を更新
        this.updateExistingCard(existingCard, newsItem);
      } else {
        // 既存のカードがない場合は、新しく作成して追加
        const newsCard = this.createNewsCardElement(newsItem);
        fixedInner.appendChild(newsCard);
      }
    }
  }

  /**
   * 既存のNewsCardの内容を更新
   */
  updateExistingCard(cardElement, newsItem) {
    // リンクとデータ属性を更新
    cardElement.href = newsItem.url;
    cardElement.setAttribute('data-card', newsItem.id);
    cardElement.setAttribute('data-news-id', newsItem.id.toString());
    cardElement.setAttribute('data-category', newsItem.categorySlug);
    cardElement.setAttribute('data-language', newsItem.language);

    // 画像を更新
    const img = cardElement.querySelector('.c-news-card__pic img');
    if (img) {
      // medium_large (SP/Fallback用) を img.src に設定
      img.src = newsItem.picMediumLarge;
      img.alt = newsItem.title;
    }

    // picture source を更新 (PC用)
    const source = cardElement.querySelector('.c-news-card__pic source');
    if (source) {
      // large (PC用) を source.srcset に設定
      source.srcset = newsItem.picLarge;
    }

    // タイトルを更新
    const title = cardElement.querySelector('.c-news-card__info-title');
    if (title) {
      title.textContent = newsItem.title;
    }

    // 日付を更新
    const date = cardElement.querySelector('.c-news-card__info-date');
    if (date) {
      date.textContent = newsItem.date;
    }

    // カテゴリーを更新
    const category = cardElement.querySelector('.c-news-card__info-category');
    if (category) {
      category.textContent = newsItem.category;
    }
  }

  /**
   * ピックアップリストアイテムを作成
   */
  createPickupListItem(newsItem, itemNumber) {
    const listItem = document.createElement('li');
    listItem.className = 'p-news-pickup__list-item js-search-target';
    listItem.setAttribute('data-news-item', 'pickup');
    listItem.setAttribute('data-news-id', newsItem.id.toString());
    listItem.setAttribute('data-category', newsItem.categorySlug);
    listItem.setAttribute('data-language', newsItem.language);

    const newsCard = this.createNewsCardElement(newsItem);
    listItem.appendChild(newsCard);

    return listItem;
  }

  async renderNewsComponents(newsData) {
    // メインリストを描画
    this.renderMainNewsList(newsData);

    return { mainNews: newsData };
  }

  /**
   * メインニュースリストを描画
   */
  renderMainNewsList(newsData) {
    const mainList = document.querySelector('.p-news-content__list-index[data-index="news"]');
    if (!mainList) {
      console.warn('⚠️ メインリストコンテナが見つかりません');
      return;
    }

    // スケルトンをフェードアウトさせてから削除
    const skeletonItems = mainList.querySelectorAll('.skeleton-item');
    if (skeletonItems.length > 0) {
      skeletonItems.forEach(item => item.classList.add('fade-out'));

      setTimeout(() => {
        // 既存のリストアイテムをクリア
        mainList.innerHTML = '';

        // ニュースを描画
        newsData.forEach((newsItem, index) => {
          const listItem = this.createNewsListItem(newsItem, index + 1);
          mainList.appendChild(listItem);
        });

        // console.log(`✨ Main news list rendered: ${newsData.length} items`);
      }, 300);
    } else {
      // スケルトンがない場合（通常は発生しない）
      mainList.innerHTML = '';
      newsData.forEach((newsItem, index) => {
        const listItem = this.createNewsListItem(newsItem, index + 1);
        mainList.appendChild(listItem);
      });
    }
  }

  /**
   * ニュースカード要素を作成
   */
  createNewsCardElement(newsItem) {
    const cardElement = document.createElement('a');
    cardElement.href = newsItem.url;
    cardElement.className = 'c-news-card js-search-target mouse-over';
    cardElement.setAttribute('data-card', newsItem.id);
    cardElement.setAttribute('data-news-id', newsItem.id.toString());
    cardElement.setAttribute('data-category', newsItem.categorySlug);
    cardElement.setAttribute('data-language', newsItem.language);

    cardElement.innerHTML = `
      <figure class="c-news-card__pic">
        <picture>
          <source media="(min-width: 960px)" srcset="${newsItem.picLarge}">
          <img
            src="${newsItem.picMediumLarge}"
            alt="${newsItem.title}"
            loading="lazy"
            decoding="async"
          >
        </picture>
      </figure>
      <div class="c-news-card__info">
        <p class="c-news-card__info-title">${newsItem.title}</p>
        <div class="c-news-card__info-sub">
          <time class="c-news-card__info-date">${newsItem.date}</time>
          <span class="c-news-card__info-category">${newsItem.category}</span>
        </div>
      </div>
    `;

    return cardElement;
  }

  /**
   * ニュースリストアイテムを作成
   */
  createNewsListItem(newsItem, itemNumber) {
    const listItem = document.createElement('li');
    listItem.className = 'p-news-content__list-item js-search-target';
    listItem.setAttribute('data-news-item', 'regular');
    listItem.setAttribute('data-news-id', newsItem.id.toString());
    listItem.setAttribute('data-category', newsItem.categorySlug);
    listItem.setAttribute('data-language', newsItem.language);

    const newsCard = this.createNewsCardElement(newsItem);
    listItem.appendChild(newsCard);

    return listItem;
  }

  /**
   * エラーハンドリング
   */
  handleError(error) {
    console.error(`🚨 NewsAPIManager Error (${this.currentLanguage}):`, error);

    const errorMessage = this.currentLanguage === 'en'
      ? 'Failed to fetch news. Please try again later.'
      : 'ニュースの取得に失敗しました。しばらく後に再度お試しください。';

    this.showErrorMessage(errorMessage);
    this.showFallbackContent();
  }

  /**
   * エラーメッセージを表示
   */
  showErrorMessage(message) {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = `
        padding: 20px;
        margin: 20px;
        background-color: #ff6b6b;
        color: white;
        border-radius: 4px;
        text-align: center;
      `;
      errorDiv.textContent = message;

      mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }
  }

  /**
   * フォールバックコンテンツを表示
   */
  showFallbackContent() {
    const staticCards = document.querySelectorAll('.c-news-card');
    staticCards.forEach(card => {
      card.style.display = 'block';
    });
  }

  /**
   * 検索結果を取得（ページネーション用）
   * @param {string} query - 検索クエリ
   * @param {number} page - 取得するページ番号
   * @param {number} perPage - 1ページあたりの件数
   * @returns {Promise<Object>} 検索結果とページネーション情報
   */
  async fetchSearchResults(query, page = 1, perPage = 14) {
    try {
      const langParam = `lang=${this.currentLanguage}`;
      const searchParam = `search=${encodeURIComponent(query)}`;
      const perPageParam = `per_page=${perPage}`;
      const pageParam = `page=${page}`;

      const searchEndpoint = `${this.baseEndpoint}?${langParam}&${searchParam}&${perPageParam}&${pageParam}`;

      const response = await fetch(searchEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Search API Error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const totalItems = parseInt(response.headers.get('X-WP-Total') || '0');
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

      // データを整形
      const formattedData = this.formatNewsData(rawData);

      return {
        data: formattedData,
        totalItems,
        totalPages,
        currentPage: page,
        perPage
      };

    } catch (error) {
      console.error('❌ 検索結果取得エラー:', error);
      throw error;
    }
  }

  /**
   * 公開API
   */
  getPublicAPI() {
    return {
      refetch: () => this.fetchNewsData(),
      getCache: () => this.cache.get(`newsData_${this.currentLanguage}_page_${this.paginationConfig.currentPage}`),
      clearCache: () => this.cache.clear(),
      isLoading: () => this.isLoading,
      getCurrentLanguage: () => this.currentLanguage,
      fetchSearchResults: (query, page, perPage) => this.fetchSearchResults(query, page, perPage)
    };
  }
}
