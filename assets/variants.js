import '@archetype-themes/scripts/helpers/utils';

/*
  Options:
    container
    enableHistoryState - enable when on single product page to update URL
    singleOptionSelector - selector for individual variant option (e.g. 'Blue' or 'Small')
    originalSelectorId - selector for base variant selector (visually hidden)
    variants - JSON parsed object of product variant info
 */
    theme.Variants = (function() {

      function Variants(options) {
        this.container = options.container;
        this.variants = options.variants;
        this.singleOptionSelector = options.singleOptionSelector;
        this.originalSelectorId = options.originalSelectorId;
        this.enableHistoryState = options.enableHistoryState;
        this.dynamicVariantsEnabled = options.dynamicVariantsEnabled;
        this.currentlySelectedValues = this._getCurrentOptions();
        this.currentVariant = this._getVariantFromOptions();

        this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
          el.addEventListener('change', this._onSelectChange.bind(this));
        });
      }

      Variants.prototype = Object.assign({}, Variants.prototype, {

        _getCurrentOptions: function() {
          var result = [];

          this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
            var type = el.getAttribute('type');

            if (type === 'radio' || type === 'checkbox') {
              if (el.checked) {
                result.push({
                  value: el.value,
                  index: el.dataset.index
                });
              }
            } else {
              result.push({
                value: el.value,
                index: el.dataset.index
              });
            }
          });

          // remove any unchecked input values if using radio buttons or checkboxes
          result = theme.utils.compact(result);

          return result;
        },

        // Pull the number out of the option index name, e.g. 'option1' -> 1
        _numberFromOptionKey: function(key) {
          return parseInt(key.substr(-1));
        },

        // Options should be ordered from highest to lowest priority. Make sure that priority
        // is represented using weighted values when finding best match
        _getWeightedOptionMatchCount: function(variant) {
          return this._getCurrentOptions().reduce((count, {value, index}) => {
            const optionIndex = this._numberFromOptionKey(index);
            const weightedCount = 4 - optionIndex; // The lower the index, the better the match we have
            return variant[index] === value ? count + weightedCount : count;
          },0)
        },

        _getFullMatch(needsToBeAvailable) {
          const currentlySelectedOptions = this._getCurrentOptions();
          const variants = this.variants;

          return variants.find(variant => {
            const isMatch = currentlySelectedOptions.every(({value, index}) => {
              return variant[index] === value;
            });

            if (needsToBeAvailable) {
              return isMatch && variant.available;
            } else {
              return isMatch;
            }
          });
        },

        // Find a variant that is available and best matches last selected option
        _getClosestAvailableMatch: function(lastSelectedOption) {
          if (!lastSelectedOption) return null;

          const currentlySelectedOptions = this._getCurrentOptions();
          const variants = this.variants;

          const potentialAvailableMatches = lastSelectedOption && variants.filter(variant => {
            return currentlySelectedOptions
              .filter(
                // Only match based selected options that are equal and preceeding the last selected option
                ({value, index}) => this._numberFromOptionKey(index) <= this._numberFromOptionKey(lastSelectedOption.index)
              ).every(({value, index}) => {
                // Variant needs to have options that match the current and preceeding selection options
                return variant[index] === value;
              }) && variant.available
          });

          return potentialAvailableMatches.reduce((bestMatch, variant) => {
            // If this is the first potential match we've found, store it as the best match
            if (bestMatch === null) return variant;

            // If this is not the first potential match, compare the number of options our current best match has in common
            // compared to the next contender.
            const bestMatchCount = this._getWeightedOptionMatchCount(bestMatch, lastSelectedOption);
            const newCount = this._getWeightedOptionMatchCount(variant, lastSelectedOption);

            return newCount > bestMatchCount ? variant : bestMatch;
          }, null);
        },

        _getVariantFromOptions: function(lastSelectedOption) {
          const availableFullMatch = this._getFullMatch(true);
          const closestAvailableMatch = this._getClosestAvailableMatch(lastSelectedOption);
          const fullMatch = this._getFullMatch(false);

          if (this.dynamicVariantsEnabled) {
            // Add some additional smarts to variant matching if Dynamic Variants are enabled
            return availableFullMatch || closestAvailableMatch || fullMatch || null;
          } else {
            // Only return a full match or null (variant doesn't exist) if Dynamic Variants are disabled
            return fullMatch || null;
          }

        },

        _updateInputState: function (variant, el) {
          return (input) => {
            if (variant === null) return;

            const index = input.dataset.index;
            const value = input.value;
            const type = input.getAttribute('type');

            if (type === 'radio' || type === 'checkbox') {
              input.checked = variant[index] === value
            } else {
              input.value = variant[index];
            }
          }
        },

        _onSelectChange: function({srcElement}) {
          const optionSelectElements = this.container.querySelectorAll(this.singleOptionSelector);

          // Get the best variant based on the current selection + last selected element
          const variant = this._getVariantFromOptions({
            index: srcElement.dataset.index,
            value: srcElement.value
          });

          // Update DOM option input states based on the variant that was found
          optionSelectElements.forEach(this._updateInputState(variant, srcElement))

          // Make sure our currently selected values are up to date after updating state of DOM
          const currentlySelectedValues = this.currentlySelectedValues = this._getCurrentOptions();

          const detail = {
            variant,
            currentlySelectedValues,
            value: srcElement.value,
            index: srcElement.parentElement.dataset.index
          }

          this.container.dispatchEvent(new CustomEvent('variantChange', {detail}));
          document.dispatchEvent(new CustomEvent('variant:change', {detail}));

          if (!variant) {
            return;
          }

          this._updateMasterSelect(variant);
          this._updateImages(variant);
          this._updatePrice(variant);
          this._updateUnitPrice(variant);
          this._updateSKU(variant);
          this.currentVariant = variant;

          if (this.enableHistoryState) {
            this._updateHistoryState(variant);
          }
        },

        _updateImages: function(variant) {
          var variantImage = variant.featured_image || {};
          var currentVariantImage = this.currentVariant && this.currentVariant.featured_image || {};

          if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
            return;
          }

          this.container.dispatchEvent(new CustomEvent('variantImageChange', {
            detail: {
              variant: variant
            }
          }));
        },

        _updatePrice: function(variant) {
          if (this.currentVariant && variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
            return;
          }

          this.container.dispatchEvent(new CustomEvent('variantPriceChange', {
            detail: {
              variant: variant
            }
          }));
        },

        _updateUnitPrice: function(variant) {
          if (this.currentVariant && variant.unit_price === this.currentVariant.unit_price) {
            return;
          }

          this.container.dispatchEvent(new CustomEvent('variantUnitPriceChange', {
            detail: {
              variant: variant
            }
          }));
        },

        _updateSKU: function(variant) {
          if (this.currentVariant && variant.sku === this.currentVariant.sku) {
            return;
          }

          this.container.dispatchEvent(new CustomEvent('variantSKUChange', {
            detail: {
              variant: variant
            }
          }));
        },

        _updateHistoryState: function(variant) {
          if (!history.replaceState || !variant) {
            return;
          }

          var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
          window.history.replaceState({path: newurl}, '', newurl);
        },

        _updateMasterSelect: function(variant) {
          let masterSelect = this.container.querySelector(this.originalSelectorId);
          if (!masterSelect) return;

          masterSelect.value = variant.id;
          // Force a change event so Shop Pay installments works after a variant is changed
          masterSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      return Variants;
    })();
