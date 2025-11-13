/**
 * Team Page Manager
 * チーム一覧ページの機能を管理する
 */

import URLUtils from '../modules/URLUtils.js';
import { TeamPosition } from '../modules/TeamPosition.js';
import { TeamDisplay } from '../modules/TeamDisplay.js';
import { ApiClient } from '../modules/ApiClient.js';
import { SimpleLinkFixer } from '../modules/SimpleLinkFixer.js';

/**
 * TeamRenderer Class
 * チームカードのレンダリングを担当
 */
class TeamRenderer {
  constructor() {
    this.currentLanguage = this.detectCurrentLanguage();
    this.teamData = [];
  }

  /**
   * 現在の言語を検出
   * @returns {string} 'en' または 'ja'
   */
  detectCurrentLanguage() {
    return window.location.pathname.includes('/en/') ? 'en' : 'ja';
  }

  /**
   * 言語に応じたチームメンバーURLを生成
   * @param {string} slug - チームメンバーのスラッグ
   * @returns {string} 適切な言語パスのURL
   */
  getLocalizedTeamURL(slug) {
    if (this.currentLanguage === 'en') {
      return `/en/team/${slug}/`;
    } else {
      return `/team/${slug}/`;
    }
  }

  /**
   * ポジションフィルターURLを生成
   * @param {string} positionSlug - ポジションのスラッグ
   * @returns {string} フィルター用URL
   */
  getPositionFilterURL(positionSlug) {
    if (this.currentLanguage === 'en') {
      return `/en/team/?position=${positionSlug}`;
    } else {
      return `/team/?position=${positionSlug}`;
    }
  }

  /**
   * チームメンバーのタグ情報を処理
   * @param {Object} member - チームメンバーデータ
   * @returns {Array} タグの配列
   */
  processTeamTags(member) {
    const tags = [];

    // ポジション情報をtaxonomy.positionから取得
    const positions = member.taxonomy?.position || [];
    positions.forEach(position => {
      if (position.name) {
        tags.push({
          name: position.name,
          slug: position.slug,
          url: this.getPositionFilterURL(position.slug),
          isPosition: true
        });
      }
    });

    return tags;
  }

  /**
   * チームカードのHTMLを生成
   * @param {Object} member - チームメンバーデータ
   * @returns {string} HTMLテンプレート
   */
  createTeamCardHTML(member) {
    const name = member.title || 'No Name';
    const pic = member.acfs?.thumbnail?.url || '';
    const slug = member.slug || '#';
    const url = slug !== '#' ? this.getLocalizedTeamURL(slug) : '#';

    // 【修正点】画像URLの取得と出し分け
    // thumbnail.urlはフォールバックとして残しつつ、sizesからLargeとMedium_Largeを取得
    const picFallback = member.acfs?.thumbnail?.url || ''; // Fallback用
    const picMediumLarge = member.acfs?.thumbnail?.image?.sizes.medium_large || picFallback; // SP/Tablet用 (768px)
    const picLarge = member.acfs?.thumbnail?.image?.sizes.large || picFallback; // PC用 (1024px)

    // タグ情報の処理
    const tags = this.processTeamTags(member);
    const tagsHTML = tags.map(tag => {
      return `<li class="c-team-card__tags-item js-hover-item"><a href="${tag.url}">${tag.name}</a></li>`;
    }).join('');

    return `
      <div class="c-team-card mouse-over">
        <a href="${url}" class="c-team-card__thumb">
          <picture>
            <source media="(min-width: 960px)" srcset="${picLarge}">
            <img
              src="${picMediumLarge}"
              alt="${name}"
              loading="lazy"
              decoding="async"
            >
          </picture>
        </a>
        <div class="c-team-card__info">
          <h3 class="c-team-card__name">
            <a href="${url}">
              ${name}
            </a>
          </h3>
          <ul class="c-team-card__tags js-hover">
            ${tagsHTML}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * チームリストアイテムを生成
   * @param {Object} member - チームメンバーデータ
   * @returns {string} HTMLテンプレート
   */
  createTeamListItem(member) {
    // ポジションスラッグの取得
    const positions = member.taxonomy?.position || [];
    const positionSlugs = positions.map(pos => pos.slug || '').filter(slug => slug);

    return `
      <li class="p-team-content__list-item" data-item="${member.id}" data-positions="${positionSlugs.join(',')}">
        ${this.createTeamCardHTML(member)}
      </li>
    `;
  }

  /**
   * チームリストを描画
   * @param {Array} teamData - APIから取得したチームデータ
   */
  render(teamData) {
    const teamList = document.getElementById('teamList');
    if (!teamList) {
      console.warn('⚠️ teamList element not found');
      return;
    }

    this.teamData = teamData;

    if (teamData.length === 0) {
      console.warn('⚠️ No team members to render');
      return;
    }

    // スケルトンをフェードアウトさせてから削除
    const skeletonItems = teamList.querySelectorAll('.skeleton-item');
    if (skeletonItems.length > 0) {
      skeletonItems.forEach(item => item.classList.add('fade-out'));

      // アニメーション完了後にスケルトンを削除して実際のカードを挿入
      setTimeout(() => {
        // チームカードのHTML生成
        const teamCardsHTML = teamData.map(member => this.createTeamListItem(member)).join('');
        teamList.innerHTML = teamCardsHTML;

        // ホバー効果を初期化
        this.reinitializeHover(teamList);

        // console.log(`✨ All team members rendered (${this.currentLanguage}): ${teamData.length} members`);

        // カード生成完了をフィルタリングシステムに通知
        setTimeout(() => {
          const event = new CustomEvent('teamCardsRendered');
          document.dispatchEvent(event);
          // console.log('📢 teamCardsRendered event dispatched');
        }, 50);

        // モバイルレイアウトの適用
        this.setupResponsiveLayout();
      }, 300);
    } else {
      // スケルトンが存在しない場合（通常は発生しない）
      const teamCardsHTML = teamData.map(member => this.createTeamListItem(member)).join('');
      teamList.innerHTML = teamCardsHTML;

      this.reinitializeHover(teamList);
      this.setupResponsiveLayout();

      console.log(`✨ All team members rendered (${this.currentLanguage}): ${teamData.length} members`);
    }
  }

  /**
   * ホバー効果を再初期化
   * @param {HTMLElement} teamList - チームリスト要素
   */
  reinitializeHover(teamList) {
    setTimeout(() => {
      // NavigationHoverの再初期化イベントを発火
      const hoverEvent = new CustomEvent('reinitializeHover', {
        detail: { element: teamList }
      });
      document.dispatchEvent(hoverEvent);

      // グローバルなNavigationHoverインスタンスが存在する場合、直接初期化
      if (window.navigationHover && typeof window.navigationHover.initializeInElement === 'function') {
        window.navigationHover.initializeInElement(teamList);
      }

      // 手動でホバー処理を追加
      const hoverContainers = teamList.querySelectorAll('.js-hover');
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

  /**
   * レスポンシブレイアウトのセットアップ
   */
  setupResponsiveLayout() {
    if (window.innerWidth <= 768) {
      this.setupMobileLayout();
    }

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.setupMobileLayout();
      } else {
        this.setupDesktopLayout();
      }
    });
  }

  /**
   * モバイルレイアウトのセットアップ
   */
  setupMobileLayout() {
    const list = document.querySelector('.p-team-content__list');
    const columns = document.querySelector('.p-team-content__columns');
    const leftColumn = document.querySelector('[data-column="left"]');
    const rightColumn = document.querySelector('[data-column="right"]');

    if (!list || !columns || !leftColumn || !rightColumn) return;

    // リストを非表示にし、カラムを表示
    list.style.display = 'none';
    columns.style.display = 'flex';

    // カラムをクリア
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    // アイテムを左右に振り分け
    const items = list.querySelectorAll('.p-team-content__list-item');
    items.forEach((item, index) => {
      const clonedItem = item.cloneNode(true);
      if (index % 2 === 0) {
        leftColumn.appendChild(clonedItem);
      } else {
        rightColumn.appendChild(clonedItem);
      }
    });
  }

  /**
   * デスクトップレイアウトのセットアップ
   */
  setupDesktopLayout() {
    const list = document.querySelector('.p-team-content__list');
    const columns = document.querySelector('.p-team-content__columns');

    if (!list || !columns) return;

    list.style.display = 'grid';
    columns.style.display = 'none';
  }
}

export class Team {
  constructor() {
    if (!this.isTeamPage()) {
      return;
    }

    this.apiClient = new ApiClient();
    this.positionManager = new TeamPosition();
    this.displayManager = new TeamDisplay();
    this.linkFixer = new SimpleLinkFixer();
    this.teamRenderer = new TeamRenderer(); // ★ TeamRendererを初期化
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
  async init() {
    // APIからチームデータを取得
    // await this.fetchTeamData();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupTeamFiltering();
      });
    } else {
      this.setupTeamFiltering();
    }
  }

  /**
   * チームデータを取得してレンダリング
   */
  async fetchTeamData() {
    try {
      const teamData = await this.apiClient.getTeamData();
      // console.log('👥 Team.js: APIデータ取得完了:', teamData);

      // TeamRendererでカード生成
      this.teamRenderer.render(teamData);

      // カスタムイベントで他のコンポーネントにデータを配信（互換性のため残す）
      const event = new CustomEvent('teamDataLoaded', {
        detail: teamData
      });
      document.dispatchEvent(event);

    } catch (error) {
      console.error('❌ Failed to fetch team data:', error);
    }
  }

  /**
   * チームフィルタリングのセットアップ
   */
  setupTeamFiltering() {
    // URLパラメーターの処理
    this.handleURLParameters();

    // チームカード生成完了イベントのリスナー設定
    document.addEventListener('teamCardsRendered', () => {
      this.refreshFilteringSystem();
    });

    // 役職変更と表示制御の同期設定
    this.setupPositionDisplaySync();

    // グローバルにアクセス可能にする（外部連携用）
    this.exposeGlobalInterface();
  }

  /**
   * フィルタリングシステムの再初期化
   */
  refreshFilteringSystem() {
    // 表示マネージャーのチームカード情報を更新
    this.displayManager.getTeamCards();

    // 現在のポジションフィルターを再適用
    if (this.currentPosition) {
      this.displayManager.updateDisplayByPosition(this.currentPosition);
    }
  }

  /**
   * URLパラメーターの処理
   */
  handleURLParameters() {
    const positionParam = URLUtils.getURLParameter('position');

    if (positionParam) {
      // console.log(`🎯 Filtering by position: \"${positionParam}\"`);
      this.currentPosition = positionParam;
    } else {
      // console.log('👥 Showing all team members');
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
      debugUIState: () => this.debugUIState(),
      // リンク修正機能を追加
      fixLinks: () => this.linkFixer.manualFix()
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
      display: this.displayManager,
      linkFixer: this.linkFixer,
      renderer: this.teamRenderer
    };
  }
}

// ページ読み込み時の自動初期化
// DOMContentLoadedイベントでTeamクラスを自動初期化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new Team();
  });
}
