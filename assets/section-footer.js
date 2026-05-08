// This is the javascript entrypoint for the footer section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/modules/disclosure';

class FooterSection extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      locale: '[data-disclosure-locale]',
      currency: '[data-disclosure-currency]'
    };

    this.container = this;
    this.localeDisclosure = null;
    this.currencyDisclosure = null;

    document.dispatchEvent(new CustomEvent('footer-section:loaded', {
      detail: {
        sectionId: this.sectionId
      }
    }));

    this.init();
  }

  disconnectedCallback() {
    this.onUnload();
  }

  init() {
    const localeEl = this.container.querySelector(this.selectors.locale);
    const currencyEl = this.container.querySelector(this.selectors.currency);

    if (localeEl) {
      this.localeDisclosure = new theme.Disclosure(localeEl);
    }

    if (currencyEl) {
      this.currencyDisclosure = new theme.Disclosure(currencyEl);
    }

    // Change email icon to submit text
    const newsletterInput = document.querySelector('.footer__newsletter-input');
    if (newsletterInput) {
      newsletterInput.addEventListener('keyup', function() {
        newsletterInput.classList.add('footer__newsletter-input--active');
      });
    }

    // Re-hook up collapsible box triggers
    theme.collapsibles.init(this.container);
  }

  onUnload() {
    if (this.localeDisclosure) {
      this.localeDisclosure.destroy();
    }

    if (this.currencyDisclosure) {
      this.currencyDisclosure.destroy();
    }
  }
}

customElements.define('footer-section', FooterSection)
