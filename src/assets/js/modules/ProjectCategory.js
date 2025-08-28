/**
 * Project Category Module
 * プロジェクトカテゴリー選択の視覚化を管理する
 */

class ProjectCategory {
  constructor() {
    this.categoryItems = null;
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.categoryItems = document.querySelectorAll('.p-project-head__category-item a');

    if (!this.categoryItems || this.categoryItems.length === 0) {
      console.warn('⚠️ Project category elements not found');
      return;
    }
  }

  /**
   * 現在のカテゴリーに応じて選択状態を更新
   * @param {string|null} category - 選択中のカテゴリー（nullの場合はALL）
   * @param {boolean} isArchived - アーカイブ表示かどうか
   */
  updateSelection(category, isArchived = false) {
    if (!this.categoryItems) {
      console.warn('⚠️ Cannot update category selection - elements not found');
      return;
    }

    // 全てのカテゴリーの選択状態をリセット
    this.categoryItems.forEach(item => {
      item.setAttribute('aria-current', 'false');
    });

    if (isArchived) {
      // アーカイブ表示時はARCHIVEDカテゴリーを選択状態に
      this.selectArchivedCategory();
    } else if (category) {
      // 指定されたカテゴリーを選択状態に
      const targetCategory = this.findCategoryBySlug(category);
      if (targetCategory) {
        targetCategory.setAttribute('aria-current', 'true');
      } else {
        console.warn(`⚠️ Category not found: "${category}"`);
        // 見つからない場合はALLを選択状態に
        this.selectAllCategory();
      }
    } else {
      // ALLを選択状態に
      this.selectAllCategory();
    }
  }

  /**
   * ALLカテゴリーを選択状態に設定
   */
  selectAllCategory() {
    const allCategory = document.querySelector('.p-project-head__category-item[data-category="All"] a');
    if (allCategory) {
      allCategory.setAttribute('aria-current', 'true');
    }
  }

  /**
   * ARCHIVEDカテゴリーを選択状態に設定
   */
  selectArchivedCategory() {
    const archivedCategory = document.querySelector('.p-project-head__category-item[data-category="ARCHIVED"] a');
    if (archivedCategory) {
      archivedCategory.setAttribute('aria-current', 'true');
    }
  }

  /**
   * スラッグでカテゴリーを検索
   * @param {string} slug - 検索するカテゴリーのスラッグ
   * @returns {Element|null} 該当するカテゴリー要素
   */
  findCategoryBySlug(slug) {
    for (const item of this.categoryItems) {
      const href = item.getAttribute('href');
      if (href && href.includes(`category=${slug}`)) {
        return item;
      }
    }
    return null;
  }

  /**
   * 現在選択中のカテゴリーを取得
   * @returns {string|null} 選択中のカテゴリーのスラッグ、ALLの場合はnull
   */
  getCurrentSelection() {
    const selectedItem = document.querySelector('.p-project-head__category-item a[aria-current="true"]');
    if (!selectedItem) return null;

    const href = selectedItem.getAttribute('href');
    if (!href || href === '/projects/') return null;

    const match = href.match(/category=([^&]+)/);
    return match ? match[1] : null;
  }
}

export default ProjectCategory;
