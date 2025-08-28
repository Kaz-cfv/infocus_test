export class ApiClient {
  constructor() {
    this.baseUrl = 'https://infocus.wp.site-prev2.com/wp-json/infocus/v1/options/';
  }

  async fetchData(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('API Request:', url);

      const response = await fetch(url);

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('API Response:', data);

      return data;

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getHomeData() {
    return this.fetchData('home');
  }

  /**
   * プロジェクト一覧データを取得
   */
  async getProjectsData() {
    try {
      const url = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2/projects';
      console.log('API Request:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('API Response:', data);

      return data;

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}
