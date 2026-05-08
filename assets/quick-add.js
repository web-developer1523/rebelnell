import '@archetype-themes/scripts/config';
import Product from '@archetype-themes/scripts/modules/product';

/*============================================================================
  QuickAdd
  - Setup quick add buttons/forms on a product grid item
==============================================================================*/
class QuickAdd extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      quickAddBtn: '[data-single-variant-quick-add]',
      quickAddHolder: '[data-tool-tip-content]'
    };

    if (!theme.settings.quickAdd) {
      return;
    }

    this.container = this;
    this.init();
  }

  init() {
    // When a single variant, auto add it to cart
    const quickAddBtn = this.container.querySelector(this.selectors.quickAddBtn);
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', this.addToCart.bind(this));
    } else {
      // Listen for a tool tip quick add event
      this.addEventListener('tooltip:interact', async e => {
        if (e.detail.context === 'QuickAdd') {
          if (!this.quickAddData) {
            this.quickAddData = await this.loadQuickAddForm(e);
          }
        }
      });

      this.addEventListener('tooltip:open', async e => {
        if (e.detail.context === 'QuickAdd') {
          if (!this.quickAddData) {
            this.quickAddData = await this.loadQuickAddForm(e);
          }

          const quickAddContainer = document.querySelector(this.selectors.quickAddHolder);
          quickAddContainer.innerHTML = this.quickAddData.outerHTML;
          new Product(quickAddContainer);

          document.dispatchEvent(new CustomEvent('quickshop:opened'));

          if (Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
        }
      });
    }
  }

  addToCart(evt) {
    const btn = evt.currentTarget;
    const visibleBtn = btn.querySelector('.btn');
    const id = btn.dataset.id;
    visibleBtn.classList.add('btn--loading');

    const data = {
      'items': [{
        'id': id,
        'quantity': 1
      }]
    };

    fetch(theme.routes.cartAdd, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 422 || data.status === 'bad_request') {
        if (data.description) {
          alert(data.description);
        }
      } else {
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: data,
            addToCartBtn: btn
          }
        }));
      }

      visibleBtn.classList.remove('btn--loading');
    });
  }

  async loadQuickAddForm(evt) {
    const gridItem = evt.currentTarget.closest('.grid-product');
    const handle = gridItem.getAttribute('data-product-handle');
    const prodId = gridItem.getAttribute('data-product-id');

    let url = `${theme.routes.home}/products/${handle}?view=form`;

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/');

    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const div = doc.querySelector(`.product-section[data-product-handle="${handle}"]`);

      window.dispatchEvent(new CustomEvent(`quickadd:loaded:-${prodId}`));

      document.dispatchEvent(new CustomEvent('quickadd:loaded', {
        detail: {
          productId: prodId,
          handle: handle
        }
      }));

      return div;
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

customElements.define('quick-add', QuickAdd);
