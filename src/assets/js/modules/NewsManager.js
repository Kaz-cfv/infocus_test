/**
 * Newsを管理するクラス
 */

class NewsAPI {
  constructor() {
    this.baseURL = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2';
    this.endpoint = '/news';
  }

  /**
   * ニュース一覧を取得
   */
  async fetchNewsList(params = {}) {
    try {
      const url = new URL(`${this.baseURL}${this.endpoint}`);

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      // console.log('🔍 API呼び出し URL:', url.toString());

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 取得したニュースデータ:', data);

      return data;
    } catch (error) {
      console.error('❌ ニュース取得エラー:', error);
      throw error;
    }
  }

}

class NewsList {
  constructor(newsAPI) {
    this.newsAPI = newsAPI;
    this.currentData = [];
    this.formattedData = [];
    this.currentPage = 1;
    this.perPage = 10;
  }

  /**
   * WordPressデータをNewsCard形式に変換
   */
  formatNewsData(wpDataArray) {
    if (!Array.isArray(wpDataArray)) {
      console.error('❌ formatNewsDataに配列以外が渡されました:', wpDataArray);
      return [];
    }

    const formatted = wpDataArray.map((item, index) => {
      const formatDate = (dateString) => {
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}.${month}.${day}`;
        } catch (error) {
          console.warn('⚠️ 日付変換エラー:', dateString, error);
          return '----.--.--';
        }
      };

      /**
       * サムネイル画像を取得
       */
      const getThumbnail = (item) => {
        if (item.acfs?.news_mv?.sizes?.thumbnail) {
          return item.acfs.news_mv.sizes.large;
        }
        if (item.featured_media && item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          return item._embedded['wp:featuredmedia'][0].source_url;
        }
        return '/common/images/news/default.png';
      };

      const generateSlug = (title, id) => {
        if (item.slug) return item.slug;

        const cleanTitle = (title || 'news-article')
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        return cleanTitle || `news-${id}`;
      };

      const slug = generateSlug(item.title?.rendered || item.title, item.id || index);

      // タイトルの様々な形式に対応
      let title = 'タイトルなし';
      if (typeof item.title === 'string') {
        title = item.title;
      } else if (item.title?.rendered) {
        title = item.title.rendered;
      } else if (item.title_plain) {
        title = item.title_plain;
      } else if (item.acfs?.news_title) {
        title = item.acfs.news_title;
      }

      const result = {
        id: item.id || index,
        title: title,
        date: formatDate(item.date),
        category: item.type || 'News',
        url: `/news/${slug}`,
        pic: getThumbnail(item),
        slug: slug
      };

      return result;
    });

    return formatted;
  }

  /**
   * ニュース一覧の初期化
   */
  async init() {
    try {
      // Step 1: APIからデータ取得
      await this.loadNews();

      // Step 2: データをフォーマット
      this.formattedData = this.formatNewsData(this.currentData);

      // Step 3: window変数に格納
      window.NewsList = this.formattedData;
      // console.log('💾 window.NewsList に格納:', window.NewsList);

    } catch (error) {
      console.error('❌ 初期化に失敗:', error);
      throw error;
    }
  }

  /**
   * ニュースデータを読み込み
   */
  async loadNews(params = {}) {
    const defaultParams = {
      page: this.currentPage,
      per_page: this.perPage,
      _embed: true
    };

    const mergedParams = { ...defaultParams, ...params };
    this.currentData = await this.newsAPI.fetchNewsList(mergedParams);

    return this.currentData;
  }

  /**
   * 検索・フィルタリング
   */
  async search(searchParams) {
    console.log('🔍 検索実行:', searchParams);

    const params = {};

    if (searchParams.keyword) {
      params.search = searchParams.keyword;
    }

    if (searchParams.category) {
      params.categories = searchParams.category;
    }

    if (searchParams.tag) {
      params.tags = searchParams.tag;
    }

    await this.loadNews(params);
    this.formattedData = this.formatNewsData(this.currentData);
    window.NewsList = this.formattedData;

    return this.formattedData;
  }
}


// メインのNewsManagerクラス
class NewsManager {
  constructor() {
    this.api = new NewsAPI();
    this.listManager = new NewsList(this.api);
  }

  /**
   * 一覧ページの初期化
   */
  async initList() {
    return await this.listManager.init();
  }

  /**
   * 検索機能
   */
  async search(searchParams) {
    return await this.listManager.search(searchParams);
  }
}

/**
 * window.NewsListから直接DOM描画する関数
 * News一覧ページでのみ実行される
 */
function renderNewsFromWindow() {
  // News一覧ページかどうかを判定
  const newsContainer = document.querySelector('[data-index="news"]');
  const isNewsListPage = newsContainer &&
                         (window.location.pathname === '/news/' || window.location.pathname === '/news') &&
                         !window.location.pathname.match(/\/news\/[^\/]+$/);

  // console.log('🔍 ページ判定:', {
  //   hasNewsContainer: !!newsContainer,
  //   pathname: window.location.pathname,
  //   bodyClasses: Array.from(document.querySelector('body').classList),
  //   isNewsListPage: isNewsListPage
  // });

  if (!isNewsListPage) {
    return;
  }

  if (!window.NewsList || !Array.isArray(window.NewsList)) {
    console.error('❌ window.NewsListが存在しないか、配列ではありません:', window.NewsList);
    return;
  }

  if (!newsContainer) {
    console.error('❌ data-index="news" の要素が見つかりません');
    return;
  }

  newsContainer.innerHTML = '';

  window.NewsList.forEach((newsData, index) => {
    const li = document.createElement('li');
    li.className = 'p-news-content__list-item';
    li.setAttribute('data-id', newsData.id);

    li.innerHTML = `
      <a href="${newsData.url}" class="c-news-card" data-card="${newsData.id}">
        <figure class="c-news-card__pic">
          <img src="${newsData.pic}" alt="${newsData.title}" loading="lazy">
        </figure>
        <div class="c-news-card__info">
          <p class="c-news-card__info-title">${newsData.title}</p>
          <div class="c-news-card__info-sub">
            <time class="c-news-card__info-date">${newsData.date}</time>
            <span class="c-news-card__info-category">${newsData.category}</span>
          </div>
        </div>
      </a>
    `;

    newsContainer.appendChild(li);
  });
}

// グローバルスコープに追加
window.newsManager = new NewsManager();
window.renderNewsFromWindow = renderNewsFromWindow;


// DOM準備完了後に実行（一覧ページのみ）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // 一覧ページの初期化
    if (window.NewsList && Array.isArray(window.NewsList) && window.NewsList.length > 0) {
      window.renderNewsFromWindow();
    } else {
      console.log('🔄 APIからデータ取得');
      try {
        await window.newsManager.initList();
        window.renderNewsFromWindow();
      } catch (error) {
        console.error('🚨 初期化中にエラーが発生:', error);
      }
    }
  });
} else {
  // 一覧ページの初期化
  if (window.NewsList && Array.isArray(window.NewsList) && window.NewsList.length > 0) {
    window.renderNewsFromWindow();
  } else {
    (async () => {
      try {
        await window.newsManager.initList();
        window.renderNewsFromWindow();
      } catch (error) {
        console.error('🚨 初期化中にエラーが発生:', error);
      }
    })();
  }
}

export { NewsManager, NewsAPI, NewsList, renderNewsFromWindow };
