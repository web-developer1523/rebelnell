import AOS from '@archetype-themes/scripts/helpers/init-AOS';
import '@archetype-themes/scripts/config';
import Swatches from '@archetype-themes/scripts/modules/swatches';

class ProductGridItem extends HTMLElement {
  constructor() {
    super();

    this.swatches = new Swatches(this);

    document.dispatchEvent(new CustomEvent('product-grid-item:loaded'));

    AOS.refreshHard();

    // Refresh reviews app
    if (window.SPR) {
      SPR.initDomEls();
      SPR.loadBadges();
    }
  }
}

customElements.define('product-grid-item', ProductGridItem);
