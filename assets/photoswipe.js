import '@archetype-themes/scripts/vendors/photoswipe.min'
import '@archetype-themes/scripts/vendors/photoswipe-ui-default.min'
import '@archetype-themes/scripts/config'

theme.Photoswipe = (function() {
  var selectors = {
    trigger: '.js-photoswipe__zoom',
    images: '.photoswipe__image',
    slideshowTrack: '.flickity-viewport ',
    activeImage: '.is-selected'
  };

  function Photoswipe(container, sectionId) {
    this.container = container;
    this.sectionId = sectionId;
    this.namespace = '.photoswipe-' + this.sectionId;
    this.gallery;
    this.images;
    this.items;
    this.inSlideshow = false;

    if (!container || container.dataset.zoom === 'false') {
      return;
    }

    this.init();
  }

  Photoswipe.prototype = Object.assign({}, Photoswipe.prototype, {
    init: function() {
      this.container.querySelectorAll(selectors.trigger).forEach(trigger => {
        trigger.on('click' + this.namespace, this.triggerClick.bind(this));
      });
    },

    triggerClick: function(evt) {
      // Streamline changes between a slideshow and
      // stacked images, so recheck if we are still
      // working with a slideshow when initializing zoom
      if (this.container.dataset && this.container.dataset.hasSlideshow === 'true') {
        this.inSlideshow = true;
      } else {
        this.inSlideshow = false;
      }

      this.items = this.getImageData();

      var image = this.inSlideshow ? this.container.querySelector(selectors.activeImage) : evt.currentTarget;

      var index = this.inSlideshow ? this.getChildIndex(image) : image.dataset.index;

      this.initGallery(this.items, index);
    },

    // Because of image set feature, need to get index based on location in parent
    getChildIndex: function(el) {
      var i = 0;
      while( (el = el.previousSibling) != null ) {
        i++;
      }

      // 1-based index required
      return i + 1;
    },

    getImageData: function() {
      this.images = this.inSlideshow
                      ? this.container.querySelectorAll(selectors.slideshowTrack + selectors.images)
                      : this.container.querySelectorAll(selectors.images);

      var items = [];
      var options = {};

      this.images.forEach(el => {
        var item = {
          msrc: el.currentSrc || el.src,
          src: el.getAttribute('data-photoswipe-src'),
          w: el.getAttribute('data-photoswipe-width'),
          h: el.getAttribute('data-photoswipe-height'),
          el: el,
          initialZoomLevel: 0.5
        }

        items.push(item);
      });

      return items;
    },

    initGallery: function(items, index) {
      document.body.classList.add('photoswipe-open');
      var pswpElement = document.querySelectorAll('.pswp')[0];

      var options = {
        allowPanToNext: false,
        captionEl: false,
        closeOnScroll: false,
        counterEl: false,
        history: false,
        index: index - 1,
        pinchToClose: false,
        preloaderEl: false,
        scaleMode: 'zoom',
        shareEl: false,
        tapToToggleControls: false,
        getThumbBoundsFn: function(index) {
          var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
          var thumbnail = items[index].el;
          var rect = thumbnail.getBoundingClientRect();
          return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
        }
      }

      this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
      this.gallery.listen('afterChange', this.afterChange.bind(this));
      this.gallery.init();

      this.preventiOS15Scrolling();
    },

    afterChange: function() {
      var index = this.gallery.getCurrentIndex();
      this.container.dispatchEvent(new CustomEvent('photoswipe:afterChange', {
        detail: {
          index: index
        }
      }));
    },

    syncHeight: function() {
      document.documentElement.style.setProperty(
        "--window-inner-height",
        `${window.innerHeight}px`
      );
    },

    // Fix poached from https://gist.github.com/dimsemenov/0b8c255c0d87f2989e8ab876073534ea
    preventiOS15Scrolling: function() {
      let initialScrollPos;

      if (!/iPhone|iPad|iPod/i.test(window.navigator.userAgent)) return;

      this.syncHeight();

      // Store scroll position to restore it later
      initialScrollPos = window.scrollY;

      // Add class to root element when PhotoSwipe opens
      document.documentElement.classList.add('pswp-open-in-ios');

      window.addEventListener('resize', this.syncHeight);

      this.gallery.listen('destroy', () => {
        document.documentElement.classList.remove('pswp-open-in-ios');
        window.scrollTo(0, initialScrollPos);
      });
    }
  });

  return Photoswipe;
})();
