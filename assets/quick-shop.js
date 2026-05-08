import '@archetype-themes/scripts/config';
import Product from '@archetype-themes/scripts/modules/product';
import '@archetype-themes/scripts/modules/collapsibles';

/*============================================================================
  QuickShop
  - Setup quick shop modals anywhere a product grid item exists
  - Duplicate product modals will be condensed down to one workable one
==============================================================================*/

class QuickShop extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      quickShopContainer: '[data-tool-tip-content]',
      blocksHolder: '[data-blocks-holder]',
      blocks: '[data-product-blocks]',
      form: '.product-single__form',
    };

    if (!theme.settings.quickView) {
      return;
    }

     // No quick view on mobile breakpoint
    if (theme.config.bpSmall) {
      return;
    }

    this.container = this;

    this.addEventListener('tooltip:interact', async e => {
      if (e.detail.context === 'QuickShop') {
        if (!this.quickShopData) {
          this.quickShopData = await this.loadQuickShopData(e);
        }
      }
    });

    this.addEventListener('tooltip:open', async e => {
      if (e.detail.context === 'QuickShop') {
        if (!this.quickShopData) {
          this.quickShopData = await this.loadQuickShopData(e);
        }

        const quickShopContainer = document.querySelector(this.selectors.quickShopContainer);
        const clonedQuickShopData = this.quickShopData.cloneNode(true);
        quickShopContainer.innerHTML = '';
        quickShopContainer.appendChild(clonedQuickShopData);
        this.product = new Product(quickShopContainer);
        this.product.init();

        this.dispatchEvent(new CustomEvent('quickshop:opened', {
          bubbles: true,
        }));

        if (Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }

        // Re-hook up collapsible box triggers
        theme.collapsibles.init();
      }
    });

    // Set up product blocks content inside modal
    this.addEventListener('quickshop:opened', async () => {
      const quickShopContainer = document.querySelector(this.selectors.quickShopContainer);
      this.blocksHolder = quickShopContainer.querySelector(this.selectors.blocksHolder);
      this.blocksData = await this.loadBlocksData(this.blocksHolder.dataset.url);

      const clonedBlocksData = this.blocksData.cloneNode(true);
      this.blocksHolder.innerHTML = '';
      this.blocksHolder.appendChild(clonedBlocksData);
      this.blocksHolder.classList.add('product-form-holder--loaded');

      this.product.cacheElements();

      this.product.formSetup();
      this.product.updateModalProductInventory();

      if (Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }

      // Re-hook up collapsible box triggers
      theme.collapsibles.init(quickShopContainer);
    });
  }

  async loadBlocksData(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('template');
      tempDiv.innerHTML = text;

      const content = tempDiv.content;
      const blocks = content.querySelector(this.selectors.blocks);

      if (blocks) {

        // Because the same product could be opened in quick view
        // on the page we load the form elements from, we need to
        // update any `id`, `for`, and `form` attributes
        blocks.querySelectorAll('[id]').forEach(el => {
          // Update input `id`
          const val = el.getAttribute('id');
          el.setAttribute('id', val + '-modal');

          // Update related label if it exists
          const label = blocks.querySelector(`[for="${val}"]`);
          if (label) {
            label.setAttribute('for', val + '-modal');
          }

          // Update any collapsible elements
          const collapsibleTrigger = blocks.querySelector(`[aria-controls="${val}"]`);
          if (collapsibleTrigger) {
            collapsibleTrigger.setAttribute('aria-controls', val + '-modal');
          }
        });

        // Update any elements with `form` attribute.
        // Form element already has `-modal` appended
        const form = blocks.querySelector(this.selectors.form);
        if (form) {
          var formId = form.getAttribute('id');
          blocks.querySelectorAll('[form]').forEach(el => {
            el.setAttribute('form', formId);
          });
        }

        fragment.appendChild(blocks.cloneNode(true));
      }

      this.dispatchEvent(new CustomEvent('quickshop:product-blocks-loaded', {
        bubbles: true,
      }));

      return fragment;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async loadQuickShopData(evt) {
    const gridItem = evt.currentTarget.closest('.grid-product');
    this.handle = gridItem.getAttribute('data-product-handle');
    const prodId = gridItem.getAttribute('data-product-id');

    if (!gridItem || !this.handle || !prodId) return;

    let url = `${theme.routes.home}/products/${this.handle}/?view=modal`;

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/');

    try {
      const response = await fetch(url);
      const text = await response.text();
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('template');
      tempDiv.innerHTML = text;

      const content = tempDiv.content;
      const div = content.querySelector(`.product-section[data-product-handle="${this.handle}"]`);

      if (div) {
        div.dataset.modal = true;
        fragment.appendChild(div.cloneNode(true));
      }

      window.dispatchEvent(new CustomEvent(`quickshop:loaded-${prodId}`));

      document.dispatchEvent(new CustomEvent('quickshop:loaded', {
        detail: {
          productId: prodId,
          handle: this.handle
        }
      }));

      return fragment;
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

customElements.define('quick-shop', QuickShop);
