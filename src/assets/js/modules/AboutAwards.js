/**
 * AboutAwards - Aboutページのアワード情報をAPIから取得・表示する
 *
 */

export class AboutAwards {
  constructor() {
    this.apiEndpoint = 'https://infocus.wp.site-prev2.com/wp-json/wp/v2/projects';
    this.allProjects = [];
    this.awardsData = [];
    this.debug = false; // デバッグモード
  }

  /**
  * 初期化処理
  */
  async init() {
    try {
      // エンドポイントの接続確認
      await this.fetchProjects();

      // acfs.awardを抽出
      this.extractAwards();

      // コンソールに出力
      // this.logResults();

      // 動的にコンポーネントをレンダリング
      this.renderAwards();

    } catch (error) {
      console.error('❌ AboutAwards: エラーが発生しました', error);
    }
  }

  /**
  * ProjectsデータをAPIから取得（ページネーション対応）
  */
  async fetchProjects() {
    try {
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100; // 1ページあたりの取得件数

      while (hasMorePages) {
        const url = `${this.apiEndpoint}?per_page=${perPage}&page=${currentPage}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 400) {
            // ページがない場合は終了
            // console.log(`  ℹ️ ページ ${currentPage} はデータなし。取得完了。`);
            hasMorePages = false;
              break;
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const pageData = await response.json();
        const pageArray = Array.isArray(pageData) ? pageData : [pageData];

        if (pageArray.length === 0) {
          // console.log(`  ℹ️ ページ ${currentPage} はデータなし。取得完了。`);
          hasMorePages = false;
        } else {
          this.allProjects = [...this.allProjects, ...pageArray];
          // console.log(`  ✓ ページ ${currentPage}: ${pageArray.length}件取得（累計: ${this.allProjects.length}件）`);

          // 取得件数がper_page未満の場合は最終ページ
          if (pageArray.length < perPage) {
            // console.log(`  ℹ️ 最終ページに到達しました。`);
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }

        // 安全装置：無限ループ防止（最大20ページまで）
        if (currentPage > 20) {
          // console.warn('⚠️ ページ数上限に達しました（最大20ページ）');
          break;
        }
      }

      // console.log(`📊 取得したプロジェクト総数: ${this.allProjects.length}件`);

      if (this.debug) {
        console.log('📦 全プロジェクトデータ:', this.allProjects);
      }

    } catch (error) {
      console.error('⚠️ Step 1: エンドポイント接続失敗', error);
      throw error;
    }
  }

  /**
   * acfs.awardを抽出（yearが設定されているもののみ）
   */
  extractAwards() {
    this.awardsData = this.allProjects
      .map(project => {
        // acfs または acf からカスタムフィールドを取得
        const acfsData = project.acfs || project.acf;

        if (!acfsData || !acfsData.award) {
          return null;
        }

        const award = acfsData.award;

        // yearが設定されているかチェック
        if (!award.year || award.year.trim() === '') {
          return null;
        }

        // 必要なデータを整形して返す
        return {
          projectId: project.id,
          projectTitle: typeof project.title === 'string'
            ? project.title
            : project.title?.rendered || '',
          projectSlug: project.slug,
          year: award.year,
          awardData: award,
          acfsData: acfsData
        };
      })
      .filter(item => item !== null); // nullを除外

    // console.log(`🏆 アワードが設定されているプロジェクト: ${this.awardsData.length}件`);
  }

  /**
  * 抽出結果をコンソールに出力
  */
  logResults() {
    if (this.awardsData.length === 0) {
      console.log('⚠️ アワードデータが見つかりませんでした');
      return;
    }

    // 年度ごとにグループ化
    const groupedByYear = this.groupByYear(this.awardsData);

    console.log('📊 年度別アワードデータ:');
    console.table(
      this.awardsData.map(item => ({
      'プロジェクトID': item.projectId,
      'プロジェクト名': item.projectTitle,
      '年度': item.year,
      'Slug': item.projectSlug
      }))
    );

    console.log('\n🗂️ 年度別グループ:');
    Object.keys(groupedByYear).sort().reverse().forEach(year => {
      console.log(`\n📅 ${year}年 (${groupedByYear[year].length}件)`);
        groupedByYear[year].forEach(item => {
        console.log(`  - ${item.projectTitle}`);
      });
    });

    console.log('\n🔍 詳細データ（全て）:');
    console.log(this.awardsData);

    // 表示用データを整形して出力
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 表示用データ（整形済み）:');
    const displayData = this.formatForDisplay();
    console.log(displayData);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * 年度別にグループ化
   */
  groupByYear(data) {
    return data.reduce((acc, item) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {});
  }

  /**
   * 抽出したアワードデータを取得（外部からアクセス用）
   */
  getAwardsData() {
    return this.awardsData;
  }

  /**
   * 全プロジェクトデータを取得（外部からアクセス用）
   */
  getAllProjects() {
    return this.allProjects;
  }

  /**
   * 表示用データに整形
   * Summary.astroで使用する形式に変換
   */
  formatForDisplay() {
    // 年度ごとにグループ化
    const groupedByYear = this.groupByYear(this.awardsData);

    // 年度を降順にソート
    const sortedYears = Object.keys(groupedByYear).sort().reverse();

    const formattedData = sortedYears.map(year => {
      const yearProjects = groupedByYear[year];

      // 各プロジェクトを表示用フォーマットに変換
      const awards = yearProjects.map((project, index) => {
        const acfsData = project.acfsData;

        return {
          id: project.projectId,
          slug: project.projectSlug,
          name: project.projectTitle,
          url: `/projects/${project.projectSlug}/`,
          caption: project.projectTitle,
          content: this.formatAwardContent(acfsData.award),
          pic: acfsData.main?.image?.url || acfsData.thumbnail?.url || ''
        };
      });

      return {
        slug: `year_${year}`, // 年度をslugとして使用
        name: `${year}年のアワード`,
        year: year,
        head: year,
        awards: awards
      };
    });

    // console.log(`✅ ${sortedYears.length}年度分のデータを整形完了`);

    // 各年度の詳細をログ出力
    // formattedData.forEach(yearData => {
    //   console.log(`\n📅 ${yearData.year}年:`);
    //   console.table(
    //     yearData.awards.map(award => ({
    //       'ID': award.id,
    //       'プロジェクト名': award.name,
    //       'Slug': award.slug,
    //       'URL': award.url,
    //       '画像': award.pic ? '✓' : '✗'
    //     }))
    //   );
    // });

    return formattedData;
  }

  /**
  * アワード内容をHTML形式に整形
  * acfs.award.titleの内容を<p>タグで囲む
  * 改行コード(\n)を境にそれぞれ別の<p>タグに分割
   */
  formatAwardContent(award) {
    if (!award || !award.title) {
      return '<p>アワード情報なし</p>';
    }

    // titleが配列の場合（複数のアワード）
    if (Array.isArray(award.title)) {
      return award.title
      .filter(title => title && title.trim() !== '')
      .map(title => {
        // 改行コードで分割し、それぞれを<p>タグで囲む
        return title.trim()
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `<p>${line.trim()}</p>`)
          .join('');
      })
      .join('');
    }

    // titleが文字列の場合（単一のアワード）
    if (typeof award.title === 'string' && award.title.trim() !== '') {
      // 改行コードで分割し、それぞれを<p>タグで囲む
      return award.title.trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
    }

    return '<p>アワード情報なし</p>';
  }

  /**
   * 動的にアワードコンポーネントをレンダリング
   */
  renderAwards() {
    const summaryContainer = document.querySelector('.p-about-awards__summary');

    if (!summaryContainer) {
      console.error('⚠️ .p-about-awards__summary コンテナが見つかりません');
      return;
    }

    // 表示用データを取得
    const displayData = this.formatForDisplay();

    if (displayData.length === 0) {
      console.log('⚠️ 表示するアワードデータがありません');
      return;
    }

    // 既存のコンテンツをクリア
    summaryContainer.innerHTML = '';

    // 各年度のコンポーネントを生成
    displayData.forEach((yearData, yearIndex) => {
      const summaryItem = this.createSummaryItem(yearData, yearIndex);
      summaryContainer.appendChild(summaryItem);
    });

    // ホバーイベントを再初期化（About.jsのメソッドを使用）
    this.reinitializeHoverEvents();
  }

  /**
   * Summary.astroコンポーネント構造を生成
   */
  createSummaryItem(yearData, yearIndex) {
    const itemDiv = document.createElement('div');
    // 最初の5つ（index 0-4）以外に.js-awards-hiddenを付与
    itemDiv.className = `p-about-awards__summary-item ${yearIndex >= 5 ? 'js-awards-hidden' : ''}`;

    // c-summaryコンポーネントを生成
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'c-summary';
    summaryDiv.setAttribute('data-summary', yearData.slug);

    // 年度タイトル
    const yearTitle = document.createElement('h3');
    yearTitle.className = 'c-summary__year';
    yearTitle.textContent = yearData.head;

    // 情報コンテナ（画像も各アイテムに含む新しい構造）
    const infoDiv = this.createInfoContainer(yearData.awards, yearData.name);

    // 全てを組み立て
    summaryDiv.appendChild(yearTitle);
    summaryDiv.appendChild(infoDiv);
    itemDiv.appendChild(summaryDiv);

    return itemDiv;
  }

  /**
   * 個別アイテム用の画像コンテナを生成
   */
  createPictureElement(award, yearName) {
    const picDiv = document.createElement('div');
    picDiv.className = 'c-summary__pic';

    const figure = document.createElement('figure');

    const img = document.createElement('img');
    img.src = award.pic;
    img.alt = yearName;

    figure.appendChild(img);
    picDiv.appendChild(figure);

    return picDiv;
  }

  /**
   * 情報コンテナを生成（各アイテムに画像を含む新しい構造）
   */
  createInfoContainer(awards, yearName) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'c-summary__info';

    awards.forEach(award => {
      const wrapper = document.createElement('div');
      wrapper.className = 'c-summary__info-wrapper';
      // wrapper.href = award.url;

      // 画像を各wrapperの直接の子要素として配置
      const picElement = this.createPictureElement(award, yearName);
      wrapper.appendChild(picElement);

      const dl = document.createElement('dl');
      dl.className = 'c-summary__info-item';
      dl.setAttribute('data-award-id', award.id);

      const dt = document.createElement('dt');
      dt.className = 'c-summary__info-caption';

      const link = document.createElement('a');
      link.href = award.url;
      link.textContent = award.caption;

      dt.appendChild(link);

      const dd = document.createElement('dd');
      dd.className = 'c-summary__info-content';
      dd.innerHTML = award.content;

      dl.appendChild(dt);
      dl.appendChild(dd);
      wrapper.appendChild(dl);
      infoDiv.appendChild(wrapper);
    });

    return infoDiv;
  }

  /**
   * ホバーイベントを再初期化
   * 新しいDOM構造では不要だが、互換性のために残しておく
   */
  reinitializeHoverEvents() {
    // 画像が各アイテム内に移動したため、ホバーイベントは不要
    // 必要に応じてここに新しいイベントハンドラーを追加
  }
}
