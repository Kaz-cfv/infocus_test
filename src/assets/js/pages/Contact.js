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

    // 表示用とAPI送信用の別々のデータオブジェクトを用意
    this.displayData = {};
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
      const errorMsg = field.querySelector('.error_msg');
      const fieldName = field.getAttribute('data-fields');

      // ラジオボタンのバリデーション
      const radioButtons = field.querySelectorAll('input[type="radio"]');
      if (radioButtons.length > 0) {
        const isRadioChecked = Array.from(radioButtons).some(radio => radio.checked);
        if (!isRadioChecked) {
          errorMsg.textContent = '選択してください';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
        return;
      }

      // その他の入力要素のバリデーション
      const input = field.querySelector('input, textarea, select');
      if (!input) return;

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
        if (!value) {
          errorMsg.textContent = '必須です';
          errorMsg.style.display = 'block';
          isValid = false;
        } else if (!emailPattern.test(value)) {
          errorMsg.textContent = '有効なメールアドレスを入力してください';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
          errorMsg.style.display = 'none';
        }
      } else if (inputType === 'tel') {
        // 電話番号のバリデーション
        if (!value) {
          errorMsg.textContent = '必須です';
          errorMsg.style.display = 'block';
          isValid = false;
        } else {
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
    this.displayData = {};
    this.formData = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) continue; // ファイル型は除外

      // 日付フィールドの処理
      if (key.includes('entry.') && value.includes('-')) {
        const isPotentialDate = /^\d{4}-\d{2}-\d{2}$/.test(value); // YYYY-MM-DD形式かどうかをチェック
        if (isPotentialDate) {
          try {
            const date = new Date(value);
            // 元のキーから年月日のキーを生成
            const baseKey = key.split('_')[0];

            // Google Forms送信用データ
            this.formData[`${baseKey}_year`] = date.getFullYear().toString();
            this.formData[`${baseKey}_month`] = (date.getMonth() + 1).toString();
            this.formData[`${baseKey}_day`] = date.getDate().toString();

            // 確認画面表示用データ
            this.displayData[key] = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
          } catch (e) {
            console.error('Date parsing error:', e);
            this.displayData[key] = value;
            this.formData[key] = value;
          }
        } else {
          // 日付形式でない場合
          this.displayData[key] = value;
          this.formData[key] = value;
        }
      } else if (key.includes('entry.')) {
        // entry.で始まるフィールドの処理
        const input = this.$form.querySelector(`[name="${key}"]`);
        if (input && input.type === 'checkbox') {
          // チェックボックスの処理
          if (input.checked) {
            const checkboxValue = input.value; // value属性の値を取得
            this.formData[key] = checkboxValue;   // 送信用にはvalue属性の値を使用
            this.displayData[key] = checkboxValue; // 表示用も同じ
          }
        } else {
          // その他のフィールド
          this.formData[key] = value;
          this.displayData[key] = value;
        }
      } else {
        // entry.で始まらないフィールド
        this.formData[key] = value;
        this.displayData[key] = value;
      }
    }

    // デバッグ用
    console.log('=== Form Data Collection ===');
    console.log('Display Data:', this.displayData);
    console.log('Form Data for API:', this.formData);

    // グローバルにアクセス可能にする
    window.contactData = {
      displayData: this.displayData,
      formData: this.formData
    };
  }

  // Google Formsへのデータ送信
  async submitToGoogleForms() {
    const formUrl = this.formEndpoints[this.formId];
    if (!formUrl) {
      console.error('Form endpoint not found');
      return false;
    }

    return new Promise((resolve) => {
      try {
        // 非表示iframeを作成
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.name = 'hidden_iframe_' + Date.now();

        // 一時的なフォームを作成
        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = formUrl;
        tempForm.target = iframe.name;
        tempForm.style.display = 'none';

        // フォームデータをhidden inputとして追加
        for (const [key, value] of Object.entries(this.formData)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          tempForm.appendChild(input);
          console.log(`Adding to form: ${key} = ${value}`);
        }

        // DOMに追加
        document.body.appendChild(iframe);
        document.body.appendChild(tempForm);

        // iframeのロード完了を監視
        let completed = false;
        const cleanup = () => {
          if (completed) return;
          completed = true;

          setTimeout(() => {
            try {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
              if (tempForm.parentNode) {
                document.body.removeChild(tempForm);
              }
            } catch (e) {
              console.log('Cleanup error (non-critical):', e);
            }
          }, 100);

          console.log('Form submitted via iframe');
          resolve(true);
        };

        // イベントリスナーを設定
        iframe.onload = cleanup;
        iframe.onerror = () => {
          console.log('iframe error occurred, but continuing...');
          cleanup();
        };

        // タイムアウトを設定
        setTimeout(() => {
          if (!completed) {
            console.log('iframe timeout, assuming success');
            cleanup();
          }
        }, 3000);

        // フォーム送信
        tempForm.submit();

      } catch (error) {
        console.error('Form submission error:', error);
        resolve(false);
      }
    });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });

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
