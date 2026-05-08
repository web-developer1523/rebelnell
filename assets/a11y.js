import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/helpers/delegate';

theme.a11y = {
  trapFocus: function(options) {
    var eventsName = {
      focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
      focusout: options.namespace
        ? 'focusout.' + options.namespace
        : 'focusout',
      keydown: options.namespace
        ? 'keydown.' + options.namespace
        : 'keydown.handleFocus'
    };

    // Get every possible visible focusable element
    var focusableEls = options.container.querySelectorAll('button, [href], input, select, textarea, label, [tabindex]:not([tabindex^="-"])');
    var elArray = [].slice.call(focusableEls);
    var focusableElements = elArray.filter(el => el.offsetParent !== null);

    var firstFocusable = focusableElements[0];
    var lastFocusable = focusableElements[focusableElements.length - 1];

    if (!options.elementToFocus) {
      options.elementToFocus = options.container;
    }

    options.container.setAttribute('tabindex', '-1');
    options.elementToFocus.focus();

    document.documentElement.off('focusin');
    document.documentElement.on(eventsName.focusout, function() {
      document.documentElement.off(eventsName.keydown);
    });

    document.documentElement.on(eventsName.focusin, function(evt) {
      if (evt.target !== options.container && evt.target !== lastFocusable && evt.target !== firstFocusable) return;

      document.documentElement.on(eventsName.keydown, function(evt) {
        _manageFocus(evt);
      });
    });

    function _manageFocus(evt) {
      if (evt.keyCode !== 9) return;
      /**
       * On the first focusable element and tab backward,
       * focus the last element
       */
      if (evt.target === lastFocusable && !evt.shiftKey) {
        evt.preventDefault();
        firstFocusable.focus();
      }
    }
  },
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.container) {
      options.container.removeAttribute('tabindex');
    }

    document.documentElement.off(eventName);
  },

  lockMobileScrolling: function(namespace, element) {
    var el = element ? element : document.documentElement;
    document.documentElement.classList.add('lock-scroll');
    el.on('touchmove' + namespace, function() {
      return true;
    });
  },

  unlockMobileScrolling: function(namespace, element) {
    document.documentElement.classList.remove('lock-scroll');
    var el = element ? element : document.documentElement;
    el.off('touchmove' + namespace);
  }
};

// Add class when tab key starts being used to show outlines
document.documentElement.on('keyup.tab', function(evt) {
  if (evt.keyCode === 9) {
    document.documentElement.classList.add('tab-outline');
    document.documentElement.off('keyup.tab');
  }
});

const trapFocusHandlers = {};
