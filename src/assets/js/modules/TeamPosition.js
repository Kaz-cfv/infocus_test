/**
 * Team Position Manager
 * チーム一覧の役職フィルタリングを管理する
 */

export class TeamPosition {
  constructor() {
    this.positionItems = [];
    this.allButton = null;
    this.currentPosition = null;
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.getPositionElements();
    this.setupEventListeners();
  }

  /**
   * ポジション関連要素の取得
   */
  getPositionElements() {
    this.positionItems = document.querySelectorAll('.p-team-head__position-item');
    this.allButton = document.querySelector('.p-team-head__btn');
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ポジションアイテムのクリックイベント
    this.positionItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        link.addEventListener('click', (e) => {
          // デフォルトのリンク動作は維持（ページ遷移を許可）
          // この処理はURLパラメーター変更後のページロード時に実行される
        });
      }
    });

    // ALLボタンのクリックイベント
    if (this.allButton) {
      const link = this.allButton.querySelector('a');
      if (link) {
        link.addEventListener('click', (e) => {
          // デフォルトのリンク動作は維持（ページ遷移を許可）
          // この処理はページロード時に実行される
        });
      }
    }
  }

  /**
   * 役職フィルターの変更
   * @param {string|null} position - 選択された役職（nullの場合は全件表示）
   */
  changePosition(position = null) {
    this.currentPosition = position;
    this.updateSelection(position);

    if (position) {
      console.log(`🎯 Position filter changed to: "${position}"`);
    } else {
      console.log('👥 Position filter reset: showing all team members');
    }
  }

  /**
   * 選択状態の更新
   * @param {string|null} position - 現在選択されている役職
   */
  updateSelection(position) {
    // URLパラメーターに基づいてUI状態を更新
    if (position) {
      // 特定のポジションが選択されている場合
      this.updatePositionItemsForFilter(position);
      this.updateAllButtonForFilter(false);
    } else {
      // 全件表示の場合
      this.updatePositionItemsForFilter(null);
      this.updateAllButtonForFilter(true);
    }

    this.currentPosition = position;
  }

  /**
   * ポジションアイテムのdata-filter属性を更新
   * @param {string|null} selectedPosition - 選択されたポジション
   */
  updatePositionItemsForFilter(selectedPosition) {
    this.positionItems.forEach(item => {
      const link = item.querySelector('a');
      if (link) {
        // hrefからpositionのslugを抽出
        const href = link.getAttribute('href');
        const match = href.match(/position=([^&]+)/);
        const positionSlug = match ? match[1] : null;

        if (selectedPosition) {
          // 絞り込み中の場合
          if (positionSlug === selectedPosition) {
            // 選択されたポジション → 'current'
            item.setAttribute('data-filter', 'current');
          } else {
            // その他のポジション → 'uncurrent'
            item.setAttribute('data-filter', 'uncurrent');
          }
        } else {
          // 全件表示の場合 → 全て空文字
          item.setAttribute('data-filter', '');
        }
      }
    });
  }

  /**
   * ALLボタンのdata-filter属性を更新
   * @param {boolean} isSelected - 選択状態かどうか
   */
  updateAllButtonForFilter(isSelected) {
    if (this.allButton) {
      if (isSelected) {
        this.allButton.setAttribute('data-filter', 'current');
      } else {
        this.allButton.setAttribute('data-filter', '');
      }
    }
  }

  /**
   * 現在の選択状態を取得
   * @returns {string|null} 現在選択されている役職
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * すべての役職を表示する
   */
  showAll() {
    this.changePosition(null);
  }

  /**
   * URLパラメーターに基づいてUIを初期化
   * @param {string|null} position - URLパラメーターから取得したポジション
   */
  initializeFromURL(position) {
    this.updateSelection(position);
  }

  /**
   * デバッグ情報の出力
   */
  getDebugInfo() {
    return {
      currentPosition: this.currentPosition,
      positionItemCount: this.positionItems.length,
      allButtonExists: !!this.allButton,
      availablePositions: Array.from(this.positionItems).map(item => {
        const link = item.querySelector('a');
        if (link) {
          const href = link.getAttribute('href');
          const match = href.match(/position=([^&]+)/);
          return match ? match[1] : null;
        }
        return null;
      }).filter(slug => slug !== null)
    };
  }
}
