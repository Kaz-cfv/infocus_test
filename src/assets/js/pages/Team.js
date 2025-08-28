/**
 * Team Page Manager
 * チーム一覧ページの機能を管理する
 */

import URLUtils from '../modules/URLUtils.js';
import { TeamPosition } from '../modules/TeamPosition.js';
import { TeamDisplay } from '../modules/TeamDisplay.js';

export class Team {
  constructor() {
    if (!this.isTeamPage()) {
      return;
    }

    this.positionManager = new TeamPosition();
    this.displayManager = new TeamDisplay();
    this.currentPosition = null;

    this.init();
  }

  /**
   * チームページかどうかを判定
   * チーム一覧のカード要素が存在するかで判定
   */
  isTeamPage() {
    return document.querySelector('.p-team-content__list') !== null;
  }

  /**
   * 初期化処理
   */
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupTeamFiltering();
      });
    } else {
      this.setupTeamFiltering();
    }
  }

  /**
   * チーム絞り込み機能のセットアップ
   */
  setupTeamFiltering() {
    // URLパラメーターの処理
    this.handleURLParameters();

    // 役職変更と表示制御の同期設定
    this.setupPositionDisplaySync();

    // グローバルにアクセス可能にする（外部連携用）
    this.exposeGlobalInterface();

    console.log('👥 Team一覧ページ: 初期化完了', {
      position: this.currentPosition,
    });
  }

  /**
   * URLパラメーターの処理
   */
  handleURLParameters() {
    const positionParam = URLUtils.getURLParameter('position');

    if (positionParam) {
      console.log(`🎯 Filtering by position: \"${positionParam}\"`);
      this.currentPosition = positionParam;
    } else {
      console.log('👥 Showing all team members');
      this.currentPosition = null;
    }

    // 初期状態を各部隊に通知（URLパラメーターに基づくUI初期化）
    this.positionManager.initializeFromURL(this.currentPosition);
    this.displayManager.updateDisplayByPosition(this.currentPosition);
  }

  /**
   * 役職変更と表示制御の同期設定
   * 役職変更時に自動的に表示モードも更新される
   */
  setupPositionDisplaySync() {
    // 役職変更時に表示も更新
    const originalChangePosition = this.positionManager.changePosition.bind(this.positionManager);
    this.positionManager.changePosition = (position = null) => {
      originalChangePosition(position);
      this.displayManager.updateDisplayByPosition(position);
      this.currentPosition = position; // 自身の状態も更新
    };
  }

  /**
   * グローバルインターフェースの公開
   * 外部から安全にアクセスできるAPIを提供
   */
  exposeGlobalInterface() {
    // レガシー対応として window.teamManager を維持
    window.teamManager = {
      getPositionManager: () => this.positionManager,
      getDisplayManager: () => this.displayManager,
      getCurrentState: () => this.getCurrentState(),
      changePosition: (position) => this.changePosition(position),
      reset: () => this.reset(),
      // 新機能：UI状態のテスト用メソッド
      testPositionUI: (position) => this.testPositionUI(position),
      debugUIState: () => this.debugUIState()
    };
  }

  /**
   * 現在の状態を取得
   */
  getCurrentState() {
    return {
      position: this.currentPosition,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 役職を変更（外部から呼び出し可能）
   */
  changePosition(position = null) {
    this.currentPosition = position;
    this.positionManager.changePosition(position);
  }

  /**
   * 状態をリセット
   */
  reset() {
    this.currentPosition = null;
    this.positionManager.initializeFromURL(null);
    this.displayManager.resetDisplay();
  }

  /**
   * UI状態のテスト用メソッド
   * ブラウザのコンソールからテスト可能
   * @param {string|null} position - テストしたいポジション
   */
  testPositionUI(position) {
    console.log(`🧪 Testing UI state for position: "${position || 'all'}"`);
    this.positionManager.updateSelection(position);
    return this.positionManager.getDebugInfo();
  }

  /**
   * UI状態のデバッグ情報を出力
   */
  debugUIState() {
    const positionDebug = this.positionManager.getDebugInfo();
    const displayDebug = this.displayManager.getDebugInfo();

    console.log('🔍 Team UI Debug Information:');
    console.log('- Position Manager:', positionDebug);
    console.log('- Display Manager:', displayDebug);

    return {
      position: positionDebug,
      display: displayDebug,
      currentState: this.getCurrentState()
    };
  }

  /**
   * 各管理部隊への直接アクセス（デバッグ用）
   */
  getManagers() {
    return {
      position: this.positionManager,
      display: this.displayManager
    };
  }
}
