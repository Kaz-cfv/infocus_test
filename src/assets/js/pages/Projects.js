/**
 * Projects Page Manager
 * プロジェクト一覧ページの機能を管理する
 */

import URLUtils from '../modules/URLUtils.js';
import ProjectFilter from '../modules/ProjectFilter.js';
import ProjectInfo from '../modules/ProjectInfo.js';
import ProjectCategory from '../modules/ProjectCategory.js';
import { ApiClient } from '../modules/ApiClient.js';

export class Projects {
  constructor() {
    if (!this.isProjectsPage()) {
      return;
    }

    this.apiClient = new ApiClient();
    this.projectFilter = new ProjectFilter();
    this.projectInfo = new ProjectInfo();
    this.projectCategory = new ProjectCategory();
    this.currentCategory = null;
    this.currentCategoryName = null;
    this.currentTag = null;
    this.currentTagName = null;
    this.showArchived = false;
    this.init();
  }

  /**
   * プロジェクトページかどうかを判定
   */
  isProjectsPage() {
    // プロジェクトリストのコンテナが存在するかで判定（動的実装対応）
    const hasProjectsList = document.querySelector('.p-project-list') !== null;
    const hasProjectLayout = document.querySelector('.p-project-layout') !== null;
    const isProjectsURL = window.location.pathname.includes('/projects');

    return hasProjectsList || hasProjectLayout || isProjectsURL;
  }

  /**
   * 初期化処理
   */
  async init() {
    // APIからプロジェクトデータを取得
    await this.fetchProjectsData();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupProjectFiltering();
      });
    } else {
      this.setupProjectFiltering();
    }
  }

  /**
   * プロジェクトデータを取得
   */
  async fetchProjectsData() {
    try {
      const projectsData = await this.apiClient.getProjectsData();
      // console.log('🚀 Projects.js: APIデータ取得完了:', projectsData);

      // カスタムイベントで他のコンポーネントにデータを配信
      const event = new CustomEvent('projectsDataLoaded', {
        detail: projectsData
      });
      document.dispatchEvent(event);

    } catch (error) {
      console.error('❌ Failed to fetch projects data:', error);
    }
  }

  /**
   * プロジェクトフィルタリングのセットアップ
   */
  setupProjectFiltering() {
    // URLパラメーターの取得
    this.handleURLParameters();

    // プロジェクトカードの取得とフィルタリング実行
    this.getProjectCards();
  }

  /**
   * URLパラメーターの処理
   */
  handleURLParameters() {
    const categoryParam = URLUtils.getURLParameter('category');
    const tagParam = URLUtils.getURLParameter('tag');
    const archivedParam = URLUtils.getURLParameter('archived');

    // アーカイブフラグの判定
    this.showArchived = archivedParam === 'true';

    if (categoryParam) {
      console.log(`🎯 Filtering by category: "${categoryParam}"`);
      this.currentCategory = categoryParam;
    } else {
      console.log('📁 Showing all projects');
      this.currentCategory = null;
    }

    if (tagParam) {
      console.log(`🏷️ Filtering by tag: "${tagParam}"`);
      this.currentTag = tagParam;

      // タグ名を取得する
      this.currentTagName = this.getTagNameFromSlug(tagParam);
    } else {
      this.currentTag = null;
      this.currentTagName = null;
    }

    if (this.showArchived) {
      console.log('🗃️ Showing archived projects');
    }
  }

  /**
   * タグスラッグからタグ名を取得する
   * @param {string} tagSlug - タグのスラッグ
   * @returns {string} タグ名
   */
  getTagNameFromSlug(tagSlug) {
    // グローバルのタグマッピングから取得
    if (window.projectTagMap && window.projectTagMap[tagSlug]) {
      return window.projectTagMap[tagSlug];
    }

    // フォールバック: スラッグを大文字化して返す
    console.warn(`⚠️ Tag name not found for slug: ${tagSlug}`);
    return tagSlug.toUpperCase();
  }

  /**
   * プロジェクトカードの取得とフィルタリング実行
   */
  getProjectCards() {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-categories][data-tags][data-archived]');
    console.log(`🃏 Found ${projectCards.length} project cards`);

    this.projectCards = projectCards;

    // フィルタリングを実行
    this.applyCurrentFilter();
  }

  /**
  * 現在のカテゴリー・タグ設定に基づいてフィルタリングと表示を実行
  */
  applyCurrentFilter() {
  // 1. プロジェクトカードのフィルタリング
  let filterResult;
  if (this.showArchived) {
    // アーカイブフィルタリングを実行
    filterResult = this.projectFilter.filterByArchived(true);
  } else if (this.currentTag) {
    // タグフィルタリングを実行
    filterResult = this.projectFilter.filterByTag(this.currentTag);
  } else {
    // 通常のカテゴリーフィルタリングを実行
    filterResult = this.projectFilter.filterByCategory(this.currentCategory);
  }

  // 2. プロジェクト情報表示の更新（アーカイブ表示時は件数も渡す）
  this.projectInfo.updateDisplay(this.currentCategory, this.showArchived, filterResult.visible, this.currentTagName);

  // 3. カテゴリー選択の視觚化更新（アーカイブ表示時の情報も渡す）
    this.projectCategory.updateSelection(this.currentCategory, this.showArchived);

    // 4. アーカイブボタンの表示制御
    this.handleArchiveButtonVisibility();

    // 5. アーカイブカテゴリーボタンの表示制御
    this.handleArchiveCategoryVisibility();

    console.log(`✅ Filter completed: ${filterResult.visible} visible, ${filterResult.hidden} hidden`);
  }

  /**
   * アーカイブボタンの表示制御
   * URLパラメーターによる絞り込み中は非表示にする
   */
  handleArchiveButtonVisibility() {
    const archiveButton = document.querySelector('.p-project-list__btn');

    if (!archiveButton) {
      return;
    }

    // URLパラメーターが存在する場合（絞り込み検索中またはアーカイブ表示中）はボタンを非表示
    if (this.currentCategory || this.currentTag || this.showArchived) {
      archiveButton.style.display = 'none';
    } else {
      archiveButton.style.display = 'flex';
    }
  }

  /**
   * アーカイブカテゴリーボタンの表示制御
   * URLパラメーターによる絞り込み中はアーカイブカテゴリーボタンを非表示にする
   * ただし、archived=trueの場合は表示する
   */
  handleArchiveCategoryVisibility() {
    const archiveCategoryButton = document.querySelector('.p-project-head__category-item[data-category="ARCHIVED"]');

    if (!archiveCategoryButton) {
      return;
    }

    // カテゴリーまたはタグ絞り込みがある場合は非表示、アーカイブ表示の場合は表示
    if ((this.currentCategory || this.currentTag) && !this.showArchived) {
      archiveCategoryButton.style.visibility = 'hidden';
      archiveCategoryButton.style.pointerEvents = 'none';
    } else {
      archiveCategoryButton.style.visibility = 'visible';
      archiveCategoryButton.style.pointerEvents = 'auto';
    }
  }
}
