// This is the javascript entrypoint for the background-image-text section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/helpers/init-observer';
import '@archetype-themes/scripts/modules/parallax';
import '@archetype-themes/scripts/helpers/sections';

class BackgroundImage extends HTMLElement {
  constructor () {
    super()
    this.el = this.querySelector('[data-section-type="background-image"]')
    this.sectionId = this.el.dataset.sectionId

    theme.initWhenVisible({
      element: this.el,
      callback: this.init.bind(this)
    })
  }

  init () {
    this.el.classList.remove('loading', 'loading--delayed')
    this.el.classList.add('loaded')
  }
}

customElements.define('background-image', BackgroundImage)
