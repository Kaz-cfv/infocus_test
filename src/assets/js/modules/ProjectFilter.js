/**
 * Project Filter Module
 * プロジェクトカードのフィルタリング機能を管理する
 */

class ProjectFilter {
  constructor() {
    this.hiddenCardClass = 'is-filtered-hidden';
    this.setupStyles();
  }

  /**
   * フィルタリング用のCSSスタイルを動的に追加
   */
  setupStyles() {
    const styleId = 'project-filter-styles';

    // 既存のスタイルタグがあれば削除
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 新しいスタイルタグを作成
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .p-project-list__item.${this.hiddenCardClass} {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * カテゴリーによるフィルタリング実行
   * @param {string|null} targetCategory - フィルタリング対象のカテゴリー（nullの場合は全て表示）
   */
  filterByCategory(targetCategory) {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-categories]');

    let visibleCount = 0;
    let hiddenCount = 0;

    projectCards.forEach((card, index) => {
      const categoriesAttr = card.getAttribute('data-categories');
      const archivedAttr = card.getAttribute('data-archived');
      const projectId = card.getAttribute('data-project-id');

      // カテゴリー文字列を配列に変換（空文字の場合は空配列）
      const categories = categoriesAttr ? categoriesAttr.split(',').map(cat => cat.trim()) : [];

      // アーカイブフラグの判定
      const isArchived = archivedAttr === 'true';

      let shouldShow = false;

      if (!targetCategory) {
        // カテゴリーが指定されていない場合はアーカイブされていないもののみ表示
        shouldShow = !isArchived;
      } else {
        // 指定されたカテゴリーが含まれているかチェック（アーカイブ状態に関係なく）
        shouldShow = categories.some(category =>
          category.toLowerCase() === targetCategory.toLowerCase()
        );
      }

      // 表示・非表示の制御
      if (shouldShow) {
        card.classList.remove(this.hiddenCardClass);
        visibleCount++;
      } else {
        card.classList.add(this.hiddenCardClass);
        hiddenCount++;
      }
    });

    return {
      visible: visibleCount,
      hidden: hiddenCount,
      total: projectCards.length
    };
  }

  /**
   * タグによるフィルタリング実行
   * @param {string|null} targetTag - フィルタリング対象のタグ（nullの場合は全て表示）
   */
  filterByTag(targetTag) {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-tags]');

    let visibleCount = 0;
    let hiddenCount = 0;

    projectCards.forEach((card, index) => {
      const tagsAttr = card.getAttribute('data-tags');
      const archivedAttr = card.getAttribute('data-archived');
      const projectId = card.getAttribute('data-project-id');

      // タグ文字列を配列に変換（空文字の場合は空配列）
      const tags = tagsAttr ? tagsAttr.split(',').map(tag => tag.trim()) : [];

      // アーカイブフラグの判定
      const isArchived = archivedAttr === 'true';

      let shouldShow = false;

      if (!targetTag) {
        // タグが指定されていない場合はアーカイブされていないもののみ表示
        shouldShow = !isArchived;
      } else {
        // 指定されたタグが含まれているかチェック（アーカイブ状態に関係なく）
        shouldShow = tags.some(tag =>
          tag.toLowerCase() === targetTag.toLowerCase()
        );
      }

      // 表示・非表示の制御
      if (shouldShow) {
        card.classList.remove(this.hiddenCardClass);
        visibleCount++;
      } else {
        card.classList.add(this.hiddenCardClass);
        hiddenCount++;
      }
    });

    return {
      visible: visibleCount,
      hidden: hiddenCount,
      total: projectCards.length
    };
  }

  /**
   * アーカイブ状態によるフィルタリング実行
   * @param {boolean} showArchived - アーカイブされたプロジェクトを表示するかどうか
   */
  filterByArchived(showArchived) {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-archived]');

    let visibleCount = 0;
    let hiddenCount = 0;

    projectCards.forEach((card, index) => {
      const archivedAttr = card.getAttribute('data-archived');
      const projectId = card.getAttribute('data-project-id');

      // アーカイブフラグの判定（文字列できているため、真偽値判定を実行）
      const isArchived = archivedAttr === 'true';

      let shouldShow = false;

      if (showArchived) {
        // アーカイブされたプロジェクトのみ表示
        shouldShow = isArchived;
      } else {
        // アーカイブされていないプロジェクトのみ表示
        shouldShow = !isArchived;
      }

      // 表示・非表示の制御
      if (shouldShow) {
        card.classList.remove(this.hiddenCardClass);
        visibleCount++;
      } else {
        card.classList.add(this.hiddenCardClass);
        hiddenCount++;
      }
    });

    return {
      visible: visibleCount,
      hidden: hiddenCount,
      total: projectCards.length
    };
  }

  /**
   * 全てのフィルターをリセット（全カード表示）
   */
  resetFilter() {
    const projectCards = document.querySelectorAll('.p-project-list__item');
    projectCards.forEach(card => {
      card.classList.remove(this.hiddenCardClass);
    });
  }

  /**
   * 現在の表示状態を取得
   * @returns {Object} 表示状態の詳細情報
   */
  getFilterStatus() {
    const projectCards = document.querySelectorAll('.p-project-list__item[data-categories]');
    const hiddenCards = document.querySelectorAll(`.p-project-list__item.${this.hiddenCardClass}`);

    return {
      total: projectCards.length,
      visible: projectCards.length - hiddenCards.length,
      hidden: hiddenCards.length
    };
  }
}

export default ProjectFilter;
