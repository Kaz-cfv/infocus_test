/**
 * ホームデータ取得・検証ユーティリティ
 * デバッグ用のコンソール出力機能を提供
 */

import { apiService } from '../api/ApiService.js';
import { ENDPOINTS } from '../api/Endpoints.js';
import { HomeModel } from '../models/HomeModel.js';

/**
 * ホームデータを取得してコンソールに出力
 * 開発時のデータ構造確認用
 */
export class HomeDataDebugger {

  /**
   * ホームデータを取得してコンソールに詳細出力
   */
  static async fetchAndDebugHomeData() {
    console.group('🏠 HOME DATA DEBUG - IN FOCUS');

    try {
      // APIからデータ取得
      console.log('📡 Fetching data from:', ENDPOINTS.HOME);
      const rawData = await apiService.get(ENDPOINTS.HOME);

      // HomeModelでデータ処理
      const homeModel = new HomeModel(rawData);

      // 画像の通りの構成でコンソール出力
      console.group('🎬 ヒーロー動画');
      console.log('home.heros[].movie:', homeModel.getHeroMovies());
      console.groupEnd();

      console.group('🏷️ カテゴリ WP_Term');
      console.log('home.projects.category[]:', homeModel.home.projects.categories);
      console.groupEnd();

      console.group('📦 ブロック');
      console.log('home.projects.pickup[]:', homeModel.home.projects.pickup);
      console.groupEnd();

      console.group('📄 プロジェクト投稿 WP_Post');
      const pickupPosts = homeModel.getPickupPosts();
      console.log('home.projects.pickup[].acf_fc_layout === post:', pickupPosts);
      console.groupEnd();

      console.group('🖼️ 画像');
      const pickupImages = homeModel.getPickupImages();
      console.log('home.projects.pickup[].acf_fc_layout === image:', pickupImages);
      console.groupEnd();

      console.group('🎥 動画');
      const pickupMovies = homeModel.getPickupMovies();
      console.log('home.projects.pickup[].acf_fc_layout === movie:', pickupMovies);
      console.groupEnd();

      console.group('🖼️ 画像 (contrast_banners)');
      console.log('home.contrast_banners[].image:', homeModel.home.contrastBanners);
      console.groupEnd();

      // 詳細分析
      console.group('📊 詳細分析');
      console.log('Total categories:', homeModel.home.projects.categories.length);
      console.log('Total pickup items:', homeModel.home.projects.pickup.length);
      console.log('Total contrast banners:', homeModel.home.contrastBanners.length);
      console.log('Mobile content count:', homeModel.getMobileContent().length);
      console.groupEnd();

      // 生データも参照用として出力
      console.group('🔍 Raw Data (参照用)');
      console.log('Original API Response:', rawData);
      console.log('HomeModel Instance:', homeModel);
      console.groupEnd();

      return homeModel;

    } catch (error) {
      console.error('❌ Error fetching home data:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 特定の項目のみを詳細デバッグ
   * @param {string} section - デバッグしたいセクション ('heros', 'categories', 'pickup', 'banners')
   */
  static async debugSpecificSection(section = 'all') {
    try {
      const rawData = await apiService.get(ENDPOINTS.HOME);
      const homeModel = new HomeModel(rawData);

      switch (section) {
        case 'heros':
          console.log('🎬 Hero Movies:', homeModel.getHeroMovies());
          break;
        case 'categories':
          console.log('🏷️ Categories:', homeModel.getProjectCategoriesSorted());
          break;
        case 'pickup':
          console.log('📦 Pickup Items:', homeModel.home.projects.pickup);
          break;
        case 'banners':
          console.log('🖼️ Contrast Banners:', homeModel.home.contrastBanners);
          break;
        default:
          return this.fetchAndDebugHomeData();
      }

      return homeModel;
    } catch (error) {
      console.error(`❌ Error debugging ${section}:`, error);
      throw error;
    }
  }
}

/**
 * グローバルな関数として公開（デバッグ用）
 */
if (typeof window !== 'undefined') {
  window.debugHomeData = () => HomeDataDebugger.fetchAndDebugHomeData();
  window.debugHomeSection = (section) => HomeDataDebugger.debugSpecificSection(section);
}
