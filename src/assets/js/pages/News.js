/**
 * News - News一覧・詳細ページの管理クラス
 */

import { NewsManager, NewsAPI, NewsList, NewsDetail } from '../modules/NewsManager';

export class News {
  constructor() {
    this.newsManager = new NewsManager();
    this.init();
  }

  async init() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/news/') && currentPath !== '/news/') {
      // 詳細ページ
      const newsId = this.extractNewsId(currentPath);
      if (newsId) {
        await this.newsManager.initDetail(newsId);
      }
    } else if (currentPath === '/news/' || currentPath.includes('/news')) {
      // 一覧ページ
      await this.newsManager.initList();
    }
  }

  extractNewsId(path) {
    const matches = path.match(/\/news\/(\d+)/);
    return matches ? matches[1] : null;
  }
}
