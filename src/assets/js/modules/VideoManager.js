/**
 * VideoManager
 * KVセクションの動画をランダムに再生する機能
 */

const videos = [
  'https://infocusinc.com/wp-content/themes/infocus/assets/movie/set08_30sec_pc.mp4',
  'https://infocusinc.com/wp-content/themes/infocus/assets/movie/set07_30sec_pc.mp4',
  'https://infocusinc.com/wp-content/themes/infocus/assets/movie/set11_30sec_pc.mp4',
  'https://infocusinc.com/wp-content/themes/infocus/assets/movie/set12_30sec_pc.mp4',
  'https://infocusinc.com/wp-content/themes/infocus/assets/movie/set09_30sec_pc.mp4'
];

let currentVideoIndex = -1;

function getRandomVideo() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * videos.length);
  } while (randomIndex === currentVideoIndex && videos.length > 1);

  currentVideoIndex = randomIndex;
  return videos[randomIndex];
}

export class VideoManager {
  constructor() {
    this.initWithRetry();
  }

  initWithRetry(attempts = 0) {
    const maxAttempts = 10;
    const videoElement = document.getElementById('kvVideo');

    if (videoElement) {
      this.init(videoElement);
    } else if (attempts < maxAttempts) {
      setTimeout(() => this.initWithRetry(attempts + 1), 100);
    } else {
      console.warn('VideoManager: KV video element not found after maximum attempts');
    }
  }

  init(videoElement) {
    // ランダム動画の設定
    const selectedVideo = getRandomVideo();
    videoElement.src = selectedVideo;

    // console.log('VideoManager: Video source set to:', selectedVideo);

    // イベントリスナーの設定
    videoElement.addEventListener('error', (e) => {
      console.error('VideoManager: Video load error', e);
      // エラーが発生した場合、別の動画を試す
      const nextVideo = getRandomVideo();
      videoElement.src = nextVideo;
    });

    videoElement.addEventListener('canplay', () => {
      // console.log('VideoManager: Video ready to play');
    });

    videoElement.addEventListener('loadstart', () => {
      // console.log('VideoManager: Video load started');
    });
  }

  // デバッグ用メソッド
  getCurrentVideoInfo() {
    return {
      index: currentVideoIndex,
      url: videos[currentVideoIndex],
      total: videos.length
    };
  }

  nextVideo() {
    const videoElement = document.getElementById('kvVideo');
    if (videoElement) {
      const selectedVideo = getRandomVideo();
      videoElement.src = selectedVideo;
    }
  }
}
