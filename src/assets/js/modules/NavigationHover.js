/**
 * ホバー処理を管理するクラス（汎用的に複数のコンテナに対応）
 */
export class NavigationHover {
  constructor() {
    this.hoverContainers = [];
    this.init();
  }

  init() {
    const containers = document.querySelectorAll('.js-hover');
    if (containers.length === 0) {
      return;
    }

    containers.forEach(container => {
      const items = container.querySelectorAll('.js-hover-item');
      if (items.length > 0) {
        this.hoverContainers.push({
          container: container,
          items: items
        });
      }
    });

    this.bindEvents();
  }

  bindEvents() {
    this.hoverContainers.forEach(containerData => {
      containerData.items.forEach(item => {
        item.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, containerData));
        item.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, containerData));
      });
    });
  }

  handleMouseEnter(event, containerData) {
    const hoveredItem = event.currentTarget;

    // ホバー中の要素にクラス追加
    hoveredItem.classList.add('is-hovered');

    // 同一コンテナ内の兄弟要素にクラス追加
    containerData.items.forEach(item => {
      if (item !== hoveredItem) {
        item.classList.add('is-dimmed');
      }
    });
  }

  handleMouseLeave(event, containerData) {
    const leftItem = event.currentTarget;

    // 該当の要素からクラス削除
    leftItem.classList.remove('is-hovered');

    // 同一コンテナ内の兄弟要素からクラス削除
    containerData.items.forEach(item => {
      if (item !== leftItem) {
        item.classList.remove('is-dimmed');
      }
    });
  }

  resetAllStates() {
    this.hoverContainers.forEach(containerData => {
      containerData.items.forEach(item => {
        item.classList.remove('is-dimmed', 'is-hovered');
      });
    });
  }

  /**
   * 動的に追加されたDOMに対してホバー処理を適用
   * @param {Element} container - 追加されたコンテナ要素
   */
  addDynamicContainer(container) {
    const items = container.querySelectorAll('.js-hover-item');
    if (items.length > 0) {
      const containerData = {
        container: container,
        items: items
      };

      this.hoverContainers.push(containerData);

      // イベントリスナーを追加
      items.forEach(item => {
        item.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, containerData));
        item.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, containerData));
      });
    }
  }

  /**
   * 全ての.js-hoverコンテナを再スキャンして初期化
   */
  reinitialize() {
    // 既存のリスナーをクリア（メモリリーク防止）
    this.hoverContainers = [];

    // 再初期化
    this.init();
  }

  /**
   * 指定した親要素内の.js-hoverコンテナのみを初期化
   * @param {Element} parentElement - 親要素
   */
  initializeInElement(parentElement) {
    const containers = parentElement.querySelectorAll('.js-hover');

    containers.forEach(container => {
      const items = container.querySelectorAll('.js-hover-item');
      if (items.length > 0) {
        const containerData = {
          container: container,
          items: items
        };

        this.hoverContainers.push(containerData);

        // イベントリスナーを追加
        items.forEach(item => {
          item.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, containerData));
          item.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, containerData));
        });
      }
    });
  }
}
