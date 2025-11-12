/**
 * Projects Page Manager
 * プロジェクト一覧ページの機能を管理する
 */

import URLUtils from '../modules/URLUtils.js';
import ProjectFilter from '../modules/ProjectFilter.js';
import ProjectInfo from '../modules/ProjectInfo.js';
import ProjectCategory from '../modules/ProjectCategory.js';
import { ApiClient } from '../modules/ApiClient.js';

/**
 * ProjectRenderer Class
 * プロジェクトカードのレンダリングを担当
 */
class ProjectRenderer {
  constructor() {
    this.currentLanguage = this.detectCurrentLanguage();
  }

  /**
   * 現在の言語を検出
   * @returns {string} 'en' または 'ja'
   */
  detectCurrentLanguage() {
    return window.location.pathname.includes('/en/') ? 'en' : 'ja';
  }

  /**
   * 言語に応じたプロジェクトURLを生成
   * @param {string} slug - プロジェクトのスラッグ
   * @returns {string} 適切な言語パスのURL
   */
  getLocalizedProjectURL(slug) {
    if (this.currentLanguage === 'en') {
      return `/en/projects/${slug}/`;
    } else {
      return `/projects/${slug}/`;
    }
  }

  /**
   * カテゴリーリンクを言語対応にする
   * @param {string} categorySlug - カテゴリーのスラッグ
   * @returns {string} 適切な言語パスのカテゴリーURL
   */
  getLocalizedCategoryURL(categorySlug) {
    if (this.currentLanguage === 'en') {
      return `/en/projects/?category=${categorySlug}`;
    } else {
      return `/projects/?category=${categorySlug}`;
    }
  }

  /**
   * プロジェクトデータを整形
   * @param {Array} projectsData - APIから取得したプロジェクトデータ
   * @returns {Array} 整形されたプロジェクト配列
   */
  formatProjectsData(projectsData) {
    if (!Array.isArray(projectsData)) {
      console.warn('⚠️ projectsData is not an array:', projectsData);
      return [];
    }

    return projectsData
      .filter(item => {
        const hasTitle = !!item.title;
        const hasSlug = !!item.slug;
        return hasTitle && hasSlug;
      })
      .map((item, index) => {
        let categories = [];

        // カテゴリー情報（言語対応版）
        if (item.taxonomy?.projects && Array.isArray(item.taxonomy.projects)) {
          categories = item.taxonomy.projects.map(category => ({
            name: category.name,
            url: this.getLocalizedCategoryURL(category.slug)
          }));
        }

        // 画像URL取得
        const imageSrcSp = item.acfs?.thumbnail?.image?.sizes.medium || '';
        const imageSrcPc = item.acfs?.thumbnail?.image?.sizes.medium_large || '';

        // カテゴリースラッグの配列を作成
        const categorySlugs = (item.taxonomy?.projects && Array.isArray(item.taxonomy.projects))
          ? item.taxonomy.projects.map(tag => tag.slug)
          : [];

        // タグスラッグの配列を作成
        const tagSlugs = (item.acfs?.tags && Array.isArray(item.acfs.tags))
          ? item.acfs.tags.filter(tag => tag.terms?.slug).map(tag => tag.terms.slug)
          : [];

        // アーカイブフラグの取得
        const isArchived = item.acfs?.is_archived || false;

        return {
          id: item.id || index + 1,
          title: item.title || 'No Title',
          tags: categories,
          imageSrcSp: imageSrcSp,
          imageSrcPc: imageSrcPc,
          url: this.getLocalizedProjectURL(item.slug),
          type: "default",
          categorySlugs: categorySlugs,
          tagSlugs: tagSlugs,
          isArchived: isArchived,
          language: this.currentLanguage
        };
      });
  }

  /**
   * プロジェクトカードHTMLを生成
   * @param {Array} projects - プロジェクト配列
   * @param {string} loadingStrategy - 'eager' or 'lazy'
   * @returns {string} HTMLテンプレート
   */
  renderProjectCards(projects, loadingStrategy = 'lazy') {
    return projects.map(project => {
      const tagsHtml = project.tags.map((category, index) => {
        const separator = index < project.tags.length - 1
          ? '<span class="c-project-card__separator js-hover-item">,</span>'
          : '';
        return `<a href="${category.url}" class="c-project-card__category js-hover-item">${category.name}</a>${separator}`;
      }).join('');

      return `
        <li class="p-project-list__item js-search-target"
          data-categories="${project.categorySlugs.join(',')}"
          data-tags="${project.tagSlugs.join(',')}"
          data-project-id="${project.id}"
          data-archived="${project.isArchived}"
          data-language="${project.language}"
        >
          <div class="c-project-card mouse-over" data-id="${project.id}" data-type="${project.type}">
            <a href="${project.url}" class="c-project-card__image-wrapper">
              <picture>
                <source media="(min-width: 960px)" srcset="${project.imageSrcPc}">
                <img
                  src="${project.imageSrcSp}"
                  alt="${project.title}"
                  class="c-project-card__image"
                  loading="${loadingStrategy}"
                  decoding="async"
                />
              </picture>
            </a>
            <div class="c-project-card__content">
              <h3 class="c-project-card__title">
                <a href="${project.url}">
                  ${project.title}
                </a>
              </h3>
              <div class="c-project-card__tags js-hover">
                ${tagsHtml}
              </div>
            </div>
          </div>
        </li>
      `;
    }).join('');
  }

  /**
   * プロジェクトリストを描画
   * @param {Array} projectsData - APIから取得したプロジェクトデータ
   */
  render(projectsData) {
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) {
      console.warn('⚠️ projectsList element not found');
      return;
    }

    // プロジェクトデータを整形
    const projects = this.formatProjectsData(projectsData);

    if (projects.length === 0) {
      console.warn('⚠️ No projects to render');
      return;
    }

    // プロジェクト数を更新
    this.updateProjectCount(projects.length);

    // アーカイブリンクを更新
    this.updateArchivedProjectsLink();

    // 全プロジェクトを一度に表示（先頭20件はeager、残りはlazy）
    const eagerCount = Math.min(20, projects.length);
    const eagerProjects = projects.slice(0, eagerCount);
    const lazyProjects = projects.slice(eagerCount);

    // 全てのHTMLを一度に追加
    projectsList.innerHTML =
      this.renderProjectCards(eagerProjects, 'eager') +
      this.renderProjectCards(lazyProjects, 'lazy');

    // ホバー効果を初期化
    this.reinitializeHover(projectsList);

    console.log(`✨ All projects rendered (${this.currentLanguage}): ${projects.length} projects`);

    // プロジェクトカードの準備完了を通知（フィルタリング用）
    setTimeout(() => {
      const allCardsReadyEvent = new CustomEvent('projectCardsReady', {
        detail: { count: projects.length }
      });
      document.dispatchEvent(allCardsReadyEvent);
      console.log('📢 projectCardsReady event dispatched');
    }, 50);
  }

  /**
   * プロジェクト数を更新
   * @param {number} count - プロジェクト数
   */
  updateProjectCount(count) {
    const countElements = document.querySelectorAll('.p-project-info__title-num');
    countElements.forEach(element => {
      element.textContent = `(${count})`;
    });
  }

  /**
   * アーカイブリンクを言語対応にする
   */
  updateArchivedProjectsLink() {
    const archivedLink = document.getElementById('archivedProjectsLink');
    if (archivedLink) {
      if (this.currentLanguage === 'en') {
        archivedLink.href = '/en/projects/?archived=true';
      } else {
        archivedLink.href = '/projects/?archived=true';
      }
    }
  }

  /**
   * ホバー効果を再初期化
   * @param {HTMLElement} projectsList - プロジェクトリスト要素
   */
  reinitializeHover(projectsList) {
    setTimeout(() => {
      // NavigationHoverの再初期化イベントを発火
      const hoverEvent = new CustomEvent('reinitializeHover', {
        detail: { element: projectsList }
      });
      document.dispatchEvent(hoverEvent);

      // グローバルなNavigationHoverインスタンスが存在する場合、直接初期化
      if (window.navigationHover && typeof window.navigationHover.initializeInElement === 'function') {
        window.navigationHover.initializeInElement(projectsList);
      }

      // 手動でホバー処理を追加
      const hoverContainers = projectsList.querySelectorAll('.js-hover');
      hoverContainers.forEach((container) => {
        const items = container.querySelectorAll('.js-hover-item');
        items.forEach((item) => {
          item.addEventListener('mouseenter', (e) => {
            const hoveredItem = e.currentTarget;
            hoveredItem.classList.add('is-hovered');

            items.forEach(siblingItem => {
              if (siblingItem !== hoveredItem) {
                siblingItem.classList.add('is-dimmed');
              }
            });
          });

          item.addEventListener('mouseleave', (e) => {
            const leftItem = e.currentTarget;
            leftItem.classList.remove('is-hovered');

            items.forEach(siblingItem => {
              if (siblingItem !== leftItem) {
                siblingItem.classList.remove('is-dimmed');
              }
            });
          });
        });
      });
    }, 100);
  }
}

export class Projects {
  constructor() {
    if (!this.isProjectsPage()) {
      return;
    }

    this.apiClient = new ApiClient();
    this.projectFilter = new ProjectFilter();
    this.projectInfo = new ProjectInfo();
    this.projectCategory = new ProjectCategory();
    this.projectRenderer = new ProjectRenderer(); // ★ ProjectRendererを初期化
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
    // URLパラメータを先に取得
    this.handleURLParameters();

    // APIからプロジェクトデータを取得
    await this.fetchProjectsData();

    // 全てのプロジェクトカードが準備完了した後にフィルタリングを実行
    document.addEventListener('projectCardsReady', () => {
      console.log('🎯 All project cards are ready for filtering');
      this.setupProjectFiltering();
    });

    // URLにsearchパラメーターがあれば、検索を実行
    this.handleSearchParameter();
  }

  /**
   * プロジェクトデータを取得してレンダリング
   */
  async fetchProjectsData() {
    try {
      const projectsData = await this.apiClient.getProjectsData();
      // console.log('🚀 Projects.js: APIデータ取得完了:', projectsData);

      // ProjectRendererでカード生成
      this.projectRenderer.render(projectsData);

      // カスタムイベントで他のコンポーネントにデータを配信（互換性のため残す）
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
      // console.log(`🎯 Filtering by category: "${categoryParam}"`);
      this.currentCategory = categoryParam;
    } else {
      // console.log('📁 Showing all projects');
      this.currentCategory = null;
    }

    if (tagParam) {
      // console.log(`🏷️ Filtering by tag: "${tagParam}"`);
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
   * URLのsearchパラメーターを処理して検索を実行
   */
  handleSearchParameter() {
    const searchQuery = URLUtils.getURLParameter('search');

    if (searchQuery) {
      console.log(`🔍 URLパラメーターから検索クエリを検出: "${searchQuery}"`);

      // 検索フィールドに値をセット
      this.setSearchInputValue(searchQuery);

      // SearchManagerが初期化されたら検索を実行
      this.triggerSearchWithDelay(searchQuery);
    }
  }

  /**
   * 検索フィールドに値をセット
   * @param {string} query - 検索クエリ
   */
  setSearchInputValue(query) {
    const searchInputPC = document.querySelector('#search_category');
    const searchInputSP = document.querySelector('#search_category_sp');

    if (searchInputPC) {
      searchInputPC.value = query;
      // inputイベントを手動で発火してSearchUIManagerに通知
      searchInputPC.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`✅ PC検索フィールドに値をセット: "${query}"`);
    }

    if (searchInputSP) {
      searchInputSP.value = query;
      // inputイベントを手動で発火してSearchUIManagerに通知
      searchInputSP.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`✅ SP検索フィールドに値をセット: "${query}"`);
    }
  }

  /**
   * 少し待ってから検索を実行（SearchManagerの初期化待ち）
   * @param {string} query - 検索クエリ
   */
  triggerSearchWithDelay(query) {
    // SearchManagerがグローバルに存在するか確認
    const checkSearchManager = () => {
      if (window.searchManager && typeof window.searchManager.performSearch === 'function') {
        console.log('✅ SearchManagerが見つかりました。検索を実行します...');
        window.searchManager.performSearch(query, 'url-parameter');
      } else {
        console.log('⌛ SearchManagerの初期化を待機中...');
        setTimeout(checkSearchManager, 100);
      }
    };

    // 少し待ってからチェックを開始
    setTimeout(checkSearchManager, 300);
  }

  /**
   * プロジェクトカードの取得とフィルタリング実行
   */
  getProjectCards() {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-categories][data-tags][data-archived]');
    // console.log(`🃏 Found ${projectCards.length} project cards`);

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

    // 3. カテゴリー選択の視覚化更新（アーカイブ表示時の情報も渡す）
    this.projectCategory.updateSelection(this.currentCategory, this.showArchived);

    // 4. アーカイブボタンの表示制御
    this.handleArchiveButtonVisibility();

    // 5. アーカイブカテゴリーボタンの表示制御
    this.handleArchiveCategoryVisibility();

    // console.log(`✅ Filter completed: ${filterResult.visible} visible, ${filterResult.hidden} hidden`);
  }

  /**
   * アーカイブされたプロジェクトが存在するかチェック
   * @returns {boolean} アーカイブされたプロジェクトが存在するかどうか
   */
  checkArchivedProjectsExist() {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-archived]');

    // 少なくとも1つのdataset.archivedが"true"のカードが存在するかチェック
    for (const card of projectCards) {
      if (card.dataset.archived === 'true') {
        return true;
      }
    }

    return false;
  }

  /**
   * アーカイブボタンの表示制御
   * URLパラメーターによる絞り込み中は非表示にする
   * アーカイブされたプロジェクトが存在しない場合も非表示にする
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
      // アーカイブされたプロジェクトが存在するかチェック
      const hasArchivedProjects = this.checkArchivedProjectsExist();
      archiveButton.style.display = hasArchivedProjects ? 'flex' : 'none';
    }
  }

  /**
   * アーカイブカテゴリーボタンの表示制御
   * URLパラメーターによる絞り込み中はアーカイブカテゴリーボタンを非表示にする
   * ただし、archived=trueの場合は表示する
   * アーカイブされたプロジェクトが存在しない場合も非表示にする
   */
  handleArchiveCategoryVisibility() {
    const archiveCategoryButton = document.querySelector('.p-project-head__category-item[data-category="ARCHIVED"]');

    if (!archiveCategoryButton) {
      return;
    }

    // アーカイブされたプロジェクトが存在するかチェック
    const hasArchivedProjects = this.checkArchivedProjectsExist();

    // アーカイブが存在しない場合は常に非表示
    if (!hasArchivedProjects) {
      archiveCategoryButton.style.display = 'none';
      archiveCategoryButton.style.pointerEvents = 'none';
      return;
    }

    // カテゴリーまたはタグ絞り込みがある場合は非表示、アーカイブ表示の場合は表示
    if ((this.currentCategory || this.currentTag) && !this.showArchived) {
      archiveCategoryButton.style.display = 'none';
      archiveCategoryButton.style.pointerEvents = 'none';
    } else {
      archiveCategoryButton.style.display = 'block';
      archiveCategoryButton.style.pointerEvents = 'auto';
    }
  }
}
