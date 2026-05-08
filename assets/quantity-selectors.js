import '@archetype-themes/scripts/config';

theme.QtySelector = (function() {
  var selectors = {
    input: '.js-qty__num',
    plus: '.js-qty__adjust--plus',
    minus: '.js-qty__adjust--minus'
  };

  function QtySelector(el, options) {
    this.wrapper = el;
    this.plus = el.querySelector(selectors.plus);
    this.minus = el.querySelector(selectors.minus);
    this.input = el.querySelector(selectors.input);
    this.minValue = this.input.getAttribute('min') || 1;

    var defaults = {
      namespace: null,
      isCart: false,
      key: this.input.dataset.id
    };

    this.options = Object.assign({}, defaults, options);

    this.init();
  }

  QtySelector.prototype = Object.assign({}, QtySelector.prototype, {
    init: function() {
      this.plus.addEventListener('click', function() {
        var qty = this._getQty();
        this._change(qty + 1);
      }.bind(this));

      this.minus.addEventListener('click', function() {
        var qty = this._getQty();
        this._change(qty - 1);
      }.bind(this));

      this.input.addEventListener('change', function(evt) {
        this._change(this._getQty());
      }.bind(this));
    },

    _getQty: function() {
      var qty = this.input.value;
      if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
        // We have a valid number!
      } else {
        // Not a number. Default to 1.
        qty = 1;
      }
      return parseInt(qty);
    },

    _change: function(qty) {
      if (qty <= this.minValue) {
        qty = this.minValue;
      }

      this.input.value = qty;

      if (this.options.isCart) {
        document.dispatchEvent(new CustomEvent('cart:quantity' + this.options.namespace, {
            detail: [this.options.key, qty, this.wrapper]
        }));
      }
    }
  });

  return QtySelector;
})();
