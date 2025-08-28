/**
 * Project Detail Page Manager
 * プロジェクト詳細ページの機能を管理する
 */

import { ApiClient } from '../modules/ApiClient.js';

export class ProjectDetail {
  constructor() {
    if (!this.isProjectDetailPage()) {
      return;
    }

    this.apiClient = new ApiClient();
    this.currentSlug = this.getProjectSlugFromURL();
    this.init();
  }

  /**
   * プロジェクト詳細ページかどうかを判定
   */
  isProjectDetailPage() {
    const isProjectsURL = window.location.pathname.includes('/projects/');
    const hasSlug = window.location.pathname.split('/').length > 2;

    return isProjectsURL && hasSlug && !window.location.pathname.endsWith('/projects/');
  }

  /**
   * URLからプロジェクトスラッグを取得
   */
  getProjectSlugFromURL() {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 2]; // /projects/slug/ の slug部分
    return slug;
  }

  /**
   * 初期化処理
   */
  async init() {
    // APIからプロジェクトデータを取得
    await this.fetchProjectDetailData();
  }

  /**
   * プロジェクト詳細データを取得
   */
  async fetchProjectDetailData() {
    try {
      console.log('🚀 ProjectDetail.js: fetchProjectDetailData開始');

      // 全プロジェクトデータを取得
      const allProjectsData = await this.apiClient.getProjectsData();

      // 現在のスラッグに一致するプロジェクトを検索
      const currentProject = allProjectsData.find(project => project.slug === this.currentSlug);

      if (currentProject) {
        console.log('✅ ProjectDetail.js: 該当プロジェクト発見:', currentProject);

        // カスタムイベントで他のコンポーネントにデータを配信
        const event = new CustomEvent('projectDetailDataLoaded', {
          detail: currentProject
        });
        document.dispatchEvent(event);
      } else {
        console.warn('⚠️ ProjectDetail.js: 該当プロジェクトが見つかりません:', this.currentSlug);
      }

    } catch (error) {
      console.error('❌ Failed to fetch project detail data:', error);
    }
  }
}
