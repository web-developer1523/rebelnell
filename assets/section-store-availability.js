// This is the javascript entrypoint for the store-availability section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/modules/modal';
import '@archetype-themes/scripts/modules/drawers';
import 'components/tool-tip-trigger';
import 'components/tool-tip';

class StoreAvailability {
  constructor(container) {
    this.selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      modalOpenBtn: '.js-modal-open-availability',
      productTitle: '[data-availability-product-title]'
    };

    this.container = container;
    this.baseUrl = this.container.dataset.baseUrl;
    this.productTitle = this.container.dataset.productName;

    document.dispatchEvent(new CustomEvent('store-availability:loaded'));
  }

  updateContent(variantId) {
    const variantSectionUrl = `${this.baseUrl}/variants/${variantId}/?section_id=store-availability`;

    fetch(variantSectionUrl)
      .then(response => {
        return response.text();
      })
      .then(html => {
        if (html.trim() === '') {
          this.container.innerHTML = '';
          return;
        }

        this.container.innerHTML = html;
        this.container.innerHTML = this.container.firstElementChild.innerHTML;

        // Setup drawer if have open button
        if (this.container.querySelector(this.selectors.drawerOpenBtn)) {
          this.drawer = new theme.Drawers('StoreAvailabilityDrawer', 'availability');
        }

        // Setup modal if have open button
        if (this.container.querySelector(this.selectors.modalOpenBtn)) {
          this.modal = new theme.Modals('StoreAvailabilityModal', 'availability');
        }

        const title = this.container.querySelector(this.selectors.productTitle);
        if (title) {
          title.textContent = this.productTitle;
        }
      });
  }
}

export { StoreAvailability };
