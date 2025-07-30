/**
 * WordPress API エンドポイント設定
 * 全ての API エンドポイントを一元管理
 */

const BASE_URL = 'https://infocus.wp.site-prev2.com/wp-json';
const WP_V2 = `${BASE_URL}/wp/v2`;
const INFOCUS_V1 = `${BASE_URL}/infocus/v1`;

export const ENDPOINTS = {
  // ホーム関連（カスタムエンドポイント）
  HOME: `${INFOCUS_V1}/options/home`,

  // プロジェクト関連
  PROJECTS: `${WP_V2}/projects`,
  PROJECT_BY_ID: (id) => `${WP_V2}/projects/${id}`,

  // チームメンバー関連
  TEAM: `${WP_V2}/team`,
  TEAM_BY_ID: (id) => `${WP_V2}/team/${id}`,

  // ニュース関連
  NEWS: `${WP_V2}/news`,
  NEWS_BY_ID: (id) => `${WP_V2}/news/${id}`,

  // タクソノミー関連（推測）
  PROJECT_TAGS: `${WP_V2}/projectd-tag`,
  POSITIONS: `${WP_V2}/position`,

  // パラメータ付きでの取得
  PROJECTS_WITH_PARAMS: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return `${WP_V2}/projects${queryString ? `?${queryString}` : ''}`;
  },

  NEWS_WITH_PARAMS: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return `${WP_V2}/news${queryString ? `?${queryString}` : ''}`;
  },

  TEAM_WITH_PARAMS: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return `${WP_V2}/team${queryString ? `?${queryString}` : ''}`;
  }
};

// 便利なパラメータ生成関数

/**
 * ページネーション用のパラメータ生成
 * @param {number} page - ページ番号
 * @param {number} perPage - 1ページあたりの取得数
 * @returns {Object} - パラメータオブジェクト
 */
export const buildPaginationParams = (page = 1, perPage = 10) => {
  return {
    page: page,
    per_page: perPage
  };
};

/**
 * 検索用のパラメータ生成
 * @param {string} searchTerm - 検索キーワード
 * @returns {Object} - パラメータオブジェクト
 */
export const buildSearchParams = (searchTerm) => {
  return {
    search: searchTerm
  };
};

/**
 * カテゴリー絞り込み用のパラメータ生成
 * @param {Array<number>} categoryIds - カテゴリーIDの配列
 * @returns {Object} - パラメータオブジェクト
 */
export const buildCategoryParams = (categoryIds) => {
  return {
    categories: categoryIds.join(',')
  };
};

/**
 * 並び順のパラメータ生成
 * @param {string} orderBy - 並び順のキー（date, title, menu_order等）
 * @param {string} order - 昇順/降順（asc, desc）
 * @returns {Object} - パラメータオブジェクト
 */
export const buildOrderParams = (orderBy = 'date', order = 'desc') => {
  return {
    orderby: orderBy,
    order: order
  };
};

/**
 * 複数パラメータを統合
 * @param {...Object} paramObjects - パラメータオブジェクトの可変長引数
 * @returns {Object} - 統合されたパラメータオブジェクト
 */
export const combineParams = (...paramObjects) => {
  return Object.assign({}, ...paramObjects);
};
