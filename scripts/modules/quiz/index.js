/* global $BV */
define([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu',
  'modules/api',
  'modules/models-product',
  'modules/cart-monitor',
  'hyprlive',
  'swiper',
  'modules/api-features',
], function(
  $,
  _,
  Backbone,
  API,
  ProductModel,
  CartMonitor,
  Hypr,
  Swiper, 
  ApiFeature
) {
  var DEBUG = false;

  var EXPERTISE_OPTIONS = [
    {
      value: 'novice',
      label: 'NOVICE',
      description: 'You want to take better care of your skin, but aren\'t sure what you need.',
      answer: 'I want to take better care of my skin, but I\'m not sure what I need.'
    },
    {
      value: 'intermediate',
      label: 'IN THE MIDDLE',
      description: 'You know your skin fairly well but would like to up your game.',
      answer: 'I know my skin fairly well but would like to up my game.'
    },
    {
      value: 'expert',
      label: 'EXPERT',
      description: 'You know your skin type and you’re well versed in skincare terminology.',
      answer: 'I know my skin type and am well versed in skincare terminology.'
    }
  ];

  var SKIN_CONCERNS = [
    {
      value: 'aging',
      label: 'AGING',
      description: 'Due mostly to cumulative sun exposure, visible signs of aging skin include wrinkles, lax or sagging skin, uneven pigmentation and rough texture. Aminofil®, NeoGlucosamine® & Retinol are key ingredients in treating the look of aging skin.',
      answer: 'I want to improve aging skin.'
    },
    {
      value: 'wrinkles',
      label: 'FINE LINES & WRINKLES',
      description: 'Years of facial expressions + sun exposure lead to the appearance of fine lines and wrinkles. Glycolic Acid (an AHA) & Retinol are highly effective ingredients for treating this universal skin concern.',
      answer: 'I want to improve fine-lines and wrinkles.'
    },
    {
      value: 'dry-scaly',
      label: 'DRY OR SCALY SKIN',
      description: 'Dry skin is characterized by flaking and skin tightness and can also be rough and scaly. Look for products with Gluconolactone (PHA), Hyaluronic Acid and PHA Bionic Acids (Lactobionic Acid or Maltobionic Acid) to alleviate and prevent dry skin.',
      answer: 'I want to improve dry or scaly skin.'
    },
    {
      value: 'acne-blemishes',
      label: 'ACNE & BLEMISHES',
      description: 'Acne is commonly seen on the face, back and chest and can be triggered by excess sebum (oil) , hormonal fluctuations or stress. Glycolic and Mandelic Acids (AHAs) & Salicylic Acid (BHA) are very effective ingredients for oily or blemish-prone skin.',
      answer: 'I want to improve acne and blemishes.'
    },
    {
      value: 'kerastosis-pilaris',
      label: 'KERASTOSIS PILARIS',
      description: 'Keratosis Pilaris (KP) is a benign follicular skin condition of rough bumps that look like goose bumps or chicken skin. It usually appears on the back and outer side of the upper arms and thighs. Look for products with Glycolic Acid to treat KP.',
      answer: 'I want to improve Keratosis Pilaris.'
    },
    {
      value: 'dark-circles',
      label: 'DARK CIRCLES & CROW’S FEET',
      description: 'Dark circles and the little lines around your eyes (crow’s feet) become more prominent as skin thins with age. Gentle products formulated with Gluconolactone (PHA), Lactobionic Acid (PHAs)and NeoGlucosamine® can help with this common issue in the delicate eye area.',
      answer: 'I want to improve dark circles and crows feet.'
    },
    {
      value: 'spots',
      label: 'UNEVEN SKIN TONE & DARK SPOTS',
      description: 'Uneven skin tone and dark spots appear as areas of  skin discoloration on the face, chest, shoulders or hands. Also known as sun spots, age spots and dark spots. Look for products that contain Gluconolactone (PHA), NeoGlucosamine® and Vitamin C.',
      answer: 'I want to improve uneven skin tone and dark spots.'
    },
    {
      value: 'sagging',
      label: 'LAX OR SAGGING SKIN',
      description: 'Lax or Sagging Skin (laxity) is due to accumulated sun exposure and gravity. Ingredients like Aminofil®, NeoGlucosamine®, and NeoCitriate® target and treat lax and sagging skin for improved tone and firmness.',
      answer: 'I want to improve lax or sagging skin.'
    },
    {
      value: 'blotchiness',
      label: 'BLOTCHINESS',
      description: 'Skin that’s prone to redness and/or flushes easily is described as “blotchy.” Ingredients to look for are the PHAs Gluconolactone and Bionic Acids (Lactobionic Acid and Maltobionic Acids). ',
      answer: 'I want to improve blotchiness.'
    },
    {
      value: 'dull',
      label: 'DULL SKIN ',
      description: 'The cumulative effects of sun exposure and photoaging can make skin look dull and lacking in natural glow. Products that contain Glycolic Acid (AHA), Vitamin C and NeoGlucosamine® and Retinol work to exfoliate and brighten skin.',
      answer: 'I want to improve dull skin.'
    }
  ];

  var SKIN_TYPES = [
    {
      value: 'normal',
      label: 'NORMAL',
      description: 'Normal skin isn’t too dry or oily but usually a bit of both in different areas. Combination skin will experience oiliness and shine in the T-zone a few hours after washing while the rest of the face (cheeks and along jaw line) can look and feel normal or even dry.',
      answer: 'I have normal skin.'
    },
    {
      value: 'oily',
      label: 'OILY',
      description: 'Oily skin is frequently caused by hormonal ups and downs as well as genetics and warm, humid environmental conditions. Shiny skin that’s prone to blemishes is a hallmark of oily skin.',
      answer: 'I have oily skin.'
    },
    {
      value: 'dry',
      label: 'DRY',
      description: 'Dry skin often feels tight, itchy and uncomfortable and can flake or even crack. It lacks moisture and natural oils and may have a weakened surface barrier.',
      answer: 'I have dry skin.'
    },
    {
      value: 'sensitive',
      label: 'SENSITIVE',
      description: 'Sensitive skin is defined as having heightened sensory responses to chemical, environmental or even social triggers. Common issues are stinging, itching, burning, dryness, redness or breakouts.',
      answer: 'I have sensitive skin.'
    }
  ];

  var CURRENT_PRODUCTS = [
    {
      value: 'cleanser',
      label: 'CLEANSER',
      description: 'A cleanser is the first step in a successful skincare regimen. All of our cleansers leave your skin clean and fresh and are formulated to target specific skin concerns according to skin type and product collection.'
    },
    {
      value: 'toner',
      label: 'TONER',
      description: 'Our high-strength toner solutions are specially formulated skincare treatments that provide an exfoliation boost to smooth skin and/or help unclog pores.'
    },
    {
      value: 'serum',
      label: 'SERUM',
      description: 'Concentrated and power packed, serums help address your skin concerns head on. Featuring our best ingredients in easily absorbed textures, our serums offer powerful benefits.'
    },
    {
      value: 'eye',
      label: 'EYE CARE',
      description: 'From dark circles to wrinkles and puffiness, eyes are often the first place to show signs of aging and fatigue. Each of our targeted formulas are developed for your eyes only.'
    },
    {
      value: 'moisturizer',
      label: 'MOISTURIZER',
      description: 'Our day and night selections of moisturizing creams and lotions are formulated with different textures and benefit ingredients unique to each collection, making it easy to choose the moisturizer that’s right for you.'
    },
    {
      value: 'sun',
      label: 'SUN CARE',
      description: 'Our selection of sun care products offers both Broad Spectrum protection and includes physical (mineral) options. Our oil-free formulas also contain antiaging ingredients, making them a daily must for every skincare regimen.'
    },
    {
      value: 'neck-body',
      label: 'NECK & BODY',
      description: 'From everyday moisturization and smoothing benefits to the visible improvement of lines, wrinkles and discoloration, these products are uniquely formulated to deliver the ultimate in neck, décolletage and body care.'
    },
    {
      value: 'exfoliator',
      label: 'EXFOLIATOR',
      description: 'Regular exfoliation removes the tired surface skin cells that can make your skin look lackluster and is an important part of any skincare regimen. Our exfoliating products smooth and refine the surface of your skin for renewed clarity and radiance.'
    },
    {
      value: 'peels-masks',
      label: 'AT-HOME PEELS & MASKS',
      description: 'Our at-home peels and masks are like having a mini med-spa at home. These booster treatments make skin look smoother and more radiant with results that get better over time. Peels can also optimize the results of your daily skincare regimen.'
    },
    {
      value: 'none',
      label: 'NONE',
      description: ''
    }
  ];

  var REGIMEN_TABLE = {
    'aging': {
      normal: 'SAR/F',
      sensitive: 'RESTORE',
      oily: 'CLARIFY',
      dry: 'RESTORE'
    },
    'wrinkles': {
      normal: 'SAR/F',
      sensitive: 'RESTORE',
      oily: 'CLARIFY',
      dry: 'RESTORE'
    },
    'dry-scaly': {
      normal: 'RESTORE',
      sensitive: 'RESTORE',
      oily: 'RESTORE',
      dry: 'RESTORE'
    },
    'acne-blemishes': {
      normal: 'CLARIFY',
      sensitive: 'RESTORE',
      oily: 'CLARIFY',
      dry: 'RESTORE'
    },
    'dark-circles': {
      normal: 'ENLIGHTEN',
      sensitive: 'RESTORE',
      oily: 'ENLIGHTEN',
      dry: 'RESTORE'
    },
    'spots': {
      normal: 'ENLIGHTEN',
      sensitive: 'RESTORE',
      oily: 'ENLIGHTEN',
      dry: 'RESTORE'
    },
    'sagging': {
      normal: 'SAR/F',
      sensitive: 'RESTORE',
      oily: 'SAR/F',
      dry: 'RESTORE'
    },
    'blotchiness': {
      normal: 'RESTORE',
      sensitive: 'RESTORE',
      oily: 'RESTORE',
      dry: 'RESTORE'
    },
    'kerastosis-pilaris': {
      normal: 'RESURFACE',
      sensitive: 'RESTORE',
      oily: 'RESURFACE',
      dry: 'RESTORE'
    },
    'dull': {
      normal: 'RESURFACE',
      sensitive: 'RESTORE',
      oily: 'RESURFACE',
      dry: 'RESTORE'
    },
    'psoriasis': {
      normal: 'PSORENT',
      sensitive: 'PSORENT',
      oily: 'PSORENT',
      dry: 'PSORENT'
    }
  };

  var REGIMENS = {
    'SAR/F': {
      slug: 'sa',
      name: 'NEOSTRATA SKIN ACTIVE',
      description: 'A collection of premium products designed for maximum, noticeable antiaging benefits. Exclusive and potent formulations deliver results that build over time.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'RETINOL',
        'AMINOFIL',
        'NEOGLUCOSAMINE'
      ],
      url: '/skincare-regimen-tool?skin-type=normal&skin-concern=fine-lines&regimen-type=basic',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_SKINACTIVE_V1_1.jpg'
    },
    'RESURFACE': {
      slug: 'resurface',
      name: 'RESURFACE',
      description: 'A collection of products that harnesses the power of exfoliating ' +
        'Glycolic Acid (AHA) at potent levels. Diminishes the look of enlarged pores and smooths the appearance of fine lines and wrinkles. Enhanced with Smart Amphoteric Complex that delivers the acid gradually for maximum efficacy and minimal irritation.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'GLYCOLIC ACID',
        'CITRIC ACID'
      ],
      url: '/skincare-regimen-tool?skin-type=normal&skin-concern=keratosis-pilaris&regimen-type=basic',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_RESURFACE_V1.jpg'
    },
    'RESTORE': {
      slug: 'restore',
      name: 'RESTORE',
      description: 'A specialized collection of products that feature gentle yet effective Polyhydroxy Acids (PHAs). PHAs help protect the skin’s moisture barrier and deliver antioxidant benefits as well as provide mild exfoliation that’s ideal for dry and sensitive skin.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'GLUCONOLACTONE',
        'LACTOBIONIC ACID',
        'MALTOBIONIC ACID'
      ],
      url: '/skincare-regimen-tool?skin-type=sensitive&skin-concern=aging&regimen-type=basic',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_RESTORE_V1.jpg'
    },
    'CLARIFY': {
      slug: 'clarify',
      name: 'CLARIFY',
      description: 'A targeted collection of products for oily and acne-prone skin. Formulated to clear clogged pores and reduce oil and blemishes. The exfoliating power of Glycolic and Mandelic Acids and NeoGlucosamine®, ' +
        'in this collection helps refine surface texture for smoother, healthier-looking skin.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'GLYCOLIC ACID',
        'MANDELIC ACID',
        'NEOGLUCOSAMINE'
      ],
      url: '/skincare-regimen-tool?skin-type=oily&skin-concern=aging&regimen-type=basic',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_CLARIFY_V1.jpg'
    },
    'ENLIGHTEN': {
      slug: 'enlighten',
      name: 'ENLIGHTEN',
      description: 'A unique collection of products that addresses a multitude of clarity and discoloration issues. Powerful skin brighteners such as Vitamin C, Retinol and NeoGlucosamine® help reveal even-toned, glowing skin.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'VITAMIN C',
        'RETINOL',
        'NEOGLUCOSAMINE'
      ],
      url: '/skincare-regimen-tool?skin-type=normal&skin-concern=dark-circles&regimen-type=basic',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_ENLIGHTEN_V1.jpg'
    },
    'CORRECT': {
      slug: 'correct',
      name: 'CORRECT',
      description: 'A collection of products that contains potent antiaging ingredients to refine and even skin texture and tone. Also targets visible lines and wrinkles.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'RETINOL',
        'HYALURONIC ACID',
        'PEPTIDES',
        'AHAS'
      ],
      url: '/c/172',
      hero: '/cms/files/WIP_NS_US_RECO_REGIMEN_CORRECT_V1.jpg'
    },
    'DEFEND': {
      slug: 'defend',
      name: 'DEFEND',
      description: 'The ideal sun protection collection with a multitude of antiaging benefits. Formulated with broad-spectrum UVA/UVB sunscreens and antioxidants, these products help protect against sun exposure and environmental stressors.',
      products: {
        cleanser: null,
        toner: null,
        serum: null,
        day: null,
        night: null,
        eye: null,
        targeted: null
      },
      ingredients: [
        'NEOGLUCOSAMINE',
        'GLUCONOLACTONE',
        'LACTOBIONIC ACID'
      ],
      url: '/c/173',
      hero: '/cms/files/'
    }
  };

  var INGREDIENTS = {
    'GLYCOLIC ACID': {
      property: 'glycolic-acid',
      description: 'Glycolic acid is a natural derivative of sugar cane. It refines the appearance of pore ' +
        'size and smooths the look of fine lines and wrinkles. NEOSTRATA® products that contain ' +
        'Glycolic Acid are enhanced with Smart Amphoteric Complex, which delivers the acid ' +
        'gradually for maximum efficacy and minimal irritation.'
    },

    'CITRIC ACID': {
      property: 'citric-acid',
      description: 'Citric acid, found naturally in citrus fruits, is a powerful Alpha/Beta Hydroxy Acid ' +
        'that has photodamage corrective antiaging effects. It’s also a powerful antioxidant ' +
        'that helps protect skin against oxidative stress.'
    },

    'MANDELIC ACID': {
      property: 'mandelic-acid',
      description: 'Mandelic acid is an oil-soluble AHA found naturally in almonds. It’s the perfect ' +
        'exfoliating acid for oily and blemish-prone skin and actually reduces oily shine ' +
        'with continued use.'
    },

    'GLUCONOLACTONE': {
      property: 'gluconolactone',
      description: 'Gluconolactone is found naturally in the skin and provides gentle antiaging and exfoliating ' +
        'benefits without causing sun sensitivity. It also hydrates and provides antioxidant ' +
        'benefits.'
    },

    'LACTOBIONIC ACID': {
      property: 'lactobionic-acids',
      description: 'Non-irritating Lactobionic Acid is part of the PHA family. This patented exfoliator, ' +
        'known as a "Bionic Acid,” helps reduce the look of lines and wrinkles, discoloration, ' +
        'enlarged pores and roughness. It’s also a potent antioxidant and humectant, making ' +
        'it ideal for dry skin.'
    },

    'MALTOBIONIC ACID': {
      property: 'maltobionic-acid',
      description: 'Non-irritating Maltobionic Acid is part of the PHA family. This patented exfoliator, ' +
        'known as a "Bionic Acid,” helps reduce the look of lines and wrinkles, discoloration, ' +
        'enlarged pores and roughness. It’s also a potent antioxidant and humectant, making ' +
        'it ideal for dry skin.'
    },

    'AMINOFIL': {
      property: 'aminofil',
      description: 'Aminofil® is a revolutionary, patented amino acid derivative. It targets expression lines ' +
        'such as scowl lines, furrows, smile lines and crow’s feet. Aminofil® is the ingredient ' +
        'for volume building, plumping and firming the look of skin.'
    },

    'NEOGLUCOSAMINE': {
      property: 'neo-glucosamine',
      description: 'NeoGlucosamine® is a patented, non-acid amino sugar that improves discoloration and ' +
        'diminishes the appearance of fine lines & wrinkles. Gently exfoliates to reveal fresh ' +
        'new cells. It’s also a building block of skin’s natural Hyaluronic Acid and helps ' +
        'promote firm skin.'
    },

    'RETINOL': {
      property: 'retinol',
      description: 'Retinol, a form of Vitamin A, helps smooth wrinkles and diminishes the appearance of ' +
        'uneven pigment.'
    },

    'VITAMIN C': {
      property: 'vitamin-c',
      description: 'Vitamin C, also known as ascorbic acid, is an antioxidant that protects the skin ' +
        'against UV-induced free radicals to help maintain a youthful appearance.'
    },

    'HYALURONIC ACID': {
      property: 'hyaluronic-acid',
      description: 'Hyaluronic acid is a natural acid found in the skin’s support matrix. When applied ' +
        'topically, HA acts like a sponge to attract and hold moisture, thus hydrating skin.'
    }
  };

  var CATALOG = {};

  var RadioSpectrum = _.template($('#template-radio-spectrum').html());
  var SectionTab = _.template($('#template-section-tab').html());
  var SectionBullet = _.template($('#template-section-bullet').html());
  var ProductDetail = _.template($('#template-product-detail').html());

  function currency(amount) {
    var whole = Math.floor(amount);
    var fraction = String(Math.floor(100 * (amount - whole))).padStart(2, '0');

    return [whole, fraction].join('.');
  }

  var templateHelpers = {
    deepGet: deepGet,
    _spectrumPart: RadioSpectrum,
    _sectionTabPart: SectionTab,
    _sectionBulletPart: SectionBullet,
    _productDetailPart: ProductDetail
  };

  var State = Backbone.Model.extend({
    defaults: function() {
      return {
        currentSection: 0,
        inputs: {}
      };
    },

    setPath: function(path, value) {
      var obj = setPath(this.attributes, path, value);

      this.set(obj);
    },

    getPath: function(path) {
      if (typeof path === 'string') {
        path = path.split('.');
      }

      // The Kibo version of Underscore.js is 1.8.3. Deep reference was added to the property
      // method in v. 1.9.0.
      return deepGet(this.attributes, path);
    }
  });

  var BaseSectionView = Backbone.View.extend({
    events: {
      'click [data-option-value]': function(evt) {
        this.model.setPath(
          'inputs.' + $(evt.target).parents('[data-option-group]').data('option-group'),
          $(evt.currentTarget).data('option-value')
        );

        this.render();
      },

      'click [data-role="next"]': function(evt) {
        // Subtract quiz-container offset to account for sticky navigation/header.
        var target = this.$el.offset().top - this.$el.parents('.quiz-widget').offset().top;
        $(document).scrollTop(target);

        this.model.set('currentSection', this.nextSection);
        pushState({ currentSection: this.nextSection }, '', this.nextSection);
        
        var quizInfo = ($.cookie('quiz-info'))? JSON.parse($.cookie('quiz-info')) : {};
        var inputs = this.model.attributes.inputs;
        if(inputs.expertise) quizInfo['quiz-skincare-knowledge'] = inputs.expertise;
        if(inputs.concern) quizInfo['quiz-primary-skin-concern'] = inputs.concern;
        if(inputs.type) quizInfo['quiz-skin-type'] = inputs.type;
        if(inputs.products) quizInfo['quiz-products-currently-used'] = inputs.products.toString();
        if(inputs.routine) quizInfo['quiz-routine-product-number'] = inputs.routine;
        if(inputs.gender) quizInfo['quiz-gender'] = inputs.gender;
        if(inputs.age) quizInfo['quiz-age'] = inputs.age;
        
        var user = require.mozuData('user');
        if(user.isAuthenticated && user.accountId){
            ApiFeature.NeostrataFeatureApi.updateCustomerPreferences({customerId : user.accountId,
                                                                      customerPreferences : quizInfo}).fail(function(err){ 
console.log('updateCustomerPreferences --> error', err); 
            });
        }
        $.cookie('quiz-info', JSON.stringify(quizInfo));
      },

      'click [data-role="anchor"]': function(evt) {
        if (this.visited) {
          this.model.set('currentSection', this.sectionHash);
          pushState({ currentSection: this.sectionHash }, '', this.sectionHash);
        }
      }
    },

    locals: function() {
      return {};
    },

    summary: function() {
      return null;
    },

    validate: function() {
      return false;
    },

    render: function() {
      var section = {
        label: this.sectionLabel || '',
        number: this.sectionNumber || null,
        hash: this.sectionHash || '',
        summary: this.summary() || '',
        validated: this.validate(),
        visited: !!this.visited
      };

      var locals = _.extend({ section: section }, this.locals(), templateHelpers);
      var html = this.template(locals);

      this.$el.html(html);
    },

    updateActiveState: function() {
      var active = this.model.get('currentSection') === this.sectionHash;
      this.$el.toggleClass('active', active);
      this.visited = this.visited || active;
    }
  });

  var ExpertiseSectionView = BaseSectionView.extend({
    template: _.template($('#template-experise-section').html()),

    initialize: function() {
      this.sectionNumber = 1;
      this.sectionLabel = 'EXPERTISE';
      this.sectionHash = '#expertise';
      this.nextSection = '#skin-concerns';

      this.model.on('change:currentSection', this.updateActiveState, this);

      this.render();
    },

    locals: function() {
      return {
        options: EXPERTISE_OPTIONS,
        optionMap: mapOptions(EXPERTISE_OPTIONS),
        value: this.model.getPath('inputs.expertise')
      };
    },

    summary: function() {
      var selection = this.model.getPath('inputs.expertise');

      if (selection) {
        return mapOptions(EXPERTISE_OPTIONS)[selection].answer;
      }
      else {
        return null;
      }
    },

    validate: function() {
      return !!this.model.getPath('inputs.expertise');
    }
  });

  var SkinConcernsSectionView = BaseSectionView.extend({
    template: _.template($('#template-skin-concerns-section').html()),

    initialize: function() {
      this.sectionNumber = 2;
      this.sectionLabel = 'SKIN CONCERNS';
      this.sectionHash = '#skin-concerns';
      this.nextSection = '#skin-type';

      this.model.on('change:currentSection', this.updateActiveState, this);

      this.render();
    },

    locals: function() {
      return {
        options: SKIN_CONCERNS,
        optionsMap: mapOptions(SKIN_CONCERNS),
        value: this.model.getPath('inputs.concern')
      };
    },

    summary: function() {
      var selection = this.model.getPath('inputs.concern');
      var optionsMap = mapOptions(SKIN_CONCERNS);

      if (selection) {
        return optionsMap[selection].answer;
      }
      else {
        return null;
      }
    },

    validate: function() {
      return !!this.model.getPath('inputs.concern');
    }
  });

  var SkinTypeSectionView = BaseSectionView.extend({
    template: _.template($('#template-skin-type-section').html()),

    initialize: function() {
      this.sectionNumber = 3;
      this.sectionLabel = 'SKIN TYPE';
      this.sectionHash = '#skin-type';
      this.nextSection = '#current-products';

      this.model.on('change:currentSection', this.updateActiveState, this);

      this.render();
    },

    locals: function() {
      return {
        options: SKIN_TYPES,
        optionsMap: mapOptions(SKIN_TYPES),
        value: this.model.getPath('inputs.type')
      };
    },

    summary: function() {
      var selection = this.model.getPath('inputs.type');
      var optionsMap = mapOptions(SKIN_TYPES);

      if (selection) {
        return optionsMap[selection].answer;
      }
      else {
        return null;
      }
    },

    validate: function() {
      return !!this.model.getPath('inputs.type');
    }
  });

  var CurrentProductSectionView = BaseSectionView.extend({
    template: _.template($('#template-current-products-section').html()),

    events: _.extend({}, BaseSectionView.prototype.events, {
      'click [data-option-value]': function(evt) {
        var group = $(evt.currentTarget).parents('[data-option-group]').data('option-group');
        var input = $(evt.currentTarget).data('option-value');

        var current = this.model.getPath('inputs.' + group) || [];
        var result;

        if (input === 'none') {
          result = [];
          this.focus = null;
        }
        else if (current.indexOf(input) === -1) {
          result = current.concat([input]);
          this.focus = input;
        }
        else {
          result = current.filter(function(item) {
            return item !== input;
          });
          this.focus = null;
        }

        this.model.setPath(
          'inputs.' + group,
          result
        );

        this.render();
      }
    }),

    initialize: function() {
      this.sectionNumber = 4;
      this.sectionLabel = 'CURRENT PRODUCT';
      this.sectionHash = '#current-products';
      this.nextSection = '#about-you';

      this.focus = null;

      this.model.on('change:currentSection', this.updateActiveState, this);

      this.render();
    },

    locals: function() {
      return {
        options: CURRENT_PRODUCTS,
        optionsMap: mapOptions(CURRENT_PRODUCTS),
        value: this.model.getPath('inputs.products'),
        focus: this.focus
      };
    },

    summary: function() {
      var PRODUCTS_SUMMARY_TEMPLATE = 'I use ${products} products.';
      var PRODUCT_SUMMARY_CONJUNCTION = 'and';

      var optionsMap = mapOptions(CURRENT_PRODUCTS);
      var selection = this.model.getPath('inputs.products') || [];


      selection = selection.map(function(value) {
        return optionsMap[value].label.toLowerCase();
      });

      if (selection.length === 0) {
        return null;
      }
      else if (selection.length === 1) {
        return PRODUCTS_SUMMARY_TEMPLATE
          .split('${products}').join(selection[0]);
      }
      else {
        var list = selection.slice(0, -1).join(', ') + ' ' + PRODUCT_SUMMARY_CONJUNCTION + ' ' + selection[selection.length-1];

        return PRODUCTS_SUMMARY_TEMPLATE
          .split('${products}').join(list);
      }
    },

    validate: function() {
      var selection = this.model.getPath('inputs.products');
      return Array.isArray(selection);
    }
  });

  var AboutYouSectionView = BaseSectionView.extend({
    template: _.template($('#template-about-you-section').html()),

    initialize: function() {
      this.sectionNumber = 5;
      this.sectionLabel = 'ABOUT YOU';
      this.sectionHash = '#about-you';
      this.nextSection = '#results';

      this.model.on('change:currentSection', this.updateActiveState, this);

      this.render();
    },

    locals: function() {
      return {
        routine: {
          options: [
            {
              value: 1,
              label: '1-2 PRODUCTS'
            },
            {
              value: 3,
              label: '3+ PRODUCTS'
            }
          ],
          value: this.model.getPath('inputs.routine')
        },
        gender: {
          options: [
            {
              value: 'female',
              label: 'FEMALE'
            },
            {
              value: 'male',
              label: 'MALE'
            }
          ],
          value: this.model.getPath('inputs.gender')
        },
        age: {
          options: [
            {
              value: 20,
              label: '0-29'
            },
            {
              value: 30,
              label: '30s'
            },
            {
              value: 40,
              label: '40s'
            },
            {
              value: 50,
              label: '50s'
            },
            {
              value: 60,
              label: '60s'
            },
            {
              value: 70,
              label: '70+'
            }
          ],
          value: this.model.getPath('inputs.age')
        }
      };
    },

    summary: function() {
      var ABOUT_ME_SUMMARY_TEMPLATE = 'I\'m a ${gender} ${age}.';

      var gender = this.model.getPath('inputs.gender');
      var age = this.model.getPath('inputs.age');

      if ( !age || !gender ) return null;

      if (age === 20) {
        age = 'under 30';
      }
      else if (age === 70) {
        age = 'over 70';
      }
      else {
        age = 'in my ' + age + 's';
      }

      return ABOUT_ME_SUMMARY_TEMPLATE
        .split('${gender}').join(gender)
        .split('${age}').join(age);
    },

    validate: function() {
      var gender = this.model.getPath('inputs.gender');
      var age = this.model.getPath('inputs.age');
      var routine = this.model.getPath('inputs.routine');

      return ( age && gender && routine );
    }
  });

  var ResultsSectionView = Backbone.View.extend({
    template: _.template($('#template-results-section').html()),

    events: {
      'click [data-action="add-to-cart"]': function(evt) {
        var productCode = $(evt.currentTarget).data('product-code');

        API.get('product', productCode)
          .then(function(productResponse) {
            var product = new ProductModel.Product(productResponse.data);

            var res = product.addToCart();

            // TODO: It would be worth investigating whether the addToCart method
            // could be adapted to return a promise.
            setTimeout(function() {
              CartMonitor.update('showGlobalCart');
              if ($(window).width() <= 991) {
                $("html, body").animate({ scrollTop: 0 }, "slow");
              }
            }, 1000);
          });
      }
    },

    initialize: function() {
      this.sectionNumber = 6;
      this.sectionLabel = 'RESULTS';
      this.sectionHash = '#results';

      this.model.on('change:currentSection', this.updateActiveState, this);
      this.model.on('change:inputs', this.render, this);

      this.$AdditionalProducts = new AdditionalProducts({ el: this.$el });

      this.render();
    },

    render: function() {
      var regimen = this.selectRegimen();

      var locals = _.extend({
        section: {
          label: this.sectionLabel,
          number: this.sectionNumber,
          summary: null,
          visited: !!this.visited
        },
        product: this.generateRecommendation(),
        regimen: regimen,
        ingredients: regimen && regimen.ingredients && regimen.ingredients.slice(0, 2).map(function(ingredient) {
          return {
            name: ingredient,
            property: INGREDIENTS[ingredient].property,
            description: INGREDIENTS[ingredient].description
          };
        })
      }, templateHelpers);

      this.$el.html(this.template(locals));

      this.$AdditionalProducts.update(regimen);
    },

    updateActiveState: function() {
      var active = this.model.get('currentSection') === this.sectionHash;

      this.$el.toggleClass('active', active);
      this.visited = this.visited || active;

      if (active) {
        this.$AdditionalProducts.render();

        // <div class="flex-fixed bvr-inline-rating" id="BVRRInlineRating-<%= code %>" data-mz-product-code="<%= code %>" data-bv-product-code="{{apicontext.headers.x-vol-locale}}-<%= code %>"></div>
        var productIds = {};

        $('[data-widget="quiz"] [data-bv-product-code]').each(function(el) {
          //var code = $(el).attr('data-bv-product-code');
          var code = $(this).data('mzProductCode'); 
          productIds[code] = {
            url: '/p/' + code,
            containerId: 'BVRRInlineRating-' + code
          };
        });
		

        if ( typeof $BV !== 'undefined' ) {
          $BV.ui( 'rr', 'inline_ratings', {
            productIds: productIds,
            containerPrefix: 'BVRRInlineRating'
          });
        }
      }
    },

    selectRegimen: function() {
      var concern = this.model.getPath('inputs.concern');
      var type = this.model.getPath('inputs.type');

      if (!type || !concern) {
        return null;
      }

      return (REGIMEN_TABLE[concern] && REGIMEN_TABLE[concern][type] && REGIMENS[REGIMEN_TABLE[concern][type]]) || null;
    },

    generateRecommendation: function() {
      var products = this.model.getPath('inputs.products') || [];

      var regimen = this.selectRegimen();
      var rankedConcerns = ['eye', 'cleanser', 'day', 'night', 'serum', 'targeted', 'toner'].filter(function(concern) {
        return products.indexOf(concern) !== -1;
      });

      if (!regimen) return null;

      var matchedProducts = rankedConcerns
        .map(function(concern) {
          return regimen.products[concern];
        })
        .filter(function(match) {
          return !!match;
        });

      // Per requirements, if there isn't a match between the users "current products,"
      // return the "cleanser" included in the matched regimen.
      var recommendation = matchedProducts[0] || regimen.products.cleanser;
      if(recommendation){
        var quizInfo = ($.cookie('quiz-info'))? JSON.parse($.cookie('quiz-info')) : {};
        if(recommendation.productCode) quizInfo['quiz-recommended-product'] = recommendation.productCode;
        if(regimen.name) quizInfo['quiz-recommended-regimen'] = regimen.name;
        $.cookie('quiz-info', JSON.stringify(quizInfo));
      }

      if (DEBUG) {
        console.log('Recommendation:', recommendation);
      }

      return _.extend({}, recommendation, { price: _.extend({}, recommendation.price, { price: currency(recommendation.price.price) }) });
    }
  });

  var AdditionalProducts = Backbone.View.extend({
    template: _.template($('#template-additional-products').html()),

    initialize: function() {
      this.regimen = null;
      this.cache = {};
      this.products = [];
    },

    render: function() {
      this.$('[data-role="additional-products"]').html(this.template({ products: this.products }));

      new Swiper('[data-role="additional-products"] .swiper-container', {
        slidesPerView: 3,
        spaceBetween: 0,
        loop: true,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        breakpoints: {
            1024: {
                slidesPerView: 3
            },
            992: {
                slidesPerView: 1
            },
            768: {
                slidesPerView: 1
            }
        }
      });
    },

    update: function(regimen) {
      var self = this;

      this.regimen = regimen;

      if (!regimen) return;

      // Use cached search results, so we don't have to re-fetch each time the inputs change.
      if (this.cache[regimen.slug]) {
        this.products = this.cache[regimen.slug];
        this.render();
      }
      else {
        var properties = regimen.ingredients
          .slice(0, 2)
          .map(function(ingredient) {
            return INGREDIENTS[ingredient].property;
          });

        console.log('update():', properties);

        var filter = properties
          .map(function(value) {
            return 'properties.tenant~ingredient eq ' + value;
          })
          .join(' or ');

        API.get('search', { filter: filter })
          .then(function(result) {
            // An array of matching products is returned in result.data.items.

            var products = result.data.items.map(function(product) {
              return _.extend({}, product, {
                propertiesMap: product.properties.reduce(function(acc, property) {
                  var data = _.extend({}, acc);

                  data[property.attributeFQN] = property.values.map(function(value) {
                    return value.stringValue || value.value;
                  }).join(', ');

                  return data;
                })
              });
            });

            console.log('update() result:', { products: products });

            self.products = products;
            self.cache[regimen.slug] = products;

            self.render();
          });
      }
    }
  });

  var App = Backbone.View.extend({
    events: {
      'click [data-role="open"]': function() {
        this.model.set('currentSection', '#expertise');
        pushState({ currentSection: '#expertise' }, '', '#expertise');
      }
    },

    initialize: function() {
      var self = this;

      var state = this.model = new State();


      state.on('change', function() {
        if (DEBUG) {
          console.log('State Changed:', state.attributes);
        }

        self.$el.toggleClass('open', state.get('currentSection') !== '#intro');
      });

      new ExpertiseSectionView({ el: this.$('[data-section="expertise"]'), model: state });
      new SkinConcernsSectionView({ el: this.$('[data-section="skin-concerns"]'), model: state });
      new SkinTypeSectionView({ el: this.$('[data-section="skin-type"]'), model: state });
      new CurrentProductSectionView({ el: this.$('[data-section="current-products"]'), model: state });
      new AboutYouSectionView({ el: this.$('[data-section="about-you"]'), model: state });

      new ResultsSectionView({ el: this.$('[data-section="results"]'), model: state });

      $(window).on('popstate', function(evt) {
        state.set(_.extend({ currentSection: '#intro' }, evt.originalEvent.state));
      });

      state.set('currentSection', '#intro');
    }
  });

  function main() {
    $('[data-widget="quiz"]').each(function(i, $el) {
      new App({ el: $el });
    });
  }

  API.get('entityList', {
        listName: 'bvsettings@mzint',
        id: API.context.site
    }).then(function(res) {
      console.log('BV', res);

      var data = res.data.items[0];
      var staging = data.environment != 'Staging' ? '' : '-stg';
      var locale = API.context.locale.replace("-", "_");
      var script = "//display" + staging + ".ugc.bazaarvoice.com/static/" + data.clientName + "/"+ data.deploymentZone +"/" + locale + "/bvapi.js";

      $.getScript(script)
        .done(function() {
          main();
        })
        .fail(function(jqxhr, settings, exception) {
          console.error('BazaarVoice failed to load.', exception);
          main();
        });
    }).catch( function( err ) {
      console.warn( err );
      console.log( 'Initializing quiz without BazaarVoice.' );

      main();
    });

  CATALOG = scrapeCatalog();
  if (DEBUG) console.log('Catalog', CATALOG);
  addRegimensProducts();

  var SUPPORTS_HISTORY = window.history && typeof window.history.pushState === 'function';
  function pushState(state, title, url) {
    if (SUPPORTS_HISTORY) {
      history.pushState(state, title, url);
    }
  }

  function setPath(target, path, value) {
    if (typeof path === 'string') {
      path = path.split('.');
    }

    if (!target) {
      target = {};
    }
    else if (typeof target !== 'object') {
      throw new Error('Invalid target type');
    }

    var result = _.extend({}, target);

    if (path.length === 0) {
      return value;
    }
    else if (path.length === 1) {
      result[path[0]] = value;

      return result;
    }
    else {
      result[path[0]] = setPath(target[path[0]], path.slice(1), value);

      return result;
    }
  }

  function mapOptions(options, key) {
    options = options || [];
    key = key || 'value';

    return options.reduce(function(acc, option) {
      var base = _.extend({}, acc);
      base[option.value] = option;

      return base;
    }, {});
  }

  // From Underscore.js 1.9.0+
  function deepGet(obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj === null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  }

  function ease(progress) {
    return -0.5 * (Math.cos(Math.PI * progress) - 1);
  }

  function scrapeCatalog() {
    var catalog = {};

    $('[data-role="regimen-product"]').each(function(i, el) {
      var include = $(el).html().trim();

      if (!include) return;

      try {
        var data = JSON.parse(include);

        data.items.forEach(function(item) {
          catalog[item.productCode] = item;
        });
      }
      catch (err) {
        console.warn('Couldn\'t parse data from...', el);
      }
    });

    return catalog;
  }

  // Scrapes the regimen product selection out of the DOM (passed from the Kibo admin)
  // and adds them to the REGIMENS object.
  function addRegimensProducts() {
    var CONFIG = loadConfig();

    if (DEBUG) console.log('CONFIG', CONFIG);

    Object.keys(REGIMENS).forEach(function(regimenKey) {
      var slug = REGIMENS[regimenKey].slug;

      Object.keys(REGIMENS[regimenKey].products).forEach(function(stepKey) {
        var configKey = slug + stepKey.charAt(0).toUpperCase() + stepKey.substr(1);

        REGIMENS[regimenKey].products[stepKey] = CONFIG[configKey] && CATALOG[CONFIG[configKey]];
      });
    });

    if (DEBUG) console.log('REGIMENS', REGIMENS);
  }

  function loadConfig() {
    try {
      return JSON.parse($('#quiz-config').html());
    }
    catch (err) {
      console.error('Failed to load quiz configuration.', err);
    }
  }

  if (DEBUG) {
    // Checks
    // 1. Each entry in the regimen table should map to a regimen object.
    Object.keys(REGIMEN_TABLE).forEach(function(row) {
      Object.keys(REGIMEN_TABLE[row]).forEach(function(col) {
        if (!REGIMENS[REGIMEN_TABLE[row][col]]) {
          console.warn('Invalid regimen in regimen-table ' + REGIMEN_TABLE[row][col] + ' at [' + row + '][' + col + ']');
        }
      });
    });

    // 2. The ingredients identified in each regimen object should map to ingredient objects.
    Object.keys(REGIMENS).forEach(function(key) {
      if (REGIMENS[key].ingredients) {
        REGIMENS[key].ingredients.forEach(function(ingredient) {
          if (!INGREDIENTS[ingredient]) {
            console.warn('Invalid ingredient ' + ingredient + ' in regimen ' + key);
          }
        });
      }
      else {
        console.warn('No ingredients defined for ' + key);
      }
    });

    // 3. Each skin concern option should map to a row in the regimen table.
    SKIN_CONCERNS.forEach(function(concern) {
      if (!REGIMEN_TABLE[concern.value]) {
        console.warn('Concern ' + concern.value + ' does not map to a row in the regimen table');
      }
      else {
        // 4. Each skin type should map to a column in the regimen table.
        SKIN_TYPES.forEach(function(type) {
          if (!REGIMEN_TABLE[concern.value][type.value]) {
            console.warn('Skin type ' + type.value + ' does not map to a column in the regimen table for concern ' + concern.value);
          }
        });
      }
    });
  }

  return App;
});
