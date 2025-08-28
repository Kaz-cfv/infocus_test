/**
 * URL Utility Module
 * URLパラメーターの取得と管理を行う
 */

class URLUtils {
  /**
   * URLパラメーターを取得する
   * @param {string} paramName - 取得したいパラメーター名
   * @returns {string|null} - パラメーターの値、存在しない場合はnull
   */
  static getURLParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  }

  /**
   * 全てのURLパラメーターを取得する
   * @returns {Object} - 全パラメーターのオブジェクト
   */
  static getAllURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    for (const [key, value] of urlParams) {
      params[key] = value;
    }

    return params;
  }

  /**
   * 指定されたパラメーターが存在するかチェック
   * @param {string} paramName - チェックしたいパラメーター名
   * @returns {boolean} - 存在する場合true
   */
  static hasParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has(paramName);
  }

  /**
   * デバッグ用：現在のURLとパラメーター情報をコンソールに出力
   */
  static debugURLInfo() {
    console.log('🔍 URL Debug Information:');
    console.log('- Current URL:', window.location.href);
    console.log('- Search params:', window.location.search);
    console.log('- All parameters:', this.getAllURLParameters());
  }
}

export default URLUtils;
