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
      if (!name) return;

      if (input.type === 'radio') {
        // ラジオボタンの処理
        if (input.checked) {
          this.formData[name] = input.value;
        }
      } else if (input.type === 'checkbox') {
        // チェックボックスの処理
        if (input.checked) {
          this.formData[name] = input.value;
        }
      } else if (input.type === 'file') {
        // ファイル型は除外
        return;
      } else {
        // その他のフィールド（text, email, textarea等）
        const value = input.value.trim();
        if (value) {
          // 日付フィールドの処理
          if (name.includes('entry.') && value.includes('-')) {
            const isPotentialDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
            if (isPotentialDate) {
              try {
                const date = new Date(value);
                const baseKey = name.split('_')[0];

                // Google Forms送信用データ
                this.formData[`${baseKey}_year`] = date.getFullYear().toString();
                this.formData[`${baseKey}_month`] = (date.getMonth() + 1).toString();
                this.formData[`${baseKey}_day`] = date.getDate().toString();
              } catch (e) {
                console.error('Date parsing error:', e);
                this.formData[name] = value;
              }
            } else {
              this.formData[name] = value;
            }
          } else {
            this.formData[name] = value;
          }
        }
      }
    });

    // デバッグ用ログ
    console.log('Collected form data:', this.formData);
  }

  // Google Formsへのデータ送信
  async submitToGoogleForms() {
    const formUrl = this.formEndpoints[this.formId];
    if (!formUrl) {
      console.error('Form endpoint not found');
      return false;
    }

    try {
      // 方法1: 新しいタブで送信してすぐ閉じる方法
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = formUrl;
      tempForm.target = '_blank';
      tempForm.style.display = 'none';

      // フォームデータをhidden inputとして追加
      for (const [key, value] of Object.entries(this.formData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        tempForm.appendChild(input);
      }

      // DOMに追加して送信
      document.body.appendChild(tempForm);

      // 送信実行
      tempForm.submit();

      // フォームを削除
      document.body.removeChild(tempForm);

      console.log('Form submitted successfully via new tab');
      return true;

    } catch (error) {
      console.error('Form submission error:', error);

      // フォールバック: 現在のウィンドウで直接送信
      try {
        console.log('Trying fallback method...');

        // 既存フォームの設定を一時保存
        const originalAction = this.$form.action;
        const originalMethod = this.$form.method;

        // フォームの設定を変更
        this.$form.action = formUrl;
        this.$form.method = 'POST';

        // 現在の入力値をhidden inputとして追加
        this.setHiddenInputs();

        // 送信
        this.$form.submit();

        return true;

      } catch (fallbackError) {
        console.error('Fallback submission also failed:', fallbackError);
        return false;
      }
    }
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
          window.scrollTo(0, 0);

          // フォームをリセット
          this.$form.reset();

          // ボタンを元に戻す
          this.$submitButton.disabled = false;
          this.$submitButton.textContent = 'SEND';
        }, 1500); // 1.5秒待つ

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
