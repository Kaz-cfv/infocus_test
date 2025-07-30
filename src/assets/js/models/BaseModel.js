// BaseModelクラス - 全てのWordPressコンテンツモデルの共通基盤

export class BaseModel {
  constructor(data = {}) {
    // 元データも保持（デバッグ用）
    this._rawData = data;
  }

  /**
   * 安全にプロパティを取得
   * @param {Object} obj - 対象オブジェクト
   * @param {string} key - キー
   * @param {*} defaultValue - デフォルト値
   * @returns {*} - 値
   */
  _safeProp(obj, key, defaultValue = null) {
    return obj && obj[key] !== undefined ? obj[key] : defaultValue;
  }
}
