/**
 * News - News一覧・詳細ページの管理クラス
 */

import { NewsManager, NewsAPI, NewsList } from '../modules/NewsManager';

export class News {
  constructor() {
    this.newsManager = new NewsManager();
    this.init();
  }

  async init() {
    const currentPath = window.location.pathname;

    // 一覧ページのみ初期化（詳細ページはAstroの静的生成に任せる）
    if (currentPath === '/news/' || currentPath === '/news') {
      await this.newsManager.initList();
    }
  }

}
