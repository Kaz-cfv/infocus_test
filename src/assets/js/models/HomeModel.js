/**
 * ホームモデルクラス
 * infocus/v1/options/home エンドポイントのデータを扱う
 * 複雑なネストしたデータ構造を安全に処理
 */

import { BaseModel } from './BaseModel.js';

export class HomeModel extends BaseModel {
  constructor(data = {}) {
    super(data);

    // ホーム特有のデータ構造を処理
    this.home = this._safeHome(data.home);
  }

  /**
   * ホームデータを安全に取得・構造化
   * @param {Object} homeData - ホームデータオブジェクト
   * @returns {Object} - 構造化されたホームデータ
   */
  _safeHome(homeData) {
    if (!homeData) return this._getDefaultHomeData();

    return {
      heros: this._safeHeros(homeData.heros),
      projects: this._safeProjects(homeData.projects),
      contrastBanners: this._safeContrastBanners(homeData.contrast_banners)
    };
  }

  /**
   * ヒーローセクションのデータを安全に取得
   * @param {Array} herosData - ヒーローデータ配列
   * @returns {Array} - 処理されたヒーローデータ
   */
  _safeHeros(herosData) {
    if (!Array.isArray(herosData)) return [];

    return herosData.map(hero => ({
      movie: this._safeProp(hero, 'movie', '')
    }));
  }

  /**
   * プロジェクトセクションのデータを安全に取得
   * @param {Object} projectsData - プロジェクトデータオブジェクト
   * @returns {Object} - 処理されたプロジェクトデータ
   */
  _safeProjects(projectsData) {
    if (!projectsData) return { categories: [], pickup: [] };

    return {
      categories: this._safeProjectCategories(projectsData.catergory),
      pickup: this._safeProjectPickup(projectsData.pickup)
    };
  }

  /**
   * プロジェクトカテゴリを安全に取得
   * @param {Array} categoriesData - カテゴリデータ配列
   * @returns {Array} - 処理されたカテゴリデータ
   */
  _safeProjectCategories(categoriesData) {
    if (!Array.isArray(categoriesData)) return [];

    return categoriesData.map(category => ({
      termId: this._safeProp(category, 'term_id'),
      name: this._safeProp(category, 'name', ''),
      slug: this._safeProp(category, 'slug', ''),
      count: this._safeProp(category, 'count', 0),
      termOrder: this._safeProp(category, 'term_order', '0')
    }));
  }

  /**
   * ピックアッププロジェクトを安全に取得
   * @param {Array} pickupData - ピックアップデータ配列
   * @returns {Array} - 処理されたピックアップデータ
   */
  _safeProjectPickup(pickupData) {
    if (!Array.isArray(pickupData)) return [];

    return pickupData.map(item => {
      const layout = this._safeProp(item, 'acf_fc_layout', '');

      switch (layout) {
        case 'post':
          return this._processPickupPost(item);
        case 'image':
          return this._processPickupImage(item);
        case 'movie':
          return this._processPickupMovie(item);
        default:
          return this._processUnknownLayout(item, layout);
      }
    });
  }

  /**
   * ピックアップ投稿を処理
   * @private
   */
  _processPickupPost(item) {
    const post = this._safeProp(item, 'post', {});
    const acfs = this._safeProp(post, 'acfs', {});

    return {
      layout: 'post',
      id: this._safeProp(post, 'ID'),
      title: this._safeProp(post, 'post_title', ''),
      slug: this._safeProp(post, 'post_name', ''),
      date: this._safeProp(post, 'post_date', ''),
      menuOrder: this._safeProp(post, 'menu_order', 0),
      projectInfo: this._safeProp(acfs, 'project_info', ''),
      projectOutline: this._safeProp(acfs, 'project_outline', ''),
      projectMv: this._safeImage(acfs.project_mv),
      projectUrl: this._safeProjectUrl(acfs.project_url)
    };
  }

  /**
   * ピックアップ画像を処理
   * @private
   */
  _processPickupImage(item) {
    return {
      layout: 'image',
      isMobile: this._safeProp(item, 'is_mobile', false),
      image: this._safeImage(item.image),
      link: this._safeLink(item.link)
    };
  }

  /**
   * ピックアップ動画を処理
   * @private
   */
  _processPickupMovie(item) {
    return {
      layout: 'movie',
      isMobile: this._safeProp(item, 'is_mobile', false),
      image: this._safeImage(item.image),
      file: this._safeProp(item, 'file', ''),
      link: this._safeLink(item.link)
    };
  }

  /**
   * 不明なレイアウトを処理
   * @private
   */
  _processUnknownLayout(item, layout) {
    console.warn(`Unknown pickup layout: ${layout}`);
    return {
      layout: layout || 'unknown',
      rawData: item
    };
  }

  /**
   * プロジェクトURLを安全に取得
   * @private
   */
  _safeProjectUrl(urlData) {
    if (!urlData || typeof urlData !== 'object') return null;

    return {
      title: this._safeProp(urlData, 'title', ''),
      url: this._safeProp(urlData, 'url', ''),
      target: this._safeProp(urlData, 'target', '_self')
    };
  }

  /**
   * リンクデータを安全に取得
   * @private
   */
  _safeLink(linkData) {
    if (!linkData || typeof linkData !== 'object') return null;

    return {
      url: this._safeProp(linkData, 'url', ''),
      target: this._safeProp(linkData, 'target', '_self')
    };
  }

  /**
   * 画像データを安全に取得
   * @private
   */
  _safeImage(imageData) {
    if (!imageData || typeof imageData !== 'object') return null;

    return {
      id: this._safeProp(imageData, 'ID') || this._safeProp(imageData, 'id'),
      title: this._safeProp(imageData, 'title', ''),
      filename: this._safeProp(imageData, 'filename', ''),
      url: this._safeProp(imageData, 'url', ''),
      alt: this._safeProp(imageData, 'alt', ''),
      width: this._safeProp(imageData, 'width', 0),
      height: this._safeProp(imageData, 'height', 0),
      sizes: this._safeProp(imageData, 'sizes', {})
    };
  }

  /**
   * コントラストバナーを安全に取得
   * @param {Array} bannersData - バナーデータ配列
   * @returns {Array} - 処理されたバナーデータ
   */
  _safeContrastBanners(bannersData) {
    if (!Array.isArray(bannersData)) return [];

    return bannersData.map(banner => ({
      image: this._safeImage(banner.image)
    }));
  }

  /**
   * デフォルトのホームデータを返す
   * @private
   */
  _getDefaultHomeData() {
    return {
      heros: [],
      projects: {
        categories: [],
        pickup: []
      },
      contrastBanners: []
    };
  }

  // 便利なゲッターメソッド

  /**
   * ヒーロー動画URLを取得
   * @returns {Array<string>} - 動画URLの配列
   */
  getHeroMovies() {
    return this.home.heros.map(hero => hero.movie).filter(Boolean);
  }

  /**
   * プロジェクトカテゴリを名前順で取得
   * @returns {Array} - ソート済みカテゴリ配列
   */
  getProjectCategoriesSorted() {
    return [...this.home.projects.categories].sort((a, b) => {
      const orderA = parseInt(a.termOrder) || 0;
      const orderB = parseInt(b.termOrder) || 0;
      return orderA - orderB;
    });
  }

  /**
   * 投稿タイプのピックアップのみを取得
   * @returns {Array} - 投稿ピックアップの配列
   */
  getPickupPosts() {
    return this.home.projects.pickup.filter(item => item.layout === 'post');
  }

  /**
   * 画像タイプのピックアップのみを取得
   * @returns {Array} - 画像ピックアップの配列
   */
  getPickupImages() {
    return this.home.projects.pickup.filter(item => item.layout === 'image');
  }

  /**
   * 動画タイプのピックアップのみを取得
   * @returns {Array} - 動画ピックアップの配列
   */
  getPickupMovies() {
    return this.home.projects.pickup.filter(item => item.layout === 'movie');
  }

  /**
   * モバイル用コンテンツのみを取得
   * @returns {Array} - モバイル専用コンテンツの配列
   */
  getMobileContent() {
    return this.home.projects.pickup.filter(item => item.isMobile === true);
  }
}
