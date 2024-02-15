class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter((element) => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector('.facets__selected');
    const sourceElement = source.querySelector('.facets__selected');

    const targetElementAccessibility = target.querySelector('.facets__summary');
    const sourceElementAccessibility = source.querySelector('.facets__summary');

    if (sourceElement && targetElement) {
      target.querySelector('.facets__selected').outerHTML = source.querySelector('.facets__selected').outerHTML;
    }

    if (targetElementAccessibility && sourceElementAccessibility) {
      target.querySelector('.facets__summary').outerHTML = source.querySelector('.facets__summary').outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
            const noJsElements = document.querySelectorAll('.no-js-list');
            noJsElements.forEach((el) => el.remove());
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    const mockEvent = new Event('input');
    this.querySelectorAll('input').forEach(element => element.addEventListener('input', this.onRangeChange.bind(this)));
    this.setMinAndMaxValues(mockEvent);
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues(event);
  }
  
  setMinAndMaxValues(event) {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    const totalval = minInput.getAttribute('max') || document.querySelector("#Filter-Price-GTE").getAttribute('max');

    // for Desktop getting the min and max value from the range
    let minvalue = document.querySelector("#Filter-Price-GTE").value;
    let maxvalue = document.querySelector("#Filter-Price-LTE").value;
    
    // for mobile getting the min and max value from the range
    let mobileMinvalue = document.querySelector(".min-range_mobile").value;
    let mobileMaxvalue = document.querySelector(".max-range_mobile").value;

    minvalue = parseFloat(minvalue);
    maxvalue = parseFloat(maxvalue);
    mobileMinvalue = parseFloat(mobileMinvalue);
    mobileMaxvalue = parseFloat(mobileMaxvalue);

    // Conditon for overriding the overlap of thumb on dektop
    if (maxvalue - minvalue <= 1500) {
      if (maxvalue == parseInt(totalval)) {
        //For desktop min value
        let setMinValue;
        
        if (minvalue == parseInt(totalval)) {
          setMinValue = minvalue - 1500;
        } else {
          setMinValue = minvalue;
        }
        
        document.querySelector(".min-price").value = setMinValue;  
        document.querySelector("#Filter-Price-GTE").value = setMinValue;
        document.querySelector(".input-progress").style.left = (setMinValue / totalval) * 100 + "%"; //progress between the price range left
        document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right
    
         //For desktop max value 
        document.querySelector(".max-price").value = maxvalue;
        document.querySelector("#Filter-Price-LTE").value= maxvalue;
        document.querySelector(".input-progress").style.left = (setMinValue / totalval) * 100 + "%"; //progress between the price range left
        document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right  

        const maxrange = document.querySelector(".max-price");
        const maxbubble = document.querySelector(".max-price_bubble");
        const minrange = document.querySelector(".min-price");
        const minbubble = document.querySelector(".min-price_bubble");

        setMaxBubble(maxrange, maxbubble);
        setBubble(minrange, minbubble);
        
        return;
      }
      
      let gap = maxvalue - minvalue;
      let realDifferenceGap = 1500 - gap;
      
      maxvalue += realDifferenceGap;

      //For desktop min value
      document.querySelector(".min-price").value = minvalue;  
      document.querySelector(".input-progress").style.left = (minvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right
  
       //For desktop max value 
      document.querySelector(".max-price").value = maxvalue;
      document.querySelector("#Filter-Price-LTE").value= maxvalue;
      document.querySelector(".input-progress").style.left = (minvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right

      const maxrange = document.querySelector(".max-price");
      const maxbubble = document.querySelector(".max-price_bubble");
      
      setMaxBubble(maxrange, maxbubble);
      
      event.preventDefault();
      return false;
    } else {      
      //For desktop min value
      document.querySelector(".min-price").value = minvalue;  
      document.querySelector(".input-progress").style.left = (minvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right

      //For desktop max value 
      document.querySelector(".max-price").value = maxvalue;
      document.querySelector(".input-progress").style.left = (minvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".input-progress").style.right = 100 - (maxvalue / totalval) * 100 + "%"; //progress between the price range right
    }

    // Conditon for overriding the overlap of thumb on Mobile
    if (mobileMaxvalue - mobileMinvalue <= 1500) {
      if (mobileMaxvalue == parseInt(totalval)) {

        let setMinValue;
        
        if (mobileMinvalue == parseInt(totalval)) {
          setMinValue = mobileMinvalue - 1500;
        } else {
          setMinValue = mobileMinvalue;
        }
        
        document.querySelector(".mobile_display-price.min-price").value = setMinValue;
        document.querySelector(".min-range_mobile").value = setMinValue;
        document.querySelector(".mobile-input-progress").style.left = (setMinValue / totalval) * 100 + "%"; //progress between the price range left
        document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 
        
        //For mobile max value
        document.querySelector(".mobile_display-price.max-price").value = mobileMaxvalue;
        document.querySelector(".max-range_mobile").value = mobileMaxvalue;
        document.querySelector(".mobile-input-progress").style.left = (setMinValue / totalval) * 100 + "%"; //progress between the price range left
        document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 
  
        const MobileMaxrange = document.querySelector(".max-range_mobile");
        const MobileMaxinbubble = document.querySelector(".mobile-max_bubble");
        const MobileMinrange = document.querySelector(".min-range_mobile");
        const MobileMininbubble = document.querySelector(".mobile-min_bubble");

        setMaxBubble(MobileMaxrange, MobileMaxinbubble);
        setBubble(MobileMinrange,MobileMininbubble);
        
        return;
      }
      
      let gap = mobileMaxvalue - mobileMinvalue;
      let realDifferenceGap = 1500 - gap;
      
      mobileMaxvalue += realDifferenceGap;
      
      document.querySelector(".mobile_display-price.min-price").value = mobileMinvalue;
      document.querySelector(".mobile-input-progress").style.left = (mobileMinvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 
      
      //For mobile max value
      document.querySelector(".mobile_display-price.max-price").value = mobileMaxvalue;
      document.querySelector(".max-range_mobile").value = mobileMaxvalue;
      document.querySelector(".mobile-input-progress").style.left = (mobileMinvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 

      const MobileMaxrange = document.querySelector(".max-range_mobile");
      const MobileMaxinbubble = document.querySelector(".mobile-max_bubble");

      setMaxBubble(MobileMaxrange, MobileMaxinbubble);
      
      event.preventDefault();
      return false;
    } else {
      //For mobile min value
      document.querySelector(".mobile_display-price.min-price").value = mobileMinvalue;
      document.querySelector(".mobile-input-progress").style.left = (mobileMinvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 

      //For mobile max value
      document.querySelector(".mobile_display-price.max-price").value = mobileMaxvalue;
      document.querySelector(".mobile-input-progress").style.left = (mobileMinvalue / totalval) * 100 + "%"; //progress between the price range left
      document.querySelector(".mobile-input-progress").style.right = 100 - (mobileMaxvalue / totalval) * 100 + "%"; 
    }

    //bubble price for min desktop
    const minrange = document.querySelector(".min-price");
    const minbubble = document.querySelector(".min-price_bubble");

    //for Mobile
    const MobileMinrange = document.querySelector(".min-range_mobile");
    const MobileMininbubble = document.querySelector(".mobile-min_bubble");

    setBubble(MobileMinrange,MobileMininbubble)
    setBubble(minrange, minbubble);
    
    function setBubble(range, minbubble) {
      const val = range.value;
      const getTotalValue = document.querySelector("#Filter-Price-GTE").getAttribute('max');
      const totalval= minInput.getAttribute('max') || getTotalValue;
    
      minbubble.innerHTML = val;
    }
  
    //bubble price for max mobile
    const maxrange = document.querySelector(".max-price");
    const maxbubble = document.querySelector(".max-price_bubble");

    //for Mobile
    const MobileMaxrange = document.querySelector(".max-range_mobile");
    const MobileMaxinbubble = document.querySelector(".mobile-max_bubble");

    function setMaxBubble(range, maxbubble) {
      const val = range.value;
      const getTotalValue = document.querySelector("#Filter-Price-GTE").getAttribute('max');
      const totalval= minInput.getAttribute('max') || getTotalValue;
      maxbubble.innerHTML = val;
    }
    
    setMaxBubble(maxrange, maxbubble);
    setMaxBubble(MobileMaxrange, MobileMaxinbubble);
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);

const filterButton = document.querySelector('.facets__heading');
if(filterButton){
    
  filterButton.addEventListener('click', function() {
    const filterContainer = document.querySelector(".filter-collection__container");
    const filterFooter = document.querySelector(".filter-collection__footer");

    filterContainer.classList.toggle("visible");
    filterFooter.classList.toggle("visible");
  })
}

const filterShowResults = document.querySelector('.filter-collection__show');
if(filterShowResults){
  filterShowResults.addEventListener('click', function() {
    let targetElement = document.querySelector('.product-grid-container');
    targetElement.scrollIntoView({ behavior: 'smooth' });
  })
}