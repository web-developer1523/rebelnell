/*============================================================================
  VariantAvailability
  - Cross out sold out or unavailable variants
  - To disable, use the Variant Picker Block setting
  - Required markup:
    - class=variant-input-wrap to wrap select or button group
    - class=variant-input to wrap button/label
==============================================================================*/

theme.VariantAvailability = (function() {
  var classes = {
    disabled: 'disabled'
  };

  function availability(args) {
    this.type = args.type;
    this.variantsObject = args.variantsObject;
    this.currentVariantObject = args.currentVariantObject;
    this.container = args.container;
    this.namespace = args.namespace;

    this.init();
  }

  availability.prototype = Object.assign({}, availability.prototype, {
    init: function() {
      this.container.on('variantChange' + this.namespace, this.setAvailability.bind(this));

      // Set default state based on current selected variant
      this.setInitialAvailability();
    },

    // Create a list of all options. If any variant exists and is in stock with that option, it's considered available
    createAvailableOptionsTree(variants, currentlySelectedValues) {
      // Reduce variant array into option availability tree
      return variants.reduce((options, variant) => {

        // Check each option group (e.g. option1, option2, option3) of the variant
        Object.keys(options).forEach(index => {

          if (variant[index] === null) return;

          let entry = options[index].find(option => option.value === variant[index]);

          if (typeof entry === 'undefined') {
            // If option has yet to be added to the options tree, add it
            entry = {value: variant[index], soldOut: true}
            options[index].push(entry);
          }

          const currentOption1 = currentlySelectedValues.find(({value, index}) => index === 'option1')
          const currentOption2 = currentlySelectedValues.find(({value, index}) => index === 'option2')

          switch (index) {
            case 'option1':
              // Option1 inputs should always remain enabled based on all available variants
              entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
              break;
            case 'option2':
              // Option2 inputs should remain enabled based on available variants that match first option group
              if (currentOption1 && variant['option1'] === currentOption1.value) {
                entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
              }
            case 'option3':
              // Option 3 inputs should remain enabled based on available variants that match first and second option group
              if (
                currentOption1 && variant['option1'] === currentOption1.value
                && currentOption2 && variant['option2'] === currentOption2.value
              ) {
                entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
              }
          }
        })

        return options;
      }, { option1: [], option2: [], option3: []})
    },

    setInitialAvailability: function() {
      this.container.querySelectorAll('.variant-input-wrap').forEach(group => {
        this.disableVariantGroup(group);
      });

      const currentlySelectedValues = this.currentVariantObject.options.map((value,index) => {return {value, index: `option${index+1}`}})
      const initialOptions = this.createAvailableOptionsTree(this.variantsObject, currentlySelectedValues, this.currentVariantObject);

      for (var [option, values] of Object.entries(initialOptions)) {
        this.manageOptionState(option, values);
      }
    },

    setAvailability: function(evt) {

      const {value: lastSelectedValue, index: lastSelectedIndex, currentlySelectedValues, variant} = evt.detail;

      // Object to hold all options by value.
      // This will be what sets a button/dropdown as
      // sold out or unavailable (not a combo set as purchasable)
      const valuesToManage = this.createAvailableOptionsTree(this.variantsObject, currentlySelectedValues, variant, lastSelectedIndex, lastSelectedValue)

      // Loop through all option levels and send each
      // value w/ args to function that determines to show/hide/enable/disable
      for (var [option, values] of Object.entries(valuesToManage)) {
        this.manageOptionState(option, values, lastSelectedValue);
      }
    },

    manageOptionState: function(option, values) {
      var group = this.container.querySelector('.variant-input-wrap[data-index="'+ option +'"]');

      // Loop through each option value
      values.forEach(obj => {
        this.enableVariantOption(group, obj);
      });
    },

    enableVariantOption: function(group, obj) {
      // Selecting by value so escape it
      var value = obj.value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');

      if (this.type === 'dropdown') {
        if (obj.soldOut) {
          group.querySelector('option[value="'+ value +'"]').disabled = true;
        } else {
          group.querySelector('option[value="'+ value +'"]').disabled = false;
        }
      } else {
        var buttonGroup = group.querySelector('.variant-input[data-value="'+ value +'"]');
        var input = buttonGroup.querySelector('input');
        var label = buttonGroup.querySelector('label');

        // Variant exists - enable & show variant
        input.classList.remove(classes.disabled);
        label.classList.remove(classes.disabled);

        // Variant sold out - cross out option (remains selectable)
        if (obj.soldOut) {
          input.classList.add(classes.disabled);
          label.classList.add(classes.disabled);
        }
      }
    },

    disableVariantGroup: function(group) {
      if (this.type === 'dropdown') {
        group.querySelectorAll('option').forEach(option => {
          option.disabled = true;
        });
      } else {
        group.querySelectorAll('input').forEach(input => {
          input.classList.add(classes.disabled);
        });
        group.querySelectorAll('label').forEach(label => {
          label.classList.add(classes.disabled);
        });
      }
    }

  });

  return availability;
})();
