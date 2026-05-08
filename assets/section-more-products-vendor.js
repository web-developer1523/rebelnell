// This is the javascript entrypoint for the more-products-vendor section.
// This file and all its inclusions will be processed through esbuild

import AOS from '@archetype-themes/scripts/helpers/init-AOS';
import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/helpers/init-observer';

class VendorProducts extends HTMLElement {
  constructor() {
    super();
    this.container = this;
    this.sectionId = this.container.getAttribute('data-section-id');
    this.currentProduct = this.container.getAttribute('data-product-id');
    this.maxProducts = parseInt(this.container.getAttribute('data-max-products'), 10);

    theme.initWhenVisible({
      element: this.container,
      callback: this.init.bind(this),
      threshold: 600
    });

    document.dispatchEvent(new CustomEvent('more-products-vendor:loaded', {
      detail: {
        sectionId: this.sectionId
      }
    }));
  }

  init() {
    this.outputContainer = this.container.querySelector(`#VendorProducts-${this.sectionId}`);
    this.vendor = this.container.getAttribute('data-vendor');
    let url = `${theme.routes.collections}/vendors?view=vendor-ajax&q=${this.vendor}`;

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/');

    fetch(url)
      .then(response => response.text())
      .then(text => {
        let count = 0;
        const products = [];
        const modals = [];
        const html = document.createElement('div');

        html.innerHTML = text;

        const allProds = html.querySelectorAll('.grid-product');

      // Do not add current product to output
        allProds.forEach(el => {
          const id = el.dataset.productId;

          if (count === this.maxProducts) return;

          if (id === this.currentProduct) return;

          const modal = html.querySelector('.modal[data-product-id="'+ id +'"]');
          if (modal) {
            modals.push(modal);
          }

          count++;
          // Add the product's island to the products array
          products.push(el.parentElement);
        });

        this.outputContainer.innerHTML = '';

        if (products.length === 0) {
          this.container.classList.add('hide');
        } else {
          this.outputContainer.classList.remove('hide');
          this.outputContainer.append(...products);

          if (modals.length) {
            this.outputContainer.append(...modals);
          }

          AOS.refreshHard();
        }
      }).catch(e => {
        console.error(e);
      });
  }
}

customElements.define('vendor-products', VendorProducts);
