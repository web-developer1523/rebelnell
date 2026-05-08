import '@archetype-themes/scripts/config';

theme.utils = {
  defaultTo: function(value, defaultValue) {
    return (value == null || value !== value) ? defaultValue : value
  },

  wrap: function(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  },

  debounce: function(wait, callback, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) callback.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) callback.apply(context, args);
    }
  },

  throttle: function(limit, callback) {
    var waiting = false;
    return function () {
      if (!waiting) {
        callback.apply(this, arguments);
        waiting = true;
        setTimeout(function () {
          waiting = false;
        }, limit);
      }
    }
  },

  prepareTransition: function(el, callback) {
    el.addEventListener('transitionend', removeClass);

    function removeClass(evt) {
      el.classList.remove('is-transitioning');
      el.removeEventListener('transitionend', removeClass);
    }

    el.classList.add('is-transitioning');
    el.offsetWidth; // check offsetWidth to force the style rendering

    if (typeof callback === 'function') {
      callback();
    }
  },

  // _.compact from lodash
  // Creates an array with all falsey values removed. The values `false`, `null`,
  // `0`, `""`, `undefined`, and `NaN` are falsey.
  // _.compact([0, 1, false, 2, '', 3]);
  // => [1, 2, 3]
  compact: function(array) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  },

  serialize: function(form) {
    var arr = [];
    Array.prototype.slice.call(form.elements).forEach(function(field) {
      if (
        !field.name ||
        field.disabled ||
        ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
      )
        return;
      if (field.type === 'select-multiple') {
        Array.prototype.slice.call(field.options).forEach(function(option) {
          if (!option.selected) return;
          arr.push(
            encodeURIComponent(field.name) +
              '=' +
              encodeURIComponent(option.value)
          );
        });
        return;
      }
      if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
        return;
      arr.push(
        encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value)
      );
    });
    return arr.join('&');
  }
};
