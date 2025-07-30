/**
 * Teamを管理するクラス
 */

class TeamAPI {
  constructor() {
    this.baseURL = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2';
    this.endpoint = '/team';
  }

  /**
   * チーム一覧を取得
   */
  async fetchTeamList(params = {}) {
    try {
      const url = new URL(`${this.baseURL}${this.endpoint}`);

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      // console.log('🔍 API呼び出し URL:', url.toString());

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 取得したチームデータ:', data);
      console.log('🔍 チームデータ詳細:', JSON.stringify(data[0], null, 2));

      return data;
    } catch (error) {
      console.error('❌ チーム取得エラー:', error);
      throw error;
    }
  }

  /**
   * 個別チームメンバーを取得
   */
  async fetchTeamDetail(id) {
    try {
      const url = `${this.baseURL}${this.endpoint}/${id}`;
      // console.log('🔍 詳細API呼び出し URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📄 取得したチーム詳細:', data);

      return data;
    } catch (error) {
      console.error('❌ チーム詳細取得エラー:', error);
      throw error;
    }
  }
}

class TeamList {
  constructor(teamAPI) {
    this.teamAPI = teamAPI;
    this.currentData = [];
    this.formattedData = [];
    this.currentPage = 1;
    this.perPage = 50; // チーム一覧は全件表示想定
  }

  /**
   * WordPressデータをTeamCard形式に変換
   */
  formatTeamData(wpDataArray) {
    if (!Array.isArray(wpDataArray)) {
      console.error('❌ formatTeamDataに配列以外が渡されました:', wpDataArray);
      return [];
    }

    const formatted = wpDataArray.map((item, index) => {
      
      /**
       * サムネイル画像を取得
       */
      const getThumbnail = (item) => {
        // acfs.thumbnail または acfs.image から取得
        if (item.acfs?.thumbnail?.url) {
          return item.acfs.thumbnail.url;
        }
        if (item.acfs?.image?.url) {
          return item.acfs.image.url;
        }
        if (item.featured_media && item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          return item._embedded['wp:featuredmedia'][0].source_url;
        }
        return '/common/images/team/01.png'; // デフォルト画像
      };

      /**
       * ポジションタグを変換
       */
      const formatTags = (item) => {
        const tags = [];
        
        // position（単体）
        if (item.acfs?.position) {
          tags.push({
            name: item.acfs.position,
            url: '#' // またはポジション別フィルターURL
          });
        }

        // position-tag（配列）
        if (item.acfs?.['position-tag'] && Array.isArray(item.acfs['position-tag'])) {
          item.acfs['position-tag'].forEach(tag => {
            tags.push({
              name: tag.name || tag,
              url: '#' // またはタグ別フィルターURL
            });
          });
        }

        return tags.length > 0 ? tags : [{ name: 'Member', url: '#' }];
      };

      const generateSlug = (title, id) => {
        if (item.slug) return item.slug;

        const cleanTitle = (title || 'team-member')
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        return cleanTitle || `team-${id}`;
      };

      const slug = generateSlug(item.title?.rendered || item.title, item.id || index);

      // 名前の様々な形式に対応
      let name = 'Unknown Member';
      if (typeof item.title === 'string') {
        name = item.title;
      } else if (item.title?.rendered) {
        name = item.title.rendered;
      } else if (item.acfs?.name) {
        name = item.acfs.name;
      }

      const result = {
        id: item.id || index,
        name: name.trim(),
        pic: getThumbnail(item),
        url: `/team/${item.id || index}`,
        tags: formatTags(item),
        slug: slug
      };

      return result;
    });

    return formatted;
  }

  /**
   * チーム一覧の初期化
   */
  async init() {
    try {
      // Step 1: APIからデータ取得
      await this.loadTeam();

      // Step 2: データをフォーマット
      this.formattedData = this.formatTeamData(this.currentData);

      // Step 3: window変数に格納
      window.TeamList = this.formattedData;
      // console.log('💾 window.TeamList に格納:', window.TeamList);

    } catch (error) {
      console.error('❌ 初期化に失敗:', error);
      throw error;
    }
  }

  /**
   * チームデータを読み込み
   */
  async loadTeam(params = {}) {
    const defaultParams = {
      page: this.currentPage,
      per_page: this.perPage,
      _embed: true
    };

    const mergedParams = { ...defaultParams, ...params };
    this.currentData = await this.teamAPI.fetchTeamList(mergedParams);

    return this.currentData;
  }

  /**
   * 検索・フィルタリング
   */
  async search(searchParams) {
    console.log('🔍 検索実行:', searchParams);

    const params = {};

    if (searchParams.keyword) {
      params.search = searchParams.keyword;
    }

    if (searchParams.position) {
      params.position = searchParams.position;
    }

    await this.loadTeam(params);
    this.formattedData = this.formatTeamData(this.currentData);
    window.TeamList = this.formattedData;

    return this.formattedData;
  }
}

class TeamDetail {
  constructor(teamAPI) {
    this.teamAPI = teamAPI;
    this.currentTeam = null;
  }

  /**
   * チーム詳細の初期化
   */
  async init(teamId) {
    try {
      this.currentTeam = await this.teamAPI.fetchTeamDetail(teamId);

      window.TeamMember = this.currentTeam;
      console.log('💾 TeamMember をwindow変数に格納:', window.TeamMember);

      return this.currentTeam;
    } catch (error) {
      console.error('❌ 詳細初期化に失敗:', error);
      throw error;
    }
  }
}

// メインのTeamManagerクラス
class TeamManager {
  constructor() {
    this.api = new TeamAPI();
    this.listManager = new TeamList(this.api);
    this.detailManager = new TeamDetail(this.api);
  }

  /**
   * 一覧ページの初期化
   */
  async initList() {
    return await this.listManager.init();
  }

  /**
   * 詳細ページの初期化
   */
  async initDetail(teamId) {
    return await this.detailManager.init(teamId);
  }

  /**
   * 検索機能
   */
  async search(searchParams) {
    return await this.listManager.search(searchParams);
  }
}

/**
 * window.TeamListから直接DOM描画する関数
 * Team一覧ページでのみ実行される
 */
function renderTeamFromWindow() {
  // Team一覧ページかどうかを判定
  const teamContainer = document.querySelector('.p-team-content__list');
  const isTeamListPage = teamContainer &&
                         (window.location.pathname === '/team/' || window.location.pathname === '/team') &&
                         !window.location.pathname.match(/\/team\/[^\/]+$/);

  // console.log('🔍 ページ判定:', {
  //   hasTeamContainer: !!teamContainer,
  //   pathname: window.location.pathname,
  //   bodyClasses: Array.from(document.querySelector('body').classList),
  //   isTeamListPage: isTeamListPage
  // });

  if (!isTeamListPage) {
    return;
  }

  if (!window.TeamList || !Array.isArray(window.TeamList)) {
    console.error('❌ window.TeamListが存在しないか、配列ではありません:', window.TeamList);
    return;
  }

  if (!teamContainer) {
    console.error('❌ .p-team-content__list の要素が見つかりません');
    return;
  }

  teamContainer.innerHTML = '';

  window.TeamList.forEach((teamData, index) => {
    const li = document.createElement('li');
    li.className = 'p-team-content__list-item';
    li.setAttribute('data-item', teamData.id);

    // タグのHTML生成
    const tagsHtml = teamData.tags.map(tag => `
      <li class="c-team-card__tags-item">
        ${tag.url !== "#" && tag.url !== '' ? 
          `<a href="${tag.url}">${tag.name}</a>` : 
          `<span>${tag.name}</span>`
        }
      </li>
    `).join('');

    li.innerHTML = `
      <div class="c-team-card">
        <a href="${teamData.url}" class="c-team-card__thumb">
          <img src="${teamData.pic}" alt="${teamData.name}" loading="lazy">
        </a>
        <div class="c-team-card__info">
          <h3 class="c-team-card__name">${teamData.name}</h3>
          <ul class="c-team-card__tags">
            ${tagsHtml}
          </ul>
        </div>
      </div>
    `;

    teamContainer.appendChild(li);
  });

  // モバイルレイアウトの処理を既存のTeamLayoutManagerに委任
  if (window.teamLayoutManager) {
    window.teamLayoutManager.setupMobileLayout();
  }
}

// チーム用のレイアウトマネージャー
class TeamLayoutManager {
  constructor() {
    this.init();
  }

  init() {
    if (window.innerWidth <= 768) {
      this.setupMobileLayout();
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.setupMobileLayout();
      } else {
        this.setupDesktopLayout();
      }
    });
  }

  setupMobileLayout() {
    const list = document.querySelector('.p-team-content__list');
    const columns = document.querySelector('.p-team-content__columns');
    const leftColumn = document.querySelector('[data-column="left"]');
    const rightColumn = document.querySelector('[data-column="right"]');

    if (!list || !columns) return;

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

  setupDesktopLayout() {
    const list = document.querySelector('.p-team-content__list');
    const columns = document.querySelector('.p-team-content__columns');

    if (!list || !columns) return;

    list.style.display = 'grid';
    columns.style.display = 'none';
  }
}

// グローバルスコープに追加
window.teamManager = new TeamManager();
window.renderTeamFromWindow = renderTeamFromWindow;
window.teamLayoutManager = new TeamLayoutManager();

/**
 * 詳細ページの初期化処理
 */
async function initTeamDetail() {
  // 詳細ページかどうかを判定
  const isTeamDetailPage = document.querySelector('body').classList.contains('team-detail') ||
                           window.location.pathname.includes('/team/') &&
                           window.location.pathname !== '/team/' &&
                           !window.location.pathname.endsWith('/team');

  if (!isTeamDetailPage) {
    return;
  }

  try {
    // URLからスラッグを取得
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

    if (!slug) {
      console.error('❌ スラッグが取得できませんでした:', window.location.pathname);
      return;
    }

    // Astroページのpropsからチームデータを取得（フォールバック）
    const teamData = window.teamData || null;

    if (teamData) {
      window.TeamMember = teamData;
      console.log('💾 TeamMember をwindow変数に格納（Astroデータ）:', window.TeamMember);
    } else {
      console.log('🔄 APIから詳細データ取得中...');
      // APIから詳細データを取得（IDが必要な場合の代替案）
      // この実装はWordPress APIの詳細エンドポイントに依存
    }

  } catch (error) {
    console.error('❌ 詳細ページ初期化に失敗:', error);
  }
}

// DOM準備完了後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // 詳細ページの初期化
    await initTeamDetail();

    // 一覧ページの初期化
    if (window.TeamList && Array.isArray(window.TeamList) && window.TeamList.length > 0) {
      window.renderTeamFromWindow();
    } else {
      console.log('🔄 APIからデータ取得');
      try {
        await window.teamManager.initList();
        window.renderTeamFromWindow();
      } catch (error) {
        console.error('🚨 初期化中にエラーが発生:', error);
      }
    }
  });
} else {
  // 詳細ページの初期化
  initTeamDetail();

  // 一覧ページの初期化
  if (window.TeamList && Array.isArray(window.TeamList) && window.TeamList.length > 0) {
    window.renderTeamFromWindow();
  } else {
    (async () => {
      try {
        await window.teamManager.initList();
        window.renderTeamFromWindow();
      } catch (error) {
        console.error('🚨 初期化中にエラーが発生:', error);
      }
    })();
  }
}

export { TeamManager, TeamAPI, TeamList, TeamDetail, renderTeamFromWindow };
