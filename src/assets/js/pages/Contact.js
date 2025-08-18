class Contact {
  constructor() {
    this.$page = document.querySelector('.contact');
    if (!this.$page) return;

    // フォームのエンドポイント
    this.formEndpoints = {
      'inquiryForm': 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScXoU05Fxc2EftUIPQoqoKSQ7LdXPCIVunEOjq7h63Xhs2JiQ/formResponse',
    };

    // フォーム要素の特定
    this.$form = this.$page.querySelector('form');
    this.formId = this.$form.getAttribute('id');

    // フォームの各状態のコンテンツ要素
    this.$inputContent = this.$page.querySelector('[data-state="input"]');
    this.$completeContent = this.$page.querySelector('[data-state="complete"]');

    // ボタン要素
    this.$submitButton = this.$inputContent.querySelector('.--button .c-button');

    // 送信用データオブジェクト
    this.formData = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.setInitialState();
  }

  setInitialState() {
    // 初期状態では入力画面のみ表示
    this.$inputContent.style.display = 'block';
    this.$completeContent.style.display = 'none';
  }

  bindEvents() {
    // フォームのデフォルトの送信を防ぐ
    this.$form.addEventListener('submit', (e) => e.preventDefault());

    // 送信ボタンクリック時の処理
    this.$submitButton.addEventListener('click', () => this.handleSubmit());

    // チェックボックスの特別処理
    const checkboxes = this.$form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const field = checkbox.closest('.contact__item');
        const errorMsg = field.querySelector('.error_msg');
        if (checkbox.checked) {
          errorMsg.style.display = 'none';
        }
      });
    });
  }

  // 必須項目のバリデーション
  validateRequiredFields() {
    let isValid = true;
    const requiredFields = this.$form.querySelectorAll('.--require');

    requiredFields.forEach(field => {
      const input = field.querySelector('input, textarea, select');
      const errorMsg = field.querySelector('.error_msg');
      const value = input.value.trim();
      const inputType = input.type || input.tagName.toLowerCase();

      if (inputType === 'checkbox') {
        // チェックボックスのバリデーション
        if (!input.checked) {
          errorMsg.textContent = '必須です';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
      } else if (inputType === 'email') {
        // メールアドレスのバリデーション
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(value)) {
          errorMsg.textContent = '有効なメールアドレスを入力してください';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
      } else if (inputType === 'tel') {
        // 電話番号のバリデーション
        const containsHyphenPattern = /-/;
        const numericPattern = /^[0-9]+$/;

        if (containsHyphenPattern.test(value)) {
          errorMsg.textContent = '電話番号にはハイフンを含めないでください';
          errorMsg.style.display = 'block';
          isValid = false;
        } else if (!numericPattern.test(value)) {
          errorMsg.textContent = '電話番号には数字のみを入力してください';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
      } else {
        // 必須項目のバリデーション (共通)
        if (!value || value === '選択') {
          errorMsg.textContent = '必須です';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
      }
    });

    return isValid;
  }

  // フォームデータの収集
  collectFormData() {
    const formData = new FormData(this.$form);
    this.formData = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) continue; // ファイル型は除外

      // 日付フィールドの処理
      if (key.includes('entry.') && value.includes('-')) {
        const isPotentialDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
        if (isPotentialDate) {
          try {
            const date = new Date(value);
            const baseKey = key.split('_')[0];

            // Google Forms送信用データ
            this.formData[`${baseKey}_year`] = date.getFullYear().toString();
            this.formData[`${baseKey}_month`] = (date.getMonth() + 1).toString();
            this.formData[`${baseKey}_day`] = date.getDate().toString();
          } catch (e) {
            console.error('Date parsing error:', e);
            this.formData[key] = value;
          }
        } else {
          this.formData[key] = value;
        }
      } else if (key.includes('entry.') && this.$form.querySelector(`[name="${key}"]`)?.type === 'checkbox') {
        // チェックボックスの処理
        const checkbox = this.$form.querySelector(`[name="${key}"]`);
        if (checkbox.checked) {
          const checkboxValue = checkbox.value;
          this.formData[key] = checkboxValue;
        }
      } else {
        // その他のフィールド
        this.formData[key] = value;
      }
    }
  }

  // Google Formsへのデータ送信
  async submitToGoogleForms() {
    const formUrl = this.formEndpoints[this.formId];
    if (!formUrl) {
      console.error('Form endpoint not found');
      return false;
    }

    try {
      const response = await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(this.formData),
      });

      console.log('Form submitted successfully (no-cors mode)');
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    }
  }

  // 送信処理
  async handleSubmit() {
    if (this.validateRequiredFields()) {
      // ボタンを無効化してローディング状態にする
      this.$submitButton.disabled = true;
      this.$submitButton.textContent = 'Sending...';

      this.collectFormData();

      // デバッグ用：送信データをログ出力
      console.log('=== Form Submission Data ===');
      console.log('Form ID:', this.formId);
      console.log('Endpoint:', this.formEndpoints[this.formId]);
      console.log('Data to be sent:', this.formData);

      const success = await this.submitToGoogleForms();

      if (success) {
        console.log('Form submission completed successfully');
        this.$inputContent.style.display = 'none';
        this.$completeContent.style.display = 'block';

        // ページトップにスクロール
        window.scrollTo(0, 0);

        // フォームをリセット
        this.$form.reset();
      } else {
        // 送信失敗時はボタンを元に戻す
        this.$submitButton.disabled = false;
        this.$submitButton.textContent = 'SEND';
        alert('送信に失敗しました。もう一度お試しください。');
      }
    }
  }
}

export default Contact;
