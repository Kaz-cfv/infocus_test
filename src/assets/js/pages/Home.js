/**
 * Home Page API Manager
 * トップページでのみ動作するWordPress API取得クラス
 */

import { ApiClient } from '../modules/ApiClient.js';

export class Home {
  constructor() {
    this.isHomePage = this.checkHomePage();
    this.apiClient = new ApiClient();

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
  async init() {
    await this.fetchHomeData();
  }

  /**
   * Homeページのデータを取得
   */
  async fetchHomeData() {
    try {
      const homeData = await this.apiClient.getHomeData();
      // console.log('Home data:', homeData);

      // カスタムイベントで他のコンポーネントにデータを配信
      const event = new CustomEvent('homeDataLoaded', {
        detail: homeData
      });
      document.dispatchEvent(event);

    } catch (error) {
      console.error('Failed to fetch home data:', error);
    }
  }
}
