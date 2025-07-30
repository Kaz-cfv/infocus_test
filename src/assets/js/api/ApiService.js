/**
 * API通信クラス
 * WordPress REST APIとの通信を一元化
 * エラーハンドリングと再試行機能を内包
 */

export class ApiService {
  constructor() {
    this.retryCount = 3;
    this.retryDelay = 1000; // 1秒
  }

  /**
   * 基本的なGETリクエスト
   * @param {string} url - リクエストURL
   * @param {Object} options - オプション
   * @returns {Promise<Object>} - レスポンスデータ
   */
  async get(url, options = {}) {
    return this._request(url, {
      method: 'GET',
      ...options
    });
  }

  /**
   * 内部的なリクエスト処理
   * リトライ機能とエラーハンドリングを含む
   * @private
   */
  async _request(url, options = {}) {
    let lastError;

    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, response);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error;

        // 最後の試行でない場合は待機してリトライ
        if (attempt < this.retryCount - 1) {
          await this._delay(this.retryDelay * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError;
  }

  /**
   * 遅延処理
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// シングルトンインスタンス
export const apiService = new ApiService();
