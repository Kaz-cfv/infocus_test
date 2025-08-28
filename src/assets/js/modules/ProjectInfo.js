/**
 * Project Info Module
 * プロジェクト情報表示の制御を行う
 */

class ProjectInfo {
  constructor() {
    this.defaultTitle = null;
    this.filteredTitle = null;
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.defaultTitle = document.querySelector('.p-project-info__title[data-filter-type="default"]');
    this.filteredTitle = document.querySelector('.p-project-info__title[data-filter-type="filtered"]');

    if (!this.defaultTitle || !this.filteredTitle) {
      console.warn('⚠️ Project info elements not found');
      return;
    }
  }

  /**
   * フィルタリング状態に応じて表示を切り替える
   * @param {string|null} category - フィルタリング対象のカテゴリー（nullの場合は初期状態）
   * @param {boolean} isArchived - アーカイブ表示かどうか
   * @param {number} visibleCount - 表示中のプロジェクト数
   * @param {string|null} tag - フィルタリング対象のタグ（nullの場合はタグフィルタリングなし）
   */
  updateDisplay(category, isArchived = false, visibleCount = 0, tag = null) {
    if (!this.defaultTitle || !this.filteredTitle) {
      console.warn('⚠️ Cannot update display - elements not found');
      return;
    }

    if (category || isArchived || tag) {
      // タイトルテキストを更新
      const titleName = this.filteredTitle.querySelector('.p-project-info__title-name');
      const titleBack = this.filteredTitle.querySelector('.p-project-info__title-back');

      if (titleName) {
        if (isArchived) {
          titleName.textContent = `ARCHIVED PROJECTS - (${visibleCount})`;
        } else if (tag) {
          titleName.textContent = `Search results for "${tag.toUpperCase()}"`;
        } else if (category) {
          titleName.textContent = `Search results for "${category.toUpperCase()}"`;
        }
      }

      // アーカイブ表示時はバックボタンを非表示
      if (titleBack) {
        if (isArchived) {
          titleBack.style.display = 'none';
        } else {
          titleBack.style.display = 'inline-flex';
        }
      }

      // 表示状態を切り替え
      this.defaultTitle.setAttribute('data-state', 'false');
      this.filteredTitle.setAttribute('data-state', 'true');

    } else {
      // 表示状態を切り替え
      this.defaultTitle.setAttribute('data-state', 'true');
      this.filteredTitle.setAttribute('data-state', 'false');

      // フィルタリング表示のテキストをクリア
      const titleName = this.filteredTitle.querySelector('.p-project-info__title-name');
      const titleBack = this.filteredTitle.querySelector('.p-project-info__title-back');

      if (titleName) {
        titleName.textContent = '';
      }

      // バックボタンを表示状態に戻す
      if (titleBack) {
        titleBack.style.display = 'inline-flex';
      }
    }
  }

  /**
   * 現在の表示状態を取得
   * @returns {Object} 表示状態の詳細情報
   */
  getCurrentState() {
    const defaultVisible = this.defaultTitle?.getAttribute('data-state') === 'true';
    const filteredVisible = this.filteredTitle?.getAttribute('data-state') === 'true';

    return {
      mode: defaultVisible ? 'default' : 'filtered',
      defaultVisible,
      filteredVisible
    };
  }
}

export default ProjectInfo;
