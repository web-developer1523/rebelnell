import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/currency'
import '@archetype-themes/scripts/helpers/images'
import '@archetype-themes/scripts/helpers/variants'
import '@archetype-themes/scripts/modules/variant-availability'
import '@archetype-themes/scripts/modules/quantity-selectors'
import '@archetype-themes/scripts/modules/product-ajax-form'
import '@archetype-themes/scripts/helpers/youtube'
import '@archetype-themes/scripts/helpers/vimeo'
import { Slideshow } from '@archetype-themes/scripts/modules/slideshow'
import '@archetype-themes/scripts/modules/product-media'
import { StoreAvailability } from 'components/section-store-availability'
import { RecentlyViewed } from 'components/section-recently-viewed'

export default class Product extends HTMLElement {
  constructor (container) {
    super();

    this.container = container ?? this;

    if (!!this.container.dataset.modal) {
      this.init();
    }
  }

  init () {

    this.videoObjects = {}

    this.classes = {
      onSale: 'on-sale',
      disabled: 'disabled',
      loading: 'loading',
      loaded: 'loaded',
      hidden: 'hide',
      interactable: 'video-interactable',
      visuallyHide: 'visually-invisible',
      lowInventory: 'inventory--low',
    }

    this.selectors = {
      productVideo: '.product__video',
      videoParent: '.product__video-wrapper',
      slide: '.product-main-slide',
      currentSlide: '.is-selected',
      startingSlide: '.starting-slide',
      variantType: '.variant-wrapper',
      blocks: '[data-product-blocks]',
      blocksHolder: '[data-blocks-holder]',
      dynamicVariantsEnabled: '[data-dynamic-variants-enabled]',

      variantsJson: '[data-variant-json]',
      currentVariantJson: '[data-current-variant-json]',
      form: '.product-single__form',

      media: '[data-product-media-type-model]',
      closeMedia: '.product-single__close-media',
      photoThumbs: '[data-product-thumb]',
      thumbSlider: '[data-product-thumbs]',
      thumbScroller: '.product__thumbs--scroller',
      mainSlider: '[data-product-photos]',
      imageContainer: '[data-product-images]',
      productImageMain: '[data-product-image-main]',

      priceWrapper: '[data-product-price-wrap]',
      price: '[data-product-price]',
      comparePrice: '[data-compare-price]',
      savePrice: '[data-save-price]',
      priceA11y: '[data-a11y-price]',
      comparePriceA11y: '[data-compare-price-a11y]',
      unitWrapper: '[data-unit-price-wrapper]',
      unitPrice: '[data-unit-price]',
      unitPriceBaseUnit: '[data-unit-base]',
      sku: '[data-sku]',
      inventory: '[data-product-inventory]',
      incomingInventory: '[data-incoming-inventory]',
      colorLabel: '[data-variant-color-label]',
      variantLabel: '.variant-input .variant__button-label',

      addToCart: '[data-add-to-cart]',
      addToCartText: '[data-add-to-cart-text]',

      originalSelectorId: '[data-product-select]',
      singleOptionSelector: '[data-variant-input]',
      variantColorSwatch: '.variant__input--color-swatch',

      availabilityContainer: '[data-store-availability-holder]',
    }

    this.sectionId = this.container.getAttribute('data-section-id')
    this.productId = this.container.getAttribute('data-product-id')

    document.dispatchEvent(new CustomEvent('product-component:loaded', {
      detail: {
        sectionId: this.sectionId
      }
    }))

    document.addEventListener('shopify:section:unload', this.onUnload)

    this.settings = {
      enableHistoryState: (this.container.dataset.history === 'true') || false,
      namespace: `.product-${this.sectionId}`,
      inventory: false,
      inventoryThreshold: 10,
      modalInit: false,
      hasImages: true,
      imageSetName: null,
      imageSetIndex: null,
      currentImageSet: null,
      imageSize: '620x',
      currentSlideIndex: 0,
      videoLooping: this.container.dataset.videoLooping
    }

    this.cacheElements()

    this.firstProductImage = this.cache.mainSlider.querySelector('img')

    if (!this.firstProductImage) {
      this.settings.hasImages = false
    }

    const dataSetEl = this.cache.mainSlider.querySelector('[data-set-name]')
    if (dataSetEl) {
      this.settings.imageSetName = dataSetEl.dataset.setName
    }

    this.formSetup()
    this.updateModalProductInventory()
    this.productSetup()
    this.videoSetup()
    this.initProductSlider()
    this.customMediaListeners()
    RecentlyViewed.addIdToRecentlyViewed(this.productId)

    document.addEventListener('tooltip:close', e => {
      if (e.detail.context === 'QuickShop') {
        this.stopVideos();
      }
    })

    // Quick add hook
    window.off('quickadd:loaded:' + this.sectionId)
  }

  cacheElements () {
    this.cache = {
      form: this.container.querySelector(this.selectors.form),
      mainSlider: this.container.querySelector(this.selectors.mainSlider),
      thumbSlider: this.container.querySelector(this.selectors.thumbSlider),
      thumbScroller: this.container.querySelector(this.selectors.thumbScroller),
      productImageMain: this.container.querySelector(this.selectors.productImageMain),

      // Price-related
      priceWrapper: this.container.querySelector(this.selectors.priceWrapper),
      comparePriceA11y: this.container.querySelector(this.selectors.comparePriceA11y),
      comparePrice: this.container.querySelector(this.selectors.comparePrice),
      price: this.container.querySelector(this.selectors.price),
      savePrice: this.container.querySelector(this.selectors.savePrice),
      priceA11y: this.container.querySelector(this.selectors.priceA11y)
    }
  }

  formSetup () {
    this.initQtySelector()
    this.initAjaxProductForm()
    this.availabilitySetup()
    this.initVariants()

    // We know the current variant now so setup image sets
    if (this.settings.imageSetName) {
      this.updateImageSet()
    }
  }

  availabilitySetup () {
    const container = this.container.querySelector(this.selectors.availabilityContainer)
    if (container) {
      this.storeAvailability = new StoreAvailability(container)
    }
  }

  productSetup () {
    this.initImageZoom()
    this.initModelViewerLibraries()
    this.initShopifyXrLaunch()

    if (window.SPR) {
      SPR.initDomEls()
      SPR.loadBadges()
    }
  }

  initVariants () {
    const variantJson = this.container.querySelector(this.selectors.variantsJson)

    if (!variantJson) {
      return
    }

    this.variantsObject = JSON.parse(variantJson.innerHTML)
    const dynamicVariantsEnabled = !!this.container.querySelector(this.selectors.dynamicVariantsEnabled)

    const options = {
      container: this.container,
      enableHistoryState: this.settings.enableHistoryState,
      singleOptionSelector: this.selectors.singleOptionSelector,
      originalSelectorId: this.selectors.originalSelectorId,
      variants: this.variantsObject,
      dynamicVariantsEnabled
    }

    const swatches = this.container.querySelectorAll(this.selectors.variantColorSwatch)
    if (swatches.length) {
      swatches.forEach(swatch => {
        swatch.addEventListener('change', function (evt) {
          const color = swatch.dataset.colorName
          const index = swatch.dataset.colorIndex
          this.updateColorName(color, index)
        }.bind(this))
      })
    }

    const labels = this.container.querySelectorAll(this.selectors.variantLabel)
    if (labels.length) {
      labels.forEach(label => {
        // on pressing enter on label, update color name
        label.addEventListener('keydown', function (evt) {
          if (evt.keyCode === 13) {
            //get input based off of for attribute
            const input = document.querySelector(`#${label.getAttribute('for')}`);

            if (!input) return;
            input.checked = true;
            input.dispatchEvent(new Event('change'));
          }
        }.bind(this));
      })
    }

    this.variants = new theme.Variants(options)

    // Product availability on page load
    if (this.storeAvailability) {
      const variant_id = this.variants.currentVariant ? this.variants.currentVariant.id : this.variants.variants[0].id

      this.storeAvailability.updateContent(variant_id)
      this.container.on('variantChange' + this.settings.namespace, this.updateAvailability.bind(this))
    }

    this.container.on('variantChange' + this.settings.namespace, this.updateCartButton.bind(this))
    this.container.on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this))
    this.container.on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this))
    this.container.on('variantUnitPriceChange' + this.settings.namespace, this.updateUnitPrice.bind(this))

    if (this.container.querySelectorAll(this.selectors.sku).length) {
      this.container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this))
    }

    const inventoryEl = this.container.querySelector(this.selectors.inventory)
    if (inventoryEl) {
      this.settings.inventory = true
      this.settings.inventoryThreshold = inventoryEl.dataset.threshold

      // Update inventory on page load
      this.updateInventory({ detail: { variant: this.variants.currentVariant } })

      this.container.on('variantChange' + this.settings.namespace, this.updateInventory.bind(this))
    }

    // Update individual variant availability on each selection
    if (dynamicVariantsEnabled) {
      const currentVariantJson = this.container.querySelector(this.selectors.currentVariantJson)

      if (currentVariantJson) {
        const variantType = this.container.querySelector(this.selectors.variantType)

        if (variantType) {
          new theme.VariantAvailability({
            container: this.container,
            namespace: this.settings.namespace,
            type: variantType.dataset.type,
            variantsObject: this.variantsObject,
            currentVariantObject: JSON.parse(currentVariantJson.innerHTML)
          })
        }
      }
    }

    // image set names variant change listeners
    if (this.settings.imageSetName) {
      const variantWrapper = this.container.querySelector('.variant-input-wrap[data-handle="' + this.settings.imageSetName + '"]')
      if (variantWrapper) {
        this.settings.imageSetIndex = variantWrapper.dataset.index
        this.container.on('variantChange' + this.settings.namespace, this.updateImageSet.bind(this))
      } else {
        this.settings.imageSetName = null
      }
    }
  }

  initQtySelector () {
    this.container.querySelectorAll('.js-qty__wrapper').forEach(el => {
      new theme.QtySelector(el, {
        namespace: '.product'
      })
    })
  }

  initAjaxProductForm () {
    if (theme.settings.cartType === 'dropdown') {
      new theme.AjaxProduct(this.cache.form, '.add-to-cart')
    }
  }

  /*============================================================================
    Variant change methods
  ==============================================================================*/
  updateColorName (color, index) {
    // Updates on radio button change, not variant.js
    this.container.querySelector(this.selectors.colorLabel + `[data-index="${index}"`).textContent = color
  }

  updateCartButton (evt) {
    const variant = evt.detail.variant
    const cartBtn = this.container.querySelector(this.selectors.addToCart)
    const cartBtnText = this.container.querySelector(this.selectors.addToCartText)

    if (!cartBtn) return

    if (variant) {
      if (variant.available) {
        // Available, enable the submit button and change text
        cartBtn.classList.remove(this.classes.disabled)
        cartBtn.disabled = false
        cartBtnText.textContent = cartBtnText.dataset.defaultText
      } else {
        // Sold out, disable the submit button and change text
        cartBtn.classList.add(this.classes.disabled)
        cartBtn.disabled = true
        cartBtnText.textContent = theme.strings.soldOut
      }
    } else {
      // The variant doesn't exist, disable submit button
      cartBtn.classList.add(this.classes.disabled)
      cartBtn.disabled = true
      cartBtnText.textContent = theme.strings.unavailable
    }
  }

  updatePrice (evt) {
    const variant = evt.detail.variant

    if (variant) {
      // If no price element, form initiated later than rest of
      // product page. Update cached elements
      if (!this.cache.price) {
        this.cacheElements()
      }

      // Regular price
      this.cache.price.innerHTML = theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)

      // Sale price, if necessary
      if (variant.compare_at_price > variant.price) {
        this.cache.comparePrice.innerHTML = theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat)
        this.cache.priceWrapper.classList.remove(this.classes.hidden)
        this.cache.price.classList.add(this.classes.onSale)
        if (this.cache.comparePriceA11y) {
          this.cache.comparePriceA11y.setAttribute('aria-hidden', 'false')
        }
        if (this.cache.priceA11y) {
          this.cache.priceA11y.setAttribute('aria-hidden', 'false')
        }

        let savings = variant.compare_at_price - variant.price

        if (theme.settings.saveType === 'percent') {
          savings = Math.round(((savings) * 100) / variant.compare_at_price) + '%'
        } else {
          savings = theme.Currency.formatMoney(savings, theme.settings.moneyFormat)
        }

        this.cache.savePrice.classList.remove(this.classes.hidden)
        this.cache.savePrice.innerHTML = theme.strings.savePrice.replace('[saved_amount]', savings)
      } else {
        if (this.cache.priceWrapper) {
          this.cache.priceWrapper.classList.add(this.classes.hidden)
        }
        this.cache.savePrice.classList.add(this.classes.hidden)
        this.cache.price.classList.remove(this.classes.onSale)
        if (this.cache.comparePriceA11y) {
          this.cache.comparePriceA11y.setAttribute('aria-hidden', 'true')
        }
        if (this.cache.priceA11y) {
          this.cache.priceA11y.setAttribute('aria-hidden', 'true')
        }
      }
    }
  }

  updateUnitPrice (evt) {
    const variant = evt.detail.variant

    if (variant && variant.unit_price) {
      this.container.querySelector(this.selectors.unitPrice).innerHTML = theme.Currency.formatMoney(variant.unit_price, theme.settings.moneyFormat)
      this.container.querySelector(this.selectors.unitPriceBaseUnit).innerHTML = theme.Currency.getBaseUnit(variant)
      this.container.querySelector(this.selectors.unitWrapper).classList.remove(this.classes.hidden)
    } else {
      this.container.querySelector(this.selectors.unitWrapper).classList.add(this.classes.hidden)
    }
  }

  imageSetArguments (variant) {
    variant = variant ? variant : (this.variants ? this.variants.currentVariant : null)
    if (!variant) return

    const setValue = this.settings.currentImageSet = this.getImageSetName(variant[this.settings.imageSetIndex])
    const set = `${this.settings.imageSetName}_${setValue}`

    // Always start on index 0
    this.settings.currentSlideIndex = 0

    // Return object that adds cellSelector to mainSliderArgs
    return {
      cellSelector: '[data-group="' + set + '"]',
      imageSet: set,
      initialIndex: this.settings.currentSlideIndex
    }
  }

  updateImageSet (evt) {
    // If called directly, use current variant
    const variant = evt ? evt.detail.variant : (this.variants ? this.variants.currentVariant : null)
    if (!variant) {
      return
    }

    const setValue = this.getImageSetName(variant[this.settings.imageSetIndex])

    // Already on the current image group
    if (this.settings.currentImageSet === setValue) {
      return
    }

    this.initProductSlider(variant)
  }

  // Show/hide thumbnails based on current image set
  updateImageSetThumbs (set) {
    this.cache.thumbSlider.querySelectorAll('.product__thumb-item').forEach(thumb => {
      thumb.classList.toggle(this.classes.hidden, thumb.dataset.group !== set)
    })
  }

  getImageSetName (string) {
    return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '')
  }

  updateSku (evt) {
    const variant = evt.detail.variant
    let newSku = ''
    let hideSku = true

    if (variant) {
      if (variant.sku) {
        newSku = variant.sku
        hideSku = false
      }

      this.container.querySelectorAll(this.selectors.sku).forEach(el => {
        el.classList.toggle(this.classes.hidden, hideSku)
        el.querySelector('[data-sku-id]').textContent = newSku
      })
    }
  }

  updateInventory (evt) {
    const variant = evt.detail.variant

    // Override to display in stock message for sold out variants with policy set to continue
    // Must be set to true in order to display in stock message for sold out variants
    const inStockForOOSAndContinueSelling = false;

    if (!variant) {
      // Variant is unavailable
      // So we want to hide both the inventory quantity + incoming transfer notice
      this.toggleInventoryQuantity('hidden', false);
      this.toggleIncomingInventory(false);
      return;
    }

    // Inventory management is nil
    // So we want to hide the low inventory message but show an In stock status
    // And hide the incoming transfer notice
    if (!variant.inventory_management) {
      this.toggleInventoryQuantity('visible', false);
      this.toggleIncomingInventory(false);
      return
    }

    if (variant.inventory_management === 'shopify' && window.inventories && window.inventories[this.productId]) {
      const variantInventoryObject = window.inventories[this.productId][variant.id]

      const { quantity, policy, incoming, next_incoming_date } = variantInventoryObject || {}

      this.toggleInventoryQuantity(undefined, quantity);

      if (inStockForOOSAndContinueSelling) {
        if (quantity <= 0 && policy === 'continue') {
          this.toggleInventoryQuantity('visible', false);
          this.toggleIncomingInventory(false);
          return;
        }
      }

      if ((incoming && !variant.available) || (quantity <= 0 && policy === 'continue')) {
        this.toggleIncomingInventory(true, next_incoming_date, policy);
      } else {
        this.toggleIncomingInventory(false)
      }
    }
  }

  updateAvailability (evt) {
    const variant = evt.detail.variant
    if (!variant) {
      return
    }

    this.storeAvailability.updateContent(variant.id)
  }

  toggleInventoryQuantity (state = undefined, quantity) {

    const productInventoryEl = this.container.querySelector(this.selectors.inventory)
    const inventorySalesPoint = productInventoryEl.closest('.sales-point')

    if (state && state === 'hidden') {
      // variant is unavailable
      // hide and return
      if (inventorySalesPoint) {
        inventorySalesPoint.classList.add(this.classes.hidden);
      }

      return;
    }

    let showLowInventoryMessage = false

    // Check if we should show low inventory message
    if (parseInt(quantity) <= parseInt(this.settings.inventoryThreshold) && parseInt(quantity) > 0) {
      showLowInventoryMessage = true
    }

    if (parseInt(quantity) > 0 || (state && state === 'visible')) {
      if (showLowInventoryMessage) {
        productInventoryEl.parentNode.classList.add(this.classes.lowInventory)
        if (quantity > 1) {
          productInventoryEl.textContent = theme.strings.otherStockLabel.replace('[count]', quantity)
        } else {
          productInventoryEl.textContent = theme.strings.oneStockLabel.replace('[count]', quantity)
        }
      } else {
        productInventoryEl.parentNode.classList.remove(this.classes.lowInventory)
        productInventoryEl.textContent = theme.strings.inStockLabel
      }

      if (inventorySalesPoint) {
        inventorySalesPoint.classList.remove(this.classes.hidden)
      }

    } else {
      if (inventorySalesPoint) {
        inventorySalesPoint.classList.add(this.classes.hidden)
      }
    }
  }

  toggleIncomingInventory (showIncomingInventory, incomingInventoryDate, policy) {

    const incomingInventoryEl = this.container.querySelector(this.selectors.incomingInventory)
    const incomingInventoryIcon = incomingInventoryEl.querySelector('.icon-and-text');

    if (!incomingInventoryEl) return

    const incomingInventoryBlockEnabled = incomingInventoryEl.dataset.enabled === 'true'
    const textEl = incomingInventoryEl.querySelector('.js-incoming-text')

    // If incoming inventory block is disabled, hide it
    if (!incomingInventoryBlockEnabled) {
      incomingInventoryEl.classList.add(this.classes.hidden)
      return
    }

    if (showIncomingInventory) {
      if (incomingInventoryDate) {
        textEl.textContent = theme.strings.willBeInStockAfter.replace('[date]', incomingInventoryDate)
        incomingInventoryEl.classList.remove(this.classes.hidden)
      } else {
        textEl.textContent = theme.strings.waitingForStock
        incomingInventoryEl.classList.remove(this.classes.hidden)
      }

      // When OOS and incoming inventory and continue selling disabled, update icon to low inventory
      if (incomingInventoryIcon) {
        if (policy !== 'continue') {
          incomingInventoryIcon.classList.add(this.classes.lowInventory);
        } else {
          incomingInventoryIcon.classList.remove(this.classes.lowInventory);
        }
      }
    } else {
      incomingInventoryEl.classList.add(this.classes.hidden)
    }
  }

  /*============================================================================
    Product videos
  ==============================================================================*/
  videoSetup () {
    const productVideos = this.cache.mainSlider.querySelectorAll(this.selectors.productVideo)

    if (!productVideos.length) {
      return false
    }

    productVideos.forEach(vid => {
      const type = vid.dataset.videoType
      if (type === 'youtube') {
        this.initYoutubeVideo(vid)
      } else if (type === 'vimeo') {
        this.initVimeoVideo(vid)
      } else if (type === 'mp4') {
        this.initMp4Video(vid)
      }
    })
  }

  initYoutubeVideo (div) {
    this.videoObjects[div.id] = new theme.YouTube(
      div.id,
      {
        videoId: div.dataset.videoId,
        videoParent: this.selectors.videoParent,
        autoplay: false, // will handle this in callback
        style: div.dataset.videoStyle,
        loop: div.dataset.videoLoop,
        events: {
          onReady: this.youtubePlayerReady.bind(this),
          onStateChange: this.youtubePlayerStateChange.bind(this)
        }
      }
    )
  }

  initVimeoVideo (div) {
    this.videoObjects[div.id] = new theme.VimeoPlayer(
      div.id,
      div.dataset.videoId,
      {
        videoParent: this.selectors.videoParent,
        autoplay: false,
        style: div.dataset.videoStyle,
        loop: div.dataset.videoLoop,
      }
    )
  }

  // Comes from YouTube SDK
  // Get iframe ID with evt.target.getIframe().id
  // Then access product video players with this.videoObjects[id]
  youtubePlayerReady (evt) {
    const iframeId = evt.target.getIframe().id

    if (!this.videoObjects[iframeId]) {
      // No youtube player data
      return
    }

    const obj = this.videoObjects[iframeId]
    const player = obj.videoPlayer

    if (obj.options.style !== 'sound') {
      player.mute()
    }

    obj.parent.classList.remove('loading')
    obj.parent.classList.add('loaded')
    obj.parent.classList.add('video-interactable') // Previously, video was only interactable after slide change

    // If we have an element, it is in the visible/first slide,
    // and is muted, play it
    if (this._isFirstSlide(iframeId) && obj.options.style !== 'sound') {
      player.playVideo()
    }
  }

  _isFirstSlide (id) {
    return this.cache.mainSlider.querySelector(this.selectors.startingSlide + ' ' + '#' + id)
  }

  youtubePlayerStateChange (evt) {
    const iframeId = evt.target.getIframe().id
    const obj = this.videoObjects[iframeId]

    switch (evt.data) {
      case -1: // unstarted
        // Handle low power state on iOS by checking if
        // video is reset to unplayed after attempting to buffer
        if (obj.attemptedToPlay) {
          obj.parent.classList.add('video-interactable')
        }
        break
      case 0: // ended
        if (obj && obj.options.loop === 'true') {
          obj.videoPlayer.playVideo()
        }
        break
      case 3: // buffering
        obj.attemptedToPlay = true
        break
    }
  }

  initMp4Video (div) {
    this.videoObjects[div.id] = {
      id: div.id,
      type: 'mp4'
    }

    if (this._isFirstSlide(div.id)) {
      this.playMp4Video(div.id)
    }
  }

  stopVideos () {
    for (const [id, vid] of Object.entries(this.videoObjects)) {
      if (vid.videoPlayer) {
        if (typeof vid.videoPlayer.stopVideo === 'function') {
          vid.videoPlayer.stopVideo() // YouTube player
        }
      } else if (vid.type === 'mp4') {
        this.stopMp4Video(vid.id) // MP4 player
      }
    }
  }

  _getVideoType (video) {
    return video.getAttribute('data-video-type')
  }

  _getVideoDivId (video) {
    return video.id
  }

  playMp4Video (id) {
    const player = this.container.querySelector('#' + id)
    const playPromise = player.play()

    player.setAttribute('controls', '')
    player.focus()

    // When existing focus on the element, go back to thumbnail
    player.addEventListener('focusout', this.returnFocusToThumbnail.bind(this))

    if (playPromise !== undefined) {
      playPromise.then(function () {
        // Playing as expected
      })
        .catch(function (error) {
          // Likely low power mode on iOS, show controls
          player.setAttribute('controls', '')
          player.closest(this.selectors.videoParent).setAttribute('data-video-style', 'unmuted')
        })
    }
  }

  stopMp4Video (id) {
    const player = this.container.querySelector('#' + id);
    if (!player) return;
    player.removeEventListener('focusout', this.returnFocusToThumbnail.bind(this))
    if (typeof player.pause === 'function') {
      player.removeAttribute('controls')
      player.pause()
    }
  }

  returnFocusToThumbnail (evt) {
    // Only return focus to active thumbnail if relatedTarget
    // is a thumbnail, otherwise user may have clicked elsewhere on the page
    if (evt.relatedTarget && evt.relatedTarget.classList.contains('product__thumb')) {
      const thumb = this.container.querySelector('.product__thumb-item[data-index="' + this.settings.currentSlideIndex + '"] a')
      if (thumb) {
        thumb.focus()
      }
    }
  }

  /*============================================================================
    Product images
  ==============================================================================*/
  initImageZoom () {
    const container = this.container.querySelector(this.selectors.imageContainer)
    if (!container) {
      return
    }
    container.addEventListener('photoswipe:afterChange', function (evt) {
      if (this.flickity) {
        this.flickity.goToSlide(evt.detail.index)
      }
    }.bind(this))
    // Execute JS modules after the tooltip is opened
    document.addEventListener('tooltip:open', e => {
      if (!e.detail.context === 'QuickShop') return
      const scripts = document.querySelectorAll('tool-tip product-component script[type="module"]')
      for (let i = 0; i < scripts.length; i++) {
          let script = document.createElement('script')
          script.type = 'module'
          script.textContent = scripts[i].textContent
          scripts[i].parentNode.replaceChild(script, scripts[i])
      }
    })
  }

  getThumbIndex (target) {
    return target.dataset.index
  }

  updateVariantImage (evt) {
    const variant = evt.detail.variant

    const newImage = this.container.querySelector('.product__thumb[data-id="' + variant.featured_media.id + '"]')
    const imageIndex = this.getThumbIndex(newImage)

    // If there is no index, slider is not initalized
    if (typeof imageIndex === 'undefined') {
      return
    }

    // Go to that variant image's slide
    if (this.flickity) {
      this.flickity.goToSlide(imageIndex)
    }
  }

  initProductSlider (variant) {
    // Stop if only a single image, but add active class to first slide
    if (this.cache.mainSlider.querySelectorAll(this.selectors.slide).length <= 1) {
      const slide = this.cache.mainSlider.querySelector(this.selectors.slide)
      if (slide) {
        slide.classList.add('is-selected')
      }
      return
    }

    // Destroy slider in preparation of new initialization
    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }

    // If variant argument exists, slideshow is reinitializing because of the
    // image set feature enabled and switching to a new group.
    // currentSlideIndex
    if (!variant) {
      const activeSlide = this.cache.mainSlider.querySelector(this.selectors.startingSlide)
      this.settings.currentSlideIndex = this._slideIndex(activeSlide)
    }

    let mainSliderArgs = {
      dragThreshold: 25,
      adaptiveHeight: true,
      avoidReflow: true,
      initialIndex: this.settings.currentSlideIndex,
      childNav: this.cache.thumbSlider,
      childNavScroller: this.cache.thumbScroller,
      childVertical: this.cache.thumbSlider.dataset.position === 'beside',
      pageDots: true, // mobile only with CSS
      wrapAround: true,
      callbacks: {
        onInit: this.onSliderInit.bind(this),
        onChange: this.onSlideChange.bind(this)
      }
    }

    // Override default settings if image set feature enabled
    if (this.settings.imageSetName) {
      const imageSetArgs = this.imageSetArguments(variant)
      mainSliderArgs = Object.assign({}, mainSliderArgs, imageSetArgs)
      this.updateImageSetThumbs(mainSliderArgs.imageSet)
    }

    this.flickity = new Slideshow(this.cache.mainSlider, mainSliderArgs)

    // Ensure we resize the slider to avoid reflow issues
    setTimeout(() => {
      this.flickity.resize()
    }, 100)
  }

  onSliderInit (slide) {
    // If slider is initialized with image set feature active,
    // initialize any videos/media when they are first slide
    if (this.settings.imageSetName) {
      this.prepMediaOnSlide(slide)
    }
  }

  onSlideChange (index) {
    if (!this.flickity) return

    const prevSlide = this.cache.mainSlider.querySelector('.product-main-slide[data-index="' + this.settings.currentSlideIndex + '"]')

    // If imageSetName exists, use a more specific selector
    const nextSlide = this.settings.imageSetName ?
      this.cache.mainSlider.querySelectorAll('.flickity-slider .product-main-slide')[index] :
      this.cache.mainSlider.querySelector('.product-main-slide[data-index="' + index + '"]')

    prevSlide.setAttribute('tabindex', '-1')
    nextSlide.setAttribute('tabindex', 0)

    // Pause any existing slide video/media
    this.stopMediaOnSlide(prevSlide)

    // Prep next slide video/media
    this.prepMediaOnSlide(nextSlide)

    // Update current slider index
    this.settings.currentSlideIndex = index
  }

  stopMediaOnSlide (slide) {
    // Stop existing video
    const video = slide.querySelector(this.selectors.productVideo)
    if (video) {
      const videoType = this._getVideoType(video)
      const videoId = this._getVideoDivId(video)
      if (videoType === 'youtube') {
        if (this.videoObjects[videoId].videoPlayer) {
          this.videoObjects[videoId].videoPlayer.stopVideo()
          return
        }
      } else if (videoType === 'mp4') {
        this.stopMp4Video(videoId)
        return
      }
    }

    // Stop existing media
    const currentMedia = slide.querySelector(this.selectors.media)
    if (currentMedia) {
      currentMedia.dispatchEvent(
        new CustomEvent('mediaHidden', {
          bubbles: true,
          cancelable: true
        })
      )
    }
  }

  prepMediaOnSlide (slide) {
    const video = slide.querySelector(this.selectors.productVideo)
    if (video) {
      this.flickity.reposition()
      const videoType = this._getVideoType(video)
      const videoId = this._getVideoDivId(video)
      if (videoType === 'youtube') {
        if (this.videoObjects[videoId].videoPlayer && this.videoObjects[videoId].options.style !== 'sound') {
          this.videoObjects[videoId].videoPlayer.playVideo()
          return
        }
      } else if (videoType === 'mp4') {
        this.playMp4Video(videoId)
      }
    }

    const nextMedia = slide.querySelector(this.selectors.media)
    if (nextMedia) {
      nextMedia.dispatchEvent(
        new CustomEvent('mediaVisible', {
          bubbles: true,
          cancelable: true
        })
      )
      slide.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0)
      slide.querySelector('.product-single__close-media').setAttribute('tabindex', 0)
    }
  }

  _slideIndex (el) {
    return el.getAttribute('data-index')
  }

  // Recommended products load via JS and don't add variant inventory to the
  // global variable that we later check. This function scrapes a data div
  // to get that info and manually add the values.
  updateModalProductInventory () {
    window.inventories = window.inventories || {}
    this.container.querySelectorAll('.js-product-inventory-data').forEach(el => {
      const productId = el.dataset.productId
      window.inventories[productId] = {}

      el.querySelectorAll('.js-variant-inventory-data').forEach(el => {
        window.inventories[productId][el.dataset.id] = {
          'quantity': el.dataset.quantity,
          'policy': el.dataset.policy,
          'incoming': el.dataset.incoming,
          'next_incoming_date': el.dataset.date
        }
      })
    })
  }

  /*============================================================================
    Product media (3D)
  ==============================================================================*/
  initModelViewerLibraries () {
    const modelViewerElements = this.container.querySelectorAll(this.selectors.media)
    if (modelViewerElements.length < 1) return

    theme.ProductMedia.init(modelViewerElements, this.sectionId)
  }

  initShopifyXrLaunch () {
    document.addEventListener(
      'shopify_xr_launch',
      () => {
        const currentMedia = this.container.querySelector(`${this.selectors.productMediaWrapper}:not(.${this.classes.hidden})`)
        currentMedia.dispatchEvent(
          new CustomEvent('xrLaunch', {
            bubbles: true,
            cancelable: true
          })
        )
      }
    )
  }

  customMediaListeners () {
    document.querySelectorAll(this.selectors.closeMedia).forEach(el => {
      el.addEventListener('click', function () {
        const slide = this.cache.mainSlider.querySelector(this.selectors.currentSlide)
        const media = slide.querySelector(this.selectors.media)
        if (media) {
          media.dispatchEvent(
            new CustomEvent('mediaHidden', {
              bubbles: true,
              cancelable: true
            })
          )
        }
      }.bind(this))
    })

    const modelViewers = this.container.querySelectorAll('model-viewer')
    if (modelViewers.length) {
      modelViewers.forEach(el => {
        el.addEventListener('shopify_model_viewer_ui_toggle_play', function (evt) {
          this.mediaLoaded(evt)
        }.bind(this))

        el.addEventListener('shopify_model_viewer_ui_toggle_pause', function (evt) {
          this.mediaUnloaded(evt)
        }.bind(this))
      })
    }
  }

  mediaLoaded (evt) {
    this.container.querySelectorAll(this.selectors.closeMedia).forEach(el => {
      el.classList.remove(this.classes.hidden)
    })

    if (this.flickity) {
      this.flickity.setDraggable(false)
    }
  }

  mediaUnloaded (evt) {
    this.container.querySelectorAll(this.selectors.closeMedia).forEach(el => {
      el.classList.add(this.classes.hidden)
    })

    if (this.flickity) {
      this.flickity.setDraggable(true)
    }
  }

  onUnload () {
    theme.ProductMedia.removeSectionModels(this.sectionId)

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }
}

customElements.define('product-component', Product)
