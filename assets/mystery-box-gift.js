import '@archetype-themes/scripts/modules/cart-api';

const config = () => window.theme?.mysteryBoxGift;

function getVariantId() {
  const id = config()?.variantId;
  return id ? Number(id) : null;
}

function getThresholdCents() {
  return config()?.thresholdCents ?? 15000;
}

function isMysteryBoxItem(item, variantId) {
  return Number(item.variant_id) === variantId;
}

function getEligibleSubtotal(cart, variantId) {
  return cart.items.reduce((sum, item) => {
    if (isMysteryBoxItem(item, variantId)) {
      return sum;
    }
    return sum + item.final_line_price;
  }, 0);
}

function findMysteryBoxLine(cart, variantId) {
  return cart.items.find((item) => isMysteryBoxItem(item, variantId));
}

async function fetchCart() {
  const response = await fetch(`${theme.routes.cart}?t=${Date.now()}`, {
    credentials: 'same-origin',
    method: 'GET'
  });
  return response.json();
}

async function addMysteryBox(variantId) {
  const response = await fetch(theme.routes.cartAdd, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      items: [{
        id: variantId,
        quantity: 1,
        properties: {
          '_promo': 'Free gift — Spend $150+'
        }
      }]
    })
  });
  const data = await response.json();
  if (data.status === 422 || data.status === 'bad_request') {
    throw new Error(data.description || data.message || 'Could not add Mystery Box.');
  }
  return data;
}

async function setMysteryBoxQuantity(lineKey, quantity) {
  const response = await fetch(`${theme.routes.cartChange}?t=${Date.now()}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: lineKey,
      quantity
    })
  });
  const text = await response.text();
  const data = JSON.parse(text);
  if (data.status === 422) {
    throw new Error(data.message || 'Could not update Mystery Box.');
  }
  return data;
}

let syncing = false;

async function syncMysteryBoxGift() {
  const settings = config();
  if (!settings?.enabled) {
    return false;
  }

  const variantId = getVariantId();
  if (!variantId) {
    return false;
  }

  if (syncing) {
    return false;
  }

  syncing = true;

  try {
    const cart = await fetchCart();
    const threshold = getThresholdCents();
    const eligibleSubtotal = getEligibleSubtotal(cart, variantId);
    const qualifies = eligibleSubtotal >= threshold;
    const giftLine = findMysteryBoxLine(cart, variantId);
    let changed = false;

    if (qualifies && !giftLine) {
      await addMysteryBox(variantId);
      changed = true;
    } else if (qualifies && giftLine && giftLine.quantity > 1) {
      await setMysteryBoxQuantity(giftLine.key, 1);
      changed = true;
    } else if (!qualifies && giftLine) {
      await setMysteryBoxQuantity(giftLine.key, 0);
      changed = true;
    }

    if (changed) {
      document.dispatchEvent(new CustomEvent('cart:build'));
    }

    return changed;
  } finally {
    syncing = false;
  }
}

function initMysteryBoxGift() {
  if (!config()?.enabled || !getVariantId()) {
    return;
  }

  const runSync = () => {
    syncMysteryBoxGift().catch(() => {});
  };

  document.addEventListener('cart:updated', runSync);
  document.addEventListener('ajaxProduct:added', runSync);
  document.addEventListener('page:loaded', runSync);
}

initMysteryBoxGift();
