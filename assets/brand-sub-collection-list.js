class ProductTab extends HTMLElement {
    constructor() {
      super();
      this.container = document.querySelector('.sub-collection-tabs-container');
      this.prevButton = document.querySelector('.sub-collection-carousel-container .prev-button');
      this.nextButton = document.querySelector('.sub-collection-carousel-container .next-button');
  
      this.tabsArray = this.querySelectorAll(".sub-collection-tab-container__item");
      this.productsContainerArray = this.querySelectorAll('.sub-collection-product-grid__item');
      this.redirectButton = this.querySelector("#subcollectionRedirect");
  
      this.tabsArray.forEach(tab => {
        tab.addEventListener("click", this.replaceCollectionType.bind(this));
      });
  
      this.initialLoad();
    }
  
    initialLoad() {  
      this.prevButton.addEventListener('click', this.scrollLeft.bind(this));
      this.nextButton.addEventListener('click', this.scrollRight.bind(this));
  
      this.container.addEventListener('scroll', this.handleScroll.bind(this));
  
      if (this.container.scrollLeft + this.container.clientWidth >= this.container.scrollWidth) {
        this.nextButton.style.opacity = '0.5';
      }
    }

    scrollLeft() {
      this.container.scrollBy({
        left: -140,
        behavior: 'smooth'
      });
    }
  
    scrollRight() {
      this.container.scrollBy({
        left: 140,
        behavior: 'smooth'
      });
    }
    handleScroll() {
      if (this.container.scrollLeft === 0) {
        this.prevButton.style.opacity = '0.5';
      } else {
        this.prevButton.style.opacity = '1';
      }
  
      if (this.container.scrollLeft + this.container.clientWidth >= this.container.scrollWidth) {
        this.nextButton.style.opacity = '0.5';
      } else {
        this.nextButton.style.opacity = '1';
      }
    }
    //replaces the active collection handle whatever the tab image is clicked on
    replaceCollectionType(event) {
      const clickedElement = event.target.closest('.sub-collection-tab-container__item');
      if (clickedElement) {
        this.currentCollectionType = clickedElement.dataset.collectionType;
        this.replaceContent();
      }
    }
    //Adds opacity to active tab image and toggles the display properties for active products
    replaceContent() {
      this.tabsArray.forEach(element => {
        if (element.dataset.collectionType === this.currentCollectionType) {
          element.classList.add("active-tab");
        } else {
          element.classList.remove("active-tab");
        }
      });
  
      this.productsContainerArray.forEach(element => {
        if (element.dataset.collectionType === this.currentCollectionType) {
          element.classList.add("active-container");
          element.classList.remove('inactive-container');
        } else {
          element.classList.remove("active-container");
          element.classList.add('inactive-container');
        }
      });
  
      this.redirectButton.classList.remove("hidden");
      this.redirectButton.setAttribute("href", `${this.currentCollectionType}`);
    }
  }
  
  customElements.define('product-tab', ProductTab);