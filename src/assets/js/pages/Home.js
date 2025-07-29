/**
 * Home Page API Manager
 * トップページでのみ動作するWordPress API取得クラス
 */

export class Home {
  constructor() {
    this.apiEndpoint = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2/projects';
    this.isHomePage = this.checkHomePage();

    if (this.isHomePage) {
      this.init();
    }
  }

  /**
   * ホームページかどうかをチェック
   * @returns {boolean}
   */
  checkHomePage() {
    const body = document.body;
    const hasHomeClass = body.classList.contains('p-home');
    const hasHomeDataAttribute = body.getAttribute('data-page') === 'home';

    return hasHomeClass || hasHomeDataAttribute;
  }

  /**
   * 初期化処理
   */
  init() {
    this.fetchProjects();
  }

  /**
   * プロジェクトデータを取得
   */
  async fetchProjects() {
    try {
      const response = await fetch(this.apiEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const projects = await response.json();

      console.log('取得したプロジェクト数:', projects.length);
      console.log('プロジェクトデータ:', projects);

      return projects;

    } catch (error) {
      console.error('エラー詳細:', {
        message: error.message,
        endpoint: this.apiEndpoint
      });
    }
  }
}
