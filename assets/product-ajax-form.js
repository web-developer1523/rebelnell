import '@archetype-themes/scripts/helpers/utils'

theme.AjaxProduct = (function() {
  var status = {
    loading: false
  };

  function ProductForm(form, submit, args) {
    this.form = form;
    this.args = args;

    var submitSelector = submit ? submit : '.add-to-cart';

    if (this.form) {
      this.addToCart = form.querySelector(submitSelector);
      this.form.addEventListener('submit', this.addItemFromForm.bind(this));
    }
  };

  ProductForm.prototype = Object.assign({}, ProductForm.prototype, {
    addItemFromForm: function(evt, callback){
      evt.preventDefault();

      if (status.loading) {
        return;
      }

      // Loading indicator on add to cart button
      this.addToCart.classList.add('btn--loading');

      status.loading = true;

      var data = theme.utils.serialize(this.form);

      fetch(theme.routes.cartAdd, {
        method: 'POST',
        body: data,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json())
      .then(function(data) {
        if (data.status === 422) {
          this.error(data);
        } else {
          var product = data;
          this.success(product);
        }

        status.loading = false;
        this.addToCart.classList.remove('btn--loading');

        // Reload page if adding product from a section on the cart page
        if (document.body.classList.contains('template-cart')) {
          window.scrollTo(0, 0);
          location.reload();
        }
      }.bind(this));
    },

    success: function(product) {
      var errors = this.form.querySelector('.errors');
      if (errors) {
        errors.remove();
      }

      this.form.dispatchEvent(new CustomEvent('ajaxProduct:added', {
        detail: {
          product: product,
          addToCartBtn: this.addToCart
        },
        bubbles: true
      }));

      if (this.args && this.args.scopedEventId) {
        document.dispatchEvent(new CustomEvent('ajaxProduct:added:' + this.args.scopedEventId, {
          detail: {
            product: product,
            addToCartBtn: this.addToCart
          }
        }));
      }
    },

    error: function(error) {
      if (!error.description) {
        console.warn(error);
        return;
      }

      var errors = this.form.querySelector('.errors');
      if (errors) {
        errors.remove();
      }

      var errorDiv = document.createElement('div');
      errorDiv.classList.add('errors', 'text-center');

      if (typeof error.description === 'object') {
        errorDiv.textContent = error.message;
      } else {
        errorDiv.textContent = error.description;
      }

      this.form.append(errorDiv);

      this.form.dispatchEvent(new CustomEvent('ajaxProduct:error', {
        detail: {
          errorMessage: error.description
        },
        bubbles: true
      }));

      if (this.args && this.args.scopedEventId) {
        document.dispatchEvent(new CustomEvent('ajaxProduct:error:' + this.args.scopedEventId, {
          detail: {
            errorMessage: error.description
          }
        }));
      }
    }
  });

  return ProductForm;
})();
