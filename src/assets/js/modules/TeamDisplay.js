/**
 * Team Display Manager
 * チーム一覧の表示制御を管理する
 */

export class TeamDisplay {
  constructor() {
    this.teamCards = [];
    this.currentPosition = null;
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    this.getTeamCards();
    this.setupMobileLayoutSupport();
  }

  /**
   * チームカードの取得
   */
  getTeamCards() {
    this.teamCards = document.querySelectorAll('.p-team-content__list-item');
    console.log(`🃏 Found ${this.teamCards.length} team cards`);
  }

  /**
   * モバイルレイアウトサポートの設定
   */
  setupMobileLayoutSupport() {
    // モバイル用の2カラムレイアウトが存在する場合の処理を準備
    this.leftColumn = document.querySelector('[data-column="left"]');
    this.rightColumn = document.querySelector('[data-column="right"]');
    this.mobileColumns = document.querySelector('.p-team-content__columns');
  }

  /**
   * 役職による表示フィルタリング
   * @param {string|null} position - フィルタリングする役職（nullの場合は全件表示）
   */
  updateDisplayByPosition(position = null) {
    this.currentPosition = position;

    let visibleCount = 0;
    let hiddenCount = 0;

    this.teamCards.forEach(card => {
      const shouldShow = this.shouldShowCard(card, position);

      if (shouldShow) {
        card.style.display = '';
        card.classList.remove('is-hidden');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('is-hidden');
        hiddenCount++;
      }
    });

    // モバイルレイアウトの更新
    this.updateMobileLayout();

    console.log(`✅ Display updated: ${visibleCount} visible, ${hiddenCount} hidden`);

    return {
      visible: visibleCount,
      hidden: hiddenCount
    };
  }

  /**
   * カードを表示すべきかどうかを判定
   * @param {HTMLElement} card - 判定対象のカード
   * @param {string|null} position - フィルタリング条件の役職
   * @returns {boolean} 表示すべき場合はtrue
   */
  shouldShowCard(card, position) {
    if (!position) {
      return true; // フィルターなしの場合は全て表示
    }

    // data-positions属性から役職情報を取得
    const positions = card.getAttribute('data-positions');

    if (!positions) {
      return false; // 役職情報がない場合は非表示
    }

    // カンマ区切りの役職リストに指定された役職が含まれているかチェック
    const positionList = positions.split(',').map(p => p.trim()).filter(p => p);
    return positionList.includes(position);
  }

  /**
   * モバイルレイアウトの更新
   */
  updateMobileLayout() {
    if (!this.mobileColumns || !this.leftColumn || !this.rightColumn) {
      return; // モバイルカラムが存在しない場合はスキップ
    }

    // 現在がモバイル表示かどうかを確認
    if (window.innerWidth > 960) {
      return; // デスクトップ表示の場合はスキップ
    }

    // カラムをクリア
    this.leftColumn.innerHTML = '';
    this.rightColumn.innerHTML = '';

    // 表示されているカードのみを取得して左右に振り分け
    const visibleCards = Array.from(this.teamCards).filter(card =>
      card.style.display !== 'none' && !card.classList.contains('is-hidden')
    );

    visibleCards.forEach((card, index) => {
      const clonedCard = card.cloneNode(true);
      if (index % 2 === 0) {
        this.leftColumn.appendChild(clonedCard);
      } else {
        this.rightColumn.appendChild(clonedCard);
      }
    });

    console.log(`📱 Mobile layout updated: ${visibleCards.length} cards redistributed`);
  }

  /**
   * 表示をリセット
   */
  resetDisplay() {
    this.updateDisplayByPosition(null);
  }

  /**
   * 現在の表示状態を取得
   */
  getDisplayStatus() {
    const visible = Array.from(this.teamCards).filter(card =>
      card.style.display !== 'none' && !card.classList.contains('is-hidden')
    ).length;

    const hidden = this.teamCards.length - visible;

    return {
      currentPosition: this.currentPosition,
      totalCards: this.teamCards.length,
      visibleCards: visible,
      hiddenCards: hidden,
      filterActive: this.currentPosition !== null
    };
  }

  /**
   * ウィンドウリサイズ時の処理
   */
  handleWindowResize() {
    // モバイルレイアウトの更新
    if (window.innerWidth <= 768) {
      this.updateMobileLayout();
    }
  }

  /**
   * デバッグ情報の出力
   */
  getDebugInfo() {
    return {
      ...this.getDisplayStatus(),
      mobileLayoutEnabled: !!(this.mobileColumns && this.leftColumn && this.rightColumn),
      isMobileView: window.innerWidth <= 768
    };
  }
}
