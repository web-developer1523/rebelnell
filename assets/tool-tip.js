import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/helpers/a11y';
import '@archetype-themes/scripts/helpers/delegate';

/*============================================================================
  ToolTip
==============================================================================*/

class ToolTip extends HTMLElement {
  constructor() {
    super();
    this.el = this;
    this.inner = this.querySelector('[data-tool-tip-inner]');
    this.closeButton = this.querySelector('[data-tool-tip-close]');
    this.toolTipContent = this.querySelector('[data-tool-tip-content]');
    this.toolTipTitle = this.querySelector('[data-tool-tip-title]');

    document.addEventListener('tooltip:open', e => {
      this._open(e.detail.context, e.detail.content);

      if (e.detail.tool_tip_classes) {
        this.el.classList.add(...e.detail.tool_tip_classes.split(' '));

        this.addEventListener('tooltip:close', () => {
          this.el.classList.remove(...e.detail.tool_tip_classes.split(' '));
        });
      }
    });

    // Close if a drawer is opened
    document.addEventListener('drawerOpen', () => this._close());

    document.addEventListener('quickshop:product-blocks-loaded', () => {
      this._lockScrolling();
    });
  }

  _open(context, insertedHTML) {
    // Ensure we set a title for product availability
    if (this.toolTipTitle && context != 'store-availability') {
      this.toolTipTitle.style.display = 'none';
    } else {
      this.toolTipTitle.style.display = 'block';
    }

    if (context == 'store-availability') {
      this.toolTipContent.innerHTML = insertedHTML;
    }

    // Set a timeout to ensure the tooltip content loads before locking scrolling / trapping focus
    setTimeout(() => {
      this._lockScrolling();
    }, 100);

    if (this.closeButton) {
      this.closeButton.on('click' + '.tooltip-close', () => {
        this._close();
      });
    }

    document.documentElement.on('click' + '.tooltip-outerclick', event => {
      if (this.el.dataset.toolTipOpen === 'true' && !this.inner.contains(event.target)) this._close();
    });

    document.documentElement.on('keydown' + '.tooltip-esc', event => {
      if (event.code === 'Escape') this._close();
    });

    this.el.dataset.toolTipOpen = true;
    this.el.dataset.toolTip = context;
  }

  _close() {
    if (document.body.classList.contains('photoswipe-open')) return;

    this.dispatchEvent(new CustomEvent('tooltip:close', {
      detail: {
        context: this.el.dataset.toolTip
      },
      bubbles: true,
    }));

    this.el.dataset.toolTipOpen = 'false';

    this._unlockScrolling();

    this.closeButton.off('click' + '.tooltip-close');
    document.documentElement.off('click' + '.tooltip-outerclick');
    document.documentElement.off('keydown' + '.tooltip-esc');
  }

  _lockScrolling() {
    theme.a11y.removeTrapFocus({
      container: this.el,
      namespace: 'tooltip_focus'
    });

    theme.a11y.lockMobileScrolling();
    document.documentElement.classList.add('modal-open');

    setTimeout(() => {
      theme.a11y.trapFocus({
        container: this.el,
        namespace: 'tooltip_focus'
      });
    }, 100);
  }

  _unlockScrolling() {
    theme.a11y.removeTrapFocus({
      container: this.el,
      namespace: 'tooltip_focus'
    });

    setTimeout(() => {
      theme.a11y.unlockMobileScrolling();
      document.documentElement.classList.remove('modal-open');
    }, 100);
  }
}

customElements.define('tool-tip', ToolTip);
