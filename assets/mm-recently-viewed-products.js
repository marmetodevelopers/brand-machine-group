(window.marmeto = window.marmeto || {}),
(marmeto.RecentlyViewedProducts = (function () {
  function t(t) {
    (this.container = document.querySelector(
      '[data-section-type="' + t + '"]'
    )),
      this.container &&
        ((this.options = JSON.parse(
          this.container.getAttribute("data-section-settings")
        )),
        this.options.productId && this.saveCurrentProduct(),
        this.fetchProducts());
  }
  return (
    (t.prototype.fetchProducts = function () {
      var t = this,
        r = this.getSearchQueryString();
      "" !== r &&
        fetch(
          "/search?view=mm-recently-viewed-products&type=product&q=".concat(
            r
          ),
          { credentials: "same-origin", method: "GET" }
        ).then(function (r) {
          r.text().then(function (r) {
            var e = document.createElement("div");
            (e.innerHTML = r),
              (t.container.querySelector(
                ".mm-recentlyviewed__container"
              ).innerHTML = e.querySelector(
                '[data-section-type="mm-recently-viewed-products"] .mm-recentlyviewed__container'
              ).innerHTML),
              (t.container.parentNode.style.display = "block"),
              t.initSlider();
              recentlyViewedProductSlider();
          });
        });
    }),
    (t.prototype.saveCurrentProduct = function () {
      var t = JSON.parse(
          localStorage.getItem("mmRecentlyViewedProducts") || "[]"
        ),
        r = this.options.productId;
      t.includes(r) || t.unshift(r);
      try {
        localStorage.setItem(
          "mmRecentlyViewedProducts",
          JSON.stringify(t.slice(0, 12))
        );
      } catch (t) {}
    }),
    (t.prototype.getSearchQueryString = function () {
      var t = JSON.parse(
        localStorage.getItem("mmRecentlyViewedProducts") || "[]"
      );
      return (
        t.includes(this.options.productId) &&
          t.splice(t.indexOf(this.options.productId), 1),
        t
          .map(function (t) {
            return "id:" + t;
          })
          .join(" OR ")
      );
    }),
    (t.prototype.initSlider = function () {
      document.querySelector('[data-section-type="mm-recently-viewed-products"]').style.display="block";
    }),
    t
  );
})()),
new marmeto.RecentlyViewedProducts("mm-recently-viewed-products");

function recentlyViewedProductSlider(){
  let relatedProductsWrap = document.querySelector('.mm-recentlyviewed__products');
  if (relatedProductsWrap) {
    if (window.innerWidth > 990) {
      let flkty = new Flickity('.mm-recentlyviewed__products', {
        contain: true,
        wrapAround: true,
        prevNextButtons: true,
        pageDots: false,
        groupCells: 4,
        cellAlign: 'left'
      });
    }
    else {
      let flkty = new Flickity('.mm-recentlyviewed__products', {
        contain: true,
        wrapAround: true,
        prevNextButtons: true,
        pageDots: false,
        groupCells: 2,
        cellAlign: 'left'
      });
    }
  }
}
