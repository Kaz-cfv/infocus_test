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
    this.formData = {};

    // 全ての入力要素を取得してデータを収集
    const inputs = this.$form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      const name = input.name;
      if (!name) return; // name属性がない場合はスキップ

      if (input.type === 'radio') {
        // ラジオボタンの処理
        if (input.checked) {
          this.formData[name] = input.value;
          console.log(`Radio collected: ${name} = ${input.value}`);
        }
      } else if (input.type === 'checkbox') {
        // チェックボックスの処理
        if (input.checked) {
          this.formData[name] = input.value;
          console.log(`Checkbox collected: ${name} = ${input.value}`);
        }
      } else if (input.type === 'file') {
        // ファイル型は除外
        return;
      } else {
        // その他のフィールド（text, email, textarea等）
        const value = input.value ? input.value.trim() : '';
        if (value) {
          this.formData[name] = value;
          console.log(`Input collected: ${name} = ${value}`);
        }
      }
    });

    // デバッグ用ログ
    console.log('=== Final collected form data ===');
    console.log(this.formData);

    // データが空の場合は警告
    if (Object.keys(this.formData).length === 0) {
      console.warn('警告: フォームデータが空です');
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
      // FormDataを使用してデータを作成
      const formData = new FormData();

      // フォームデータをFormDataに追加
      for (const [key, value] of Object.entries(this.formData)) {
        formData.append(key, value);
        console.log(`Adding to FormData: ${key} = ${value}`);
      }

      // fetchで送信（no-corsモード）
      const response = await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      console.log('Form submitted via fetch (no-cors)');
      return true;

    } catch (error) {
      console.error('Fetch submission failed:', error);

      // フォールバック: iframeを使用した送信
      try {
        console.log('Trying iframe fallback method...');
        return this.submitViaIframe(formUrl);
      } catch (iframeError) {
        console.error('Iframe fallback also failed:', iframeError);
        return false;
      }
    }
  }

  // iframeを使用したフォールバック送信
  submitViaIframe(formUrl) {
    return new Promise((resolve) => {
      // 非表示iframeを作成
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
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
        console.log(`Adding to temp form: ${key} = ${value}`);
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

        console.log('Form submitted via iframe fallback');
        resolve(true);
      };

      // イベントリスナーを設定
      iframe.onload = cleanup;
      iframe.onerror = cleanup;

      // タイムアウトも設定
      setTimeout(cleanup, 5000);

      // フォーム送信
      tempForm.submit();
    });
  }

  // 現在の入力値を隠しフィールドに設定
  setHiddenInputs() {
    // 既存の隠しフィールドをクリア
    const existingHiddenInputs = this.$form.querySelectorAll('input[type="hidden"].temp-hidden');
    existingHiddenInputs.forEach(input => input.remove());

    // 新しい隠しフィールドを作成
    for (const [key, value] of Object.entries(this.formData)) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = key;
      hiddenInput.value = value;
      hiddenInput.className = 'temp-hidden';
      this.$form.appendChild(hiddenInput);
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

        // 送信成功時は少し待ってから成功画面を表示
        setTimeout(() => {
          this.$inputContent.style.display = 'none';
          this.$completeContent.style.display = 'block';

          // ページトップにスクロール
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });

          // フォームをリセット
          this.$form.reset();

          // ボタンを元に戻す
          this.$submitButton.disabled = false;
          this.$submitButton.textContent = 'SEND';
        }, 800); // 0.8秒待つだけに短縮

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
