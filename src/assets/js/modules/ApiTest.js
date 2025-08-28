export class ApiTest {
  constructor() {
    this.button = null;
    this.resultDiv = null;
    this.init();
  }

  init() {
    this.button = document.getElementById('testApiButton');
    this.resultDiv = document.getElementById('result');

    if (this.button && this.resultDiv) {
      this.bindEvents();
    }
  }

  bindEvents() {
    this.button.addEventListener('click', this.testApi.bind(this));
  }

  async testApi() {
    try {
      console.log('APIテスト開始...');

      const response = await fetch('https://infocus.wp.site-prev2.com/wp-json/infocus/v1/carrer');

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      this.resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    } catch (error) {
      console.error('API Error:', error);
      this.resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  }
}
