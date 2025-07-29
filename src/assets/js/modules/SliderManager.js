import Swiper from "swiper";
import "swiper/css/bundle";
import {
  Autoplay,
  Navigation,
  EffectCreative,
  EffectCards,
  EffectFade
} from "swiper/modules";

export class SliderManager {
  constructor() {
    this.sliders = new Map();
    this.initializeAllSliders();
  }

  initializeAllSliders() {
    const sliderElements = document.querySelectorAll('[data-slider]');

    if (sliderElements.length > 0) {
      sliderElements.forEach((element, index) => {
        const sliderType = element.getAttribute('data-slider');
        const swiperElement = element.querySelector('.swiper');

        if (swiperElement) {
          const sliderId = `slider-${index}`;
          const swiper = this.createSlider(swiperElement, sliderType, index);
          this.sliders.set(sliderId, swiper);
        }
      });
    } else {
      console.log('No slider elements found');
    }
  }

  createSlider(element, type, index) {
    let config = {};

    switch (type) {
      case 'home-slider':
        config = this.getHomeSliderConfig();
        break;

      case 'layer-slider':
        config = this.getLayerSliderConfig();
        break;

      case 'fade-slider':
        config = this.getFadeSliderConfig();
        break;

      case 'card-slider':
        config = this.getCardSliderConfig();
        break;

      default:
        config = this.getDefaultSliderConfig();
        break;
    }

    return new Swiper(element, config);
  }

  getHomeSliderConfig() {
    return {
      modules: [Autoplay],
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 1500,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      }
    };
  }

  getLayerSliderConfig() {
    return {
      modules: [Autoplay, EffectCreative],
      effect: 'creative',
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 1500,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      creativeEffect: {
        prev: {
          shadow: true,
          translate: [0, 0, -800],
          scale: 0.8,
          opacity: 0,
        },
        next: {
          shadow: true,
          translate: [0, 0, 400],
          scale: 1.2,
          opacity: 0,
        },
        limitProgress: 3,
        shadowPerProgress: true,
      }
    };
  }

  getFadeSliderConfig() {
    return {
      modules: [Autoplay, EffectFade],
      effect: 'fade',
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 1200,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      fadeEffect: {
        crossFade: true
      }
    };
  }

  getCardSliderConfig() {
    return {
      modules: [Autoplay, EffectCards],
      effect: 'cards',
      slidesPerView: 1,
      loop: true,
      speed: 1000,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      cardsEffect: {
        perSlideOffset: 8,
        perSlideRotate: 2,
        rotate: true,
        slideShadows: true,
      }
    };
  }

  getDefaultSliderConfig() {
    return {
      modules: [Autoplay],
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      speed: 1000,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      }
    };
  }

  getSlider(id) {
    return this.sliders.get(id);
  }

  destroy() {
    this.sliders.forEach((swiper) => {
      if (swiper && typeof swiper.destroy === 'function') {
        swiper.destroy(true, true);
      }
    });
    this.sliders.clear();
  }
}
