import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

class VideoScrollController {
  constructor() {
    this.init();
  }

  init() {
    try {
      // ScrollTriggerプラグインの登録
      gsap.registerPlugin(ScrollTrigger);

      // 動画を持つカードを特定して監視開始
      this.setupVideoCardTriggers();

      console.log('VideoScrollController initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VideoScrollController:', error);
    }
  }

  setupVideoCardTriggers() {
    // 複数の手法で動画カードを特定
    let videoCards = [];

    // 方法1: :has()セレクターを使用（モダンブラウザ対応）
    try {
      videoCards = Array.from(document.querySelectorAll('.c-project-card:has(video)'));
    } catch (error) {
      console.log(':has()セレクターが使用できません。代替手法を使用します。');
    }

    // 方法2: フォールバック - 全てのカードをチェック
    if (videoCards.length === 0) {
      const allCards = document.querySelectorAll('.c-project-card');
      videoCards = Array.from(allCards).filter(card => {
        const video = card.querySelector('video');
        return video !== null;
      });
    }

    if (videoCards.length === 0) {
      console.log('動画を持つカードが見つかりませんでした');
      return;
    }

    videoCards.forEach((card) => {
      const video = card.querySelector('video');

      if (!video) return;

      // ScrollTriggerで各カードを監視
      ScrollTrigger.create({
        trigger: card,
        start: "center 60%", // カードの中心がビューポートの60%の位置に来たとき
        end: "center 40%",   // カードの中心がビューポートの40%の位置を超えたとき

        onEnter: () => {
          // まるで容疑者がターゲットエリアに入った瞬間のように
          this.activateCard(card, video);
        },

        onLeave: () => {
          // エリアから出た瞬間を察知
          this.deactivateCard(card, video);
        },

        onEnterBack: () => {
          // 逆方向から再入場
          this.activateCard(card, video);
        },

        onLeaveBack: () => {
          // 逆方向で退場
          this.deactivateCard(card, video);
        },

        // デバッグ用（開発時のみ有効にする）
        markers: false,
        // id: `video-card-${card.dataset.id}`
      });
    });

    console.log(`${videoCards.length}枚の動画カードの監視を開始しました`);
  }

  activateCard(card, video) {
    // is-playクラスを付与（まるで重要な証拠にマーキングするように）
    card.classList.add('is-play');

    // 動画の再生準備
    if (video.readyState >= 3) {
      // 動画が再生可能な状態
      this.playVideo(video);
    } else {
      // まだ読み込み中の場合は、読み込み完了を待つ
      video.addEventListener('canplay', () => {
        this.playVideo(video);
      }, { once: true });
    }

    console.log(`カード ID:${card.dataset.id} がアクティブになりました`);
  }

  deactivateCard(card, video) {
    // is-playクラスを削除
    card.classList.remove('is-play');

    // 動画を一時停止
    this.pauseVideo(video);

    console.log(`カード ID:${card.dataset.id} が非アクティブになりました`);
  }

  playVideo(video) {
    try {
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('動画の自動再生に失敗:', error);
          // ユーザーの操作が必要な場合があります
        });
      }
    } catch (error) {
      console.warn('動画再生エラー:', error);
    }
  }

  pauseVideo(video) {
    try {
      video.pause();
      // 再生位置をリセット（必要に応じて）
      // video.currentTime = 0;
    } catch (error) {
      console.warn('動画停止エラー:', error);
    }
  }

  // 監視システムの停止（必要に応じて）
  destroy() {
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.vars.id && trigger.vars.id.includes('video-card')) {
        trigger.kill();
      }
    });
  }
}

export { VideoScrollController };
