/**
 * News API Manager
 * WordPress APIからニュースデータを取得し、動的にコンポーネントに渡す
 * 公安の情報収集システムのように確実にデータを取得する
 */

export class NewsAPIManager {
  constructor() {
    this.apiEndpoint = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2/news?per_page=50';
    this.cache = new Map();
    this.isLoading = false;

    // ページネーション設定（公安の情報管理システムのように精密に）
    this.paginationConfig = {
      pickupCount: 3,        // ピックアップエリア: 1-3件目
      mainPageSize: 14,      // メインリスト1ページ: 4-17件目（14件）
      totalPerPage: 17       // 1ページあたりの総件数
    };
  }

  /**
   * 初期化処理
   * まるで事件の初動捜査のような慎重さで
   */
  async init() {
    console.log('📡 NewsAPIManager: データ取得開始...');

    try {
      // APIからニュースデータを取得
      const newsData = await this.fetchNewsData();

      // コンポーネントに動的にPropsを渡す
      await this.renderNewsComponents(newsData);

      console.log('✅ NewsAPIManager: データ取得・表示完了');

      return newsData;

    } catch (error) {
      console.error('❌ NewsAPIManager: データ取得に失敗', error);
      this.handleError(error);
      return [];
    }
  }

  /**
   * WordPress APIからニュースデータを取得
   * 公安の情報網のように確実に
   */
  async fetchNewsData() {
    if (this.isLoading) {
      console.log('⏳ 既にデータ取得中...');
      return this.cache.get('newsData') || [];
    }

    this.isLoading = true;

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

      // デバッグ用: 生データの構造をログ出力（公安の情報分析のように）
      console.log('🔍 APIレスポンスのサンプルデータ:', {
        total: rawData.length,
        firstItem: rawData[0] ? {
          id: rawData[0].id,
          title: rawData[0].title,
          slug: rawData[0].slug,
          acfs_structure: rawData[0].acfs ? Object.keys(rawData[0].acfs) : null,
          taxonomy_structure: rawData[0].taxonomy ? Object.keys(rawData[0].taxonomy) : null,
          news_categories: rawData[0].taxonomy?.news || null
        } : null
      });

      // データを整形（まるで証拠を整理するように）
      const formattedData = this.formatNewsData(rawData);

      // 整形後のデータ品質をチェック（赤井のような丁寧さで）
      console.log('✨ データ整形結果:', {
        original_count: rawData.length,
        formatted_count: formattedData.length,
        sample_formatted: formattedData[0] || null,
        categories_found: [...new Set(formattedData.map(item => item.category))],
        missing_images: formattedData.filter(item => item.pic === '/common/images/news/default.png').length
      });

      // キャッシュに保存
      this.cache.set('newsData', formattedData);
      this.cache.set('lastFetch', Date.now());

      return formattedData;

    } catch (error) {
      console.error('🔍 API取得エラーの詳細:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * APIから取得したデータをコンポーネント用に整形
   * 赤井の几帳面さで丁寧に処理（実際のデータ構造に合わせて修正）
   */
  formatNewsData(rawData) {
    return rawData.map(item => {
      // 日付をフォーマット
      const date = new Date(item.date);
      const formattedDate = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '.');

      // カテゴリー情報を取得（taxonomy.newsから）
      const newsCategories = item.taxonomy?.news || [];
      const primaryCategory = newsCategories[0] || { name: 'その他', slug: 'other' };

      // アイキャッチ画像の処理（acfs.news_mv.urlから取得）
      let featuredImage = '/common/images/news/default.png'; // デフォルト画像
      if (item.acfs?.news_mv?.url) {
        featuredImage = item.acfs.news_mv.url;
      }

      // タイトルの処理（title.renderedまたは文字列）
      let newsTitle = 'タイトルなし';
      if (typeof item.title === 'string') {
        newsTitle = item.title;
      } else if (item.title?.rendered) {
        newsTitle = item.title.rendered;
      }

      return {
        id: item.id,
        title: newsTitle,
        date: formattedDate,
        category: primaryCategory.name,
        categorySlug: primaryCategory.slug,
        url: `/news/${item.slug}`, // slugを使ってURL構築
        pic: featuredImage,
        slug: item.slug,
        excerpt: item.excerpt?.rendered || '',
        content: item.content?.rendered || '',
        rawData: item // デバッグ用に生データも保持
      };
    }).filter(item => {
      // 必要な情報が揃っているもののみフィルタ
      return item.id && item.title && item.slug;
    });
  }

  /**
   * ピックアップニュースを特定（3件）
   * 組織の重要情報を選別するように
   */
  getPickupNews(newsData, currentPage = 1) {
    // 1ページ目のみピックアップを表示
    if (currentPage !== 1) {
      return [];
    }

    // 最新、3件をピックアップとして取得
    return newsData
      .sort((a, b) => new Date(b.rawData.date) - new Date(a.rawData.date))
      .slice(0, this.paginationConfig.pickupCount);
  }

  /**
   * メインリスト用ニュースを取得（ページネーション対応）
   * 公安の情報管理のように精密に分類
   */
  getMainNews(newsData, currentPage = 1) {
    const sorted = newsData.sort((a, b) => new Date(b.rawData.date) - new Date(a.rawData.date));

    if (currentPage === 1) {
      // 1ページ目: 4-17件目（14件）
      return sorted.slice(
        this.paginationConfig.pickupCount, // 3件目の次から
        this.paginationConfig.totalPerPage  // 17件目まで
      );
    } else {
      // 2ページ目以降: 18件目以降
      const startIndex = this.paginationConfig.totalPerPage + ((currentPage - 2) * this.paginationConfig.mainPageSize);
      const endIndex = startIndex + this.paginationConfig.mainPageSize;

      return sorted.slice(startIndex, endIndex);
    }
  }

  /**
  * 動的にNewsコンポーネントを描画
  * まるで証拠を整理して事件の全体像を組み立てるように
  */
  async renderNewsComponents(newsData, currentPage = 1) {
  console.log('🎨 コンポーネント描画開始...', {
      total: newsData.length,
    currentPage,
    config: this.paginationConfig
  });

  // ページ別にデータを分類（公安の情報管理のように）
  const pickupNews = this.getPickupNews(newsData, currentPage);
  const mainNews = this.getMainNews(newsData, currentPage);

  // ピックアップセクションを描画（1ページ目のみ）
  if (currentPage === 1 && pickupNews.length > 0) {
    this.renderPickupSection(pickupNews);
  } else {
    // 2ページ目以降はピックアップエリアを非表示にする
    const pickupSection = document.querySelector('[data-pickup-section]');
    if (pickupSection) {
      pickupSection.style.display = 'none';
    }
  }

    // メインリストを描画
    this.renderMainNewsList(mainNews, newsData, currentPage);

    // フィルタリング用に全データを保存
    this.storeDataForFiltering(newsData);

    console.log('✨ 描画完了:', {
      pickup: pickupNews.length,
      main: mainNews.length,
      page: currentPage
    });

    return { pickupNews, mainNews, allNews: newsData, currentPage };
  }

  /**
  * ピックアップセクションを描画（3件対応）
  * 公安の重要情報を整理するように
   */
  renderPickupSection(pickupNews) {
  // 固定アイテム（1件目）の描画
  const pickupContainer = document.querySelector('.p-news-pickup__list-fixedInner');
  if (pickupContainer && pickupNews.length > 0) {
    // 既存の子要素を全てクリア
    pickupContainer.innerHTML = '';

    // タイトル要素を生成して追加
    const titleElement = document.createElement('h2');
    titleElement.className = 'p-news-pickup__list-fixedTitle';
    titleElement.innerHTML = `
      PICK UP
      <span>
        <svg width="11" height="17" viewBox="0 0 11 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_240_384)">
            <path d="M11 11.7419V10.0008L9.19249 6.95043L10.6127 0H0.387324L1.81397 6.95043L0 10.0008V11.7419H11Z" fill="white"/>
            <path d="M6.10035 8.13477H4.89964V17.0004H6.10035V8.13477Z" fill="white"/>
          </g>
          <defs>
            <clipPath id="clip0_240_384">
              <rect width="11" height="17" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </span>
    `;
    pickupContainer.appendChild(titleElement);

    // 1件目のニュースカードを生成
    const newsCard = this.createNewsCardElement(pickupNews[0]);
    pickupContainer.appendChild(newsCard);

    console.log('🎯 ピックアップ固定アイテム描画完了');
  }

    // インデックスリスト（2-3件目）の描画
    const pickupIndexList = document.querySelector('.p-news-pickup__list-index');
    if (pickupIndexList && pickupNews.length > 1) {
      // 既存のリストアイテムをクリア
      pickupIndexList.innerHTML = '';

      // 2件目以降をリストに追加
      for (let i = 1; i < pickupNews.length; i++) {
        const listItem = document.createElement('li');
        listItem.className = 'p-news-pickup__list-item';
        listItem.setAttribute('data-category', pickupNews[i].categorySlug);

        const newsCard = this.createNewsCardElement(pickupNews[i]);
        listItem.appendChild(newsCard);

        pickupIndexList.appendChild(listItem);
      }

      console.log('📎 ピックアップインデックス描画完了:', pickupNews.length - 1, '件');
    }
  }

  /**
   * メインニュースリストを描画（ページネーション対応）
   * 公安の情報管理のように精密に
   */
  renderMainNewsList(mainNews, allNews, currentPage = 1) {
    const mainList = document.querySelector('.p-news-content__list-index[data-index="news"]');
    if (!mainList) {
      console.log('⚠️ メインリストコンテナが見つかりません');
      return;
    }

    // 既存のリストアイテムをクリア
    mainList.innerHTML = '';

    // メインニュースを描画
    mainNews.forEach(newsItem => {
      const listItem = this.createNewsListItem(newsItem, 'regular');
      mainList.appendChild(listItem);
    });

    // フィルタリング用に全件データも非表示で追加（初回のみ）
    if (currentPage === 1) {
      allNews.forEach(newsItem => {
        const listItem = this.createNewsListItem(newsItem, 'all');
        listItem.style.display = 'none';
        mainList.appendChild(listItem);
      });
    }

    console.log('📋 メインニュースリスト描画完了:', {
      main: mainNews.length,
      total_for_filtering: currentPage === 1 ? allNews.length : 0,
      page: currentPage
    });
  }

  /**
   * ニュースカード要素を作成
   * コナンのトリック解明のような精密さで
   */
  createNewsCardElement(newsItem) {
    const cardElement = document.createElement('a');
    cardElement.href = newsItem.url;
    cardElement.className = 'c-news-card';
    cardElement.setAttribute('data-card', newsItem.id);
    cardElement.setAttribute('data-category', newsItem.categorySlug);

    // NewsCard コンポーネントの HTML 構造を正確に再現
    cardElement.innerHTML = `
      <figure class="c-news-card__pic">
        <img src="${newsItem.pic}" alt="${newsItem.title}" loading="lazy">
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
  createNewsListItem(newsItem, itemType) {
    const listItem = document.createElement('li');
    listItem.className = 'p-news-content__list-item';
    listItem.setAttribute('data-news-item', itemType);
    listItem.setAttribute('data-category', newsItem.categorySlug);

    const newsCard = this.createNewsCardElement(newsItem);
    listItem.appendChild(newsCard);

    return listItem;
  }

  /**
   * フィルタリング機能用にデータを保存
   * 公安の情報管理システムのように
   */
  storeDataForFiltering(newsData) {
    // グローバルに保存（既存のフィルタリングシステムが利用）
    window.newsData = newsData;

    // カテゴリー一覧も保存
    const categories = [...new Set(newsData.map(item => ({
      name: item.category,
      slug: item.categorySlug
    })))];

    window.newsCategories = categories;

    console.log('🗃️ フィルタリング用データ保存完了');
  }

  /**
   * エラーハンドリング
   * 事件解決の最後の砦として
   */
  handleError(error) {
    console.error('🚨 NewsAPIManager Error:', error);

    // ユーザーにエラーを表示
    this.showErrorMessage('ニュースの取得に失敗しました。しばらく後に再度お試しください。');

    // フォールバック: 既存の静的データを表示
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
    console.log('🔄 フォールバックコンテンツを表示');
    // 既存の静的なNewsCardを表示状態に戻す
    const staticCards = document.querySelectorAll('.c-news-card');
    staticCards.forEach(card => {
      card.style.display = 'block';
    });
  }

  /**
   * 公開API
   * 外部から安全にアクセスできるインターフェース
   */
  getPublicAPI() {
    return {
      refetch: () => this.fetchNewsData(),
      getCache: () => this.cache.get('newsData'),
      clearCache: () => this.cache.clear(),
      isLoading: () => this.isLoading
    };
  }
}
