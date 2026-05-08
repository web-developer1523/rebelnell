import '@archetype-themes/scripts/config';

theme.delegate = {
  on: function(event, callback, options){
    if( !this.namespaces ) // save the namespaces on the DOM element itself
      this.namespaces = {};

    this.namespaces[event] = callback;
    options = options || false;

    this.addEventListener(event.split('.')[0], callback, options);
    return this;
  },
  off: function(event) {
    if (!this.namespaces) { return }
    this.removeEventListener(event.split('.')[0], this.namespaces[event]);
    delete this.namespaces[event];
    return this;
  }
};

// Extend the DOM with these above custom methods
window.on = Element.prototype.on = theme.delegate.on;
window.off = Element.prototype.off = theme.delegate.off;
