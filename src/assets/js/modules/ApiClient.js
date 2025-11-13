export class ApiClient {
  constructor() {
    this.baseUrl = 'https://infocus.wp.site-prev2.com/wp-json/infocus/v1/options/';
  }

  /**
   * 現在のURLから言語を判定する
   * @returns {string} 'en' または 'ja'
   */
  getCurrentLanguage() {
    // ブラウザ環境でのみwindow.locationを使用
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname;
      // URLに'/en/'が含まれているかチェック
      return currentPath.includes('/en/') ? 'en' : 'ja';
    }

    // サーバーサイドレンダリング時は、Astroのcontextから取得する方法もあります
    // ここではデフォルトで日本語を返す
    return 'ja';
  }

  /**
   * URLにlangパラメータを追加する
   * @param {string} url - 基本URL
   * @returns {string} langパラメータ付きURL
   */
  addLanguageParameter(url) {
    const lang = this.getCurrentLanguage();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}lang=${lang}`;
  }

  async fetchData(endpoint) {
    try {
      let url = `${this.baseUrl}${endpoint}`;

      // ホームページのデータは常に日本語版を取得
      if (endpoint === 'home') {
        // なにもしない
      } else {
        url = this.addLanguageParameter(url);
      }

      const response = await fetch(url);

      // console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('API Response:', data);

      return data;

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getHomeData() {
    return this.fetchData('home');
  }

  /**
   * プロジェクト一覧データを取得
   */
  async getProjectsData() {
    let allProjects = [];
    let currentPage = 1;
    let hasMorePages = true;
    const lang = this.getCurrentLanguage();

    while (hasMorePages) {
      // langパラメータを含むURLを構築
      const url = `https://infocus.wp.site-prev2.com/wp-json/wp/v2/projects?lang=${lang}&per_page=100&page=${currentPage}&orderby=menu_order&order=asc`;
      // console.log('API Request:', url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pageData = await response.json();

        // ページデータが配列でない、または空の場合はループを終了
        if (!Array.isArray(pageData) || pageData.length === 0) {
          hasMorePages = false;
        } else {
          allProjects = [...allProjects, ...pageData];
          // 取得件数が100件未満なら、最後のページと判断
          if (pageData.length < 100) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }
      } catch (error) {
        console.error('API Error:', error);
        hasMorePages = false; // エラー発生時もループを終了
      }
    }

    // console.log(`✅ Total projects fetched (${lang}):`, allProjects.length);
    return allProjects;
  }

  /**
   * チーム一覧データを取得
   */
  async getTeamData() {
    let allTeams = [];
    let currentPage = 1;
    let hasMorePages = true;
    const lang = this.getCurrentLanguage();

    while (hasMorePages) {
      // langパラメータを含むURLを構築
      const url = `https://infocus.wp.site-prev2.com/wp-json/wp/v2/team?lang=${lang}&per_page=50&page=${currentPage}&orderby=menu_order&order=asc`;
      // console.log('API Request:', url);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pageData = await response.json();

        // ページデータが配列でない、または空の場合はループを終了
        if (!Array.isArray(pageData) || pageData.length === 0) {
          hasMorePages = false;
        } else {
          allTeams = [...allTeams, ...pageData];
          // 取得件数が50件未満なら、最後のページと判断
          if (pageData.length < 50) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }
      } catch (error) {
        console.error('API Error:', error);
        hasMorePages = false; // エラー発生時もループを終了
      }
    }

    // console.log(`✅ Total teams fetched (${lang}):`, allTeams.length);
    return allTeams;
  }

  /**
   * Astroのcontextから言語情報を取得する場合の代替メソッド
   * @param {string} pathname - Astroから渡されるpathname
   * @returns {string} 'en' または 'ja'
   */
  static getLanguageFromPath(pathname) {
    return pathname.includes('/en/') ? 'en' : 'ja';
  }

  /**
   * Astro環境での使用を想定した静的メソッド版のAPIクライアント
   * @param {string} pathname - 現在のパス
   * @returns {ApiClient} 言語設定済みのAPIクライアントインスタンス
   */
  static createWithLanguage(pathname) {
    const client = new ApiClient();
    const lang = ApiClient.getLanguageFromPath(pathname);

    // 言語を固定設定するためのオーバーライド
    client.getCurrentLanguage = () => lang;

    return client;
  }
}
