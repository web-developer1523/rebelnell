// This is the javascript entrypoint for the gift-card-recipient-form snippet.
// This file and all its inclusions will be processed through postcss

class RecipientForm extends HTMLElement {
  constructor() {
    super();
    this.checkboxInput = this.querySelector(`#Recipient-Checkbox-${ this.dataset.sectionId }`);
    this.emailInput = this.querySelector(`#Recipient-email-${ this.dataset.sectionId }`);
    this.nameInput = this.querySelector(`#Recipient-name-${ this.dataset.sectionId }`);
    this.messageInput = this.querySelector(`#Recipient-message-${ this.dataset.sectionId }`);
    this.addEventListener('change', () => this.onChange());
    this.recipientFields = this.querySelector('.recipient-fields');

    this.checkboxInput.addEventListener('change', () => {
      this.recipientFields.style.display = this.checkboxInput.checked ? 'block' : 'none';
    });
  }

  connectedCallback() {
    document.addEventListener('ajaxProduct:error', (event) => {
      const productVariantID = event.target.querySelector('[name="id"]').value;
      if (productVariantID === this.dataset.productVariantId) {
        this.displayErrorMessage(event.detail.errorMessage);
      }
    });

    document.addEventListener('ajaxProduct:added', (event) => {
      const productVariantID = event.target.querySelector('[name="id"]').value;
      if (productVariantID === this.dataset.productVariantId) {
        this.clearInputFields();
        this.clearErrorMessage();
      }
    });
  }

  onChange() {
    if (!this.checkboxInput.checked) {
      this.clearInputFields();
      this.clearErrorMessage();
    }
  }

  clearInputFields() {
    this.querySelectorAll('.field__input').forEach(el => el.value = '');
  }

  displayErrorMessage(body) {
    this.clearErrorMessage();
    if (body) {
      return Object.entries(body).forEach(([key, value]) => {
        const inputElement = this[`${key}Input`];
        if (!inputElement) return;

        inputElement.setAttribute('aria-invalid', true);
        inputElement.classList.add('field__input--error');
      });
    }
  }

  clearErrorMessage() {
    this.querySelectorAll('.field__input').forEach(inputElement => {
      inputElement.setAttribute('aria-invalid', false);
      inputElement.removeAttribute('aria-describedby');
      inputElement.classList.remove('field__input--error');
    });
  }
};

customElements.define('recipient-form', RecipientForm);
