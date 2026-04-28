(function (global) {
  // Global, product-based resource catalog.
  // Edit this file to add/remove links without touching page layout code.
  global.V3_RESOURCES_CATALOG = {
    families: [
      {
        id: 'green-roof',
        label: 'Green Roof',
        shortLabel: 'Roof',
        tagline: 'Vegetated roof and retention systems for stormwater strategy.',
        accent: 'green',
        heroImage: '../images/logo-purple-roof.png',
        capabilityLabel: 'Retention-first roof assemblies',
        emptyHint: 'Add Purple Roof, Sempergreen, detail, specification, or case-study links here.'
      },
      {
        id: 'pv',
        label: 'PV',
        shortLabel: 'PV',
        tagline: 'Solar integration and rooftop PV support systems.',
        accent: 'blue',
        heroImage: '../images/pv-cover-overeasy-image.png',
        capabilityLabel: 'Rooftop solar system collateral',
        emptyHint: 'Add Over Easy, Contec, specification, detail, and case-study links here.'
      },
      {
        id: 'fall-pro',
        label: 'Fall Protection',
        shortLabel: 'Safety',
        tagline: 'Rooftop safety and fall-protection documentation.',
        accent: 'amber',
        heroImage: '../images/fallpro-cover-diasafe-line-21-inage.jpg',
        capabilityLabel: 'Rooftop access and safety resources',
        emptyHint: 'Add DiaSafe, fall-protection specification, detail, guide, and case-study links here.'
      }
    ],
    sections: [
      { id: 'featured', label: 'Featured', description: 'Start here for the most useful client-facing collateral.' },
      { id: 'product-data', label: 'Product Data', description: 'Product data sheets and system overviews.' },
      { id: 'brochures', label: 'Brochures', description: 'Sales and client-facing overview documents.' },
      { id: 'specifications', label: 'Specifications', description: 'Specification documents and technical requirements.' },
      { id: 'details-pdf', label: 'Details: PDF', description: 'Printable detail sheets and detail packages.' },
      { id: 'details-cad', label: 'Details: CAD', description: 'CAD, DWG, or other editable detail files.' },
      { id: 'guides-manuals', label: 'Guides & Manuals', description: 'Installation guides, manuals, and implementation references.' },
      { id: 'case-studies', label: 'Case Studies', description: 'Project examples, proof points, and reference work.' },
      { id: 'tools', label: 'Tools', description: 'Product-line-specific tools and calculators.' },
      { id: 'web-links', label: 'Web Links', description: 'Official web pages and external references.' }
    ],
    items: [
      // Green Roof
      {
        id: 'gr-purple-guide-html',
        title: 'Purple-Roof Product Guide',
        href: '../../SG-product-guide-2026/source-collateral-for-projects/product-info-purple-roof/index.html',
        productFamily: 'green-roof',
        section: 'product-data',
        docType: 'Guide',
        format: 'HTML',
        audience: 'sales',
        featured: true,
        updated: '2026-04-28',
        active: true
      },
      {
        id: 'gr-purple-brochure-add',
        title: 'Add Purple Roof Brochure',
        href: '',
        productFamily: 'green-roof',
        section: 'brochures',
        docType: 'Brochure',
        format: 'PDF',
        audience: 'sales',
        note: 'Paste the current brochure URL or local PDF path here.',
        active: true
      },
      {
        id: 'gr-purple-spec-add',
        title: 'Add Green Roof Specification',
        href: '',
        productFamily: 'green-roof',
        section: 'specifications',
        docType: 'Spec',
        format: 'PDF',
        audience: 'engineering',
        note: 'Use this slot for master specs or product specifications.',
        active: true
      },
      {
        id: 'gr-purple-detail-pdf-add',
        title: 'Add Green Roof Detail Package',
        href: '',
        productFamily: 'green-roof',
        section: 'details-pdf',
        docType: 'Detail',
        format: 'PDF',
        audience: 'engineering',
        note: 'PDF detail package placeholder.',
        active: true
      },
      {
        id: 'gr-purple-detail-cad-add',
        title: 'Add Green Roof CAD Details',
        href: '',
        productFamily: 'green-roof',
        section: 'details-cad',
        docType: 'CAD',
        format: 'DWG',
        audience: 'engineering',
        note: 'CAD detail placeholder.',
        active: true
      },
      {
        id: 'gr-purple-case-study-add',
        title: 'Add Green Roof Case Studies',
        href: '',
        productFamily: 'green-roof',
        section: 'case-studies',
        docType: 'Case Study',
        format: 'PDF',
        audience: 'sales',
        note: 'Use for Purple Roof or Sempergreen project references.',
        active: true
      },
      {
        id: 'gr-sempergreen-site',
        title: 'Sempergreen Official Website',
        href: 'https://www.sempergreen.com/',
        productFamily: 'green-roof',
        section: 'web-links',
        docType: 'Web',
        format: 'Web',
        audience: 'sales',
        active: true
      },
      {
        id: 'gr-tool-hydrocad',
        title: 'HydroCAD',
        href: 'https://hydrocad.net/',
        productFamily: 'green-roof',
        section: 'tools',
        docType: 'Tool',
        format: 'Web',
        audience: 'engineering',
        note: 'Roof-related hydraulic routing and detention sizing workflows.',
        active: true
      },

      // PV
      {
        id: 'pv-product-data-add',
        title: 'Add PV Product Data',
        href: '',
        productFamily: 'pv',
        section: 'product-data',
        docType: 'Product Data',
        format: 'PDF',
        audience: 'sales',
        featured: true,
        note: 'Add Over Easy, Contec, or other PV product data links.',
        active: true
      },
      {
        id: 'pv-brochure-add',
        title: 'Add PV Brochure',
        href: '',
        productFamily: 'pv',
        section: 'brochures',
        docType: 'Brochure',
        format: 'PDF',
        audience: 'sales',
        note: 'Sales brochure placeholder.',
        active: true
      },
      {
        id: 'pv-spec-add',
        title: 'Add PV Specifications',
        href: '',
        productFamily: 'pv',
        section: 'specifications',
        docType: 'Spec',
        format: 'PDF',
        audience: 'engineering',
        note: 'Specification placeholder.',
        active: true
      },
      {
        id: 'pv-detail-pdf-add',
        title: 'Add PV Detail Package',
        href: '',
        productFamily: 'pv',
        section: 'details-pdf',
        docType: 'Detail',
        format: 'PDF',
        audience: 'engineering',
        note: 'PDF detail placeholder.',
        active: true
      },
      {
        id: 'pv-detail-cad-add',
        title: 'Add PV CAD Details',
        href: '',
        productFamily: 'pv',
        section: 'details-cad',
        docType: 'CAD',
        format: 'DWG',
        audience: 'engineering',
        note: 'CAD detail placeholder.',
        active: true
      },
      {
        id: 'pv-guide-manual-add',
        title: 'Add PV Installation Manual',
        href: '',
        productFamily: 'pv',
        section: 'guides-manuals',
        docType: 'Manual',
        format: 'PDF',
        audience: 'engineering',
        note: 'Manual or installation guide placeholder.',
        active: true
      },
      {
        id: 'pv-case-study-add',
        title: 'Add PV Case Studies',
        href: '',
        productFamily: 'pv',
        section: 'case-studies',
        docType: 'Case Study',
        format: 'PDF',
        audience: 'sales',
        note: 'Project reference placeholder.',
        active: true
      },
      {
        id: 'pv-web-link-add',
        title: 'Add PV Web Link',
        href: '',
        productFamily: 'pv',
        section: 'web-links',
        docType: 'Web',
        format: 'Web',
        audience: 'sales',
        note: 'Official product page or hosted collateral link.',
        active: true
      },

      // Fall Protection
      {
        id: 'fp-product-data-add',
        title: 'Add Fall Protection Product Data',
        href: '',
        productFamily: 'fall-pro',
        section: 'product-data',
        docType: 'Product Data',
        format: 'PDF',
        audience: 'sales',
        featured: true,
        note: 'Add DiaSafe or fall-protection product data links.',
        active: true
      },
      {
        id: 'fp-brochure-add',
        title: 'Add Fall Protection Brochure',
        href: '',
        productFamily: 'fall-pro',
        section: 'brochures',
        docType: 'Brochure',
        format: 'PDF',
        audience: 'sales',
        note: 'Sales brochure placeholder.',
        active: true
      },
      {
        id: 'fp-spec-add',
        title: 'Add Fall Protection Specifications',
        href: '',
        productFamily: 'fall-pro',
        section: 'specifications',
        docType: 'Spec',
        format: 'PDF',
        audience: 'engineering',
        note: 'Specification placeholder.',
        active: true
      },
      {
        id: 'fp-detail-pdf-add',
        title: 'Add Fall Protection Detail Package',
        href: '',
        productFamily: 'fall-pro',
        section: 'details-pdf',
        docType: 'Detail',
        format: 'PDF',
        audience: 'engineering',
        note: 'PDF detail placeholder.',
        active: true
      },
      {
        id: 'fp-detail-cad-add',
        title: 'Add Fall Protection CAD Details',
        href: '',
        productFamily: 'fall-pro',
        section: 'details-cad',
        docType: 'CAD',
        format: 'DWG',
        audience: 'engineering',
        note: 'CAD detail placeholder.',
        active: true
      },
      {
        id: 'fp-guide-manual-add',
        title: 'Add Installation Guide or Manual',
        href: '',
        productFamily: 'fall-pro',
        section: 'guides-manuals',
        docType: 'Manual',
        format: 'PDF',
        audience: 'engineering',
        note: 'Manual, installation guide, or compliance document placeholder.',
        active: true
      },
      {
        id: 'fp-case-study-add',
        title: 'Add Fall Protection Case Studies',
        href: '',
        productFamily: 'fall-pro',
        section: 'case-studies',
        docType: 'Case Study',
        format: 'PDF',
        audience: 'sales',
        note: 'Project reference placeholder.',
        active: true
      },
      {
        id: 'fp-web-link-add',
        title: 'Add Fall Protection Web Link',
        href: '',
        productFamily: 'fall-pro',
        section: 'web-links',
        docType: 'Web',
        format: 'Web',
        audience: 'sales',
        note: 'Official product page or hosted collateral link.',
        active: true
      }
    ]
  };
})(window);
