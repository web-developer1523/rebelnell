import '@archetype-themes/scripts/modules/photoswipe'

class ProductImages extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.closest('[data-section-id]').dataset.sectionId;
    this.initImageZoom();
  }

  initImageZoom() {
    this.photoswipe = new theme.Photoswipe(this, this.sectionId);
  }
}

customElements.define('product-images', ProductImages);
