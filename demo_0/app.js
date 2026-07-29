"use strict";

const PAGE_KEYS = new Set(["home", "about", "products", "news", "news-detail", "contact"]);
const page = PAGE_KEYS.has(document.body.dataset.page) ? document.body.dataset.page : "home";

// site.json 是正式内容源；此对象只在文件缺失、损坏或字段不合法时提供非空安全回退。
const FALLBACK_SITE = {
  schemaVersion: 1,
  updatedAt: "2026-07-29T00:00:00.000Z",
  site: {
    siteName: "锐界精工企业展示网站",
    companyName: "锐界精工",
    companyNameEn: "RUIJIE PRECISION",
    logoImage: "",
    logoAlt: "锐界精工企业标志",
    logoDescription: "锐界精工红黑几何标志",
    welcomeText: "欢迎访问锐界精工企业展示网站",
    tagline: "专业家具功能五金解决方案"
  },
  navigation: [
    { key: "home", label: "首页", href: "index.html" },
    { key: "about", label: "关于我们", href: "about.html" },
    { key: "products", label: "产品中心", href: "products.html" },
    { key: "news", label: "新闻中心", href: "news.html" },
    { key: "contact", label: "联系我们", href: "contact.html" }
  ],
  hero: {
    eyebrow: "Precision · Quality · Innovation",
    title: "品质引领",
    highlight: "连接未来",
    subtitle: "专注家具功能五金 · 精密制造每一个细节",
    intro: "以稳定品质、精密工艺和持续创新，为每一次可靠连接提供支持。",
    primaryButtonText: "探索产品",
    primaryButtonLink: "products.html",
    secondaryButtonText: "了解我们",
    secondaryButtonLink: "about.html",
    image: "assets/hero-hardware.webp",
    imageAlt: "现代五金生产与家具应用场景"
  },
  homeAbout: {
    sectionEyebrow: "ABOUT RUIJIE",
    sectionTitle: "关于锐界精工",
    subtitle: "Quality leads · Connecting the future",
    title: "专于精工，",
    titleHighlight: "始于热爱",
    body: "我们是一家专注家具功能五金研发、生产与服务的现代制造企业。持续投入精密加工与自动化检测，只为让每一次连接更加稳定、可靠、长久。",
    buttonText: "进一步了解",
    buttonLink: "about.html",
    image: "assets/factory.webp",
    imageAlt: "锐界精工现代化生产车间"
  },
  productSection: {
    eyebrow: "PRODUCT CENTER",
    title: "产品中心",
    subtitle: "覆盖连接、支撑、滑动与照明的家具功能五金方案",
    categories: [
      { name: "连接件系列", nameEn: "CONNECTOR SERIES", summary: "面向柜体与板式家具的稳定连接方案。", link: "products.html", image: "assets/product-set.webp", imageAlt: "精密家具连接件系列" },
      { name: "灯光系统", nameEn: "LIGHTING SYSTEM", summary: "兼顾照明效果与便捷安装的柜内灯光系统。", link: "products.html", image: "assets/hero-hardware.webp", imageAlt: "家具柜内灯光五金系统" },
      { name: "滑轨与铰链", nameEn: "SLIDE & HINGE", summary: "顺滑、静音且耐久的开合与承托系统。", link: "products.html", image: "assets/factory.webp", imageAlt: "家具滑轨与铰链产品" }
    ]
  },
  stats: [
    { number: "12", label: "年制造经验", description: "持续积累五金制造经验" },
    { number: "38", label: "精密工序", description: "标准化生产流程" },
    { number: "100", label: "品质检测项", description: "覆盖关键性能指标" },
    { number: "24h", label: "快速服务响应", description: "及时回应客户需求" }
  ],
  aboutPage: {
    bannerTitle: "关于我们",
    bannerSubtitle: "ABOUT US",
    bannerImage: "assets/factory.webp",
    bannerImageAlt: "锐界精工生产基地",
    storyEyebrow: "OUR STORY",
    storyTitle: "以精密制造\n成就可靠连接",
    storyBody: "锐界精工是一家专注家具功能五金的研发、制造与服务企业。我们用严谨的工程思维理解每一个连接结构，用标准化制造守护每一次产品交付。\n\n从材料选择、模具开发到精密加工和质量检测，团队始终围绕稳定、耐用、易安装持续改进。",
    storyImage: "assets/factory.webp",
    storyImageAlt: "锐界精工制造团队与车间",
    manufacturingEyebrow: "MANUFACTURING",
    manufacturingTitle: "智造实力",
    manufacturingHeading: "数字化驱动精益生产",
    manufacturingBody: "自动化加工设备、标准化作业流程与全过程质量追溯共同构成稳定制造体系。",
    manufacturingButtonText: "联系我们",
    manufacturingButtonLink: "contact.html",
    manufacturingImage: "assets/product-set.webp",
    manufacturingImageAlt: "数字化五金生产设备"
  },
  advantages: {
    eyebrow: "OUR ADVANTAGES",
    title: "企业优势",
    subtitle: "用标准、技术和协同守护每一次交付",
    items: [
      { icon: "◇", name: "品质为本", description: "用标准守住每个细节，建立全过程质量追溯。" },
      { icon: "◎", name: "持续创新", description: "用技术回应真实需求，持续优化结构与工艺。" },
      { icon: "△", name: "客户至上", description: "用专业创造长期价值，提供清晰及时的支持。" },
      { icon: "✦", name: "协同共进", description: "用信任凝聚团队力量，与客户和伙伴共同成长。" }
    ]
  },
  process: {
    eyebrow: "SERVICE PROCESS",
    title: "服务流程",
    subtitle: "从需求沟通到持续服务，每一步清晰可追踪",
    items: [
      { name: "需求沟通", description: "了解应用场景、尺寸、性能与交付要求。" },
      { name: "方案确认", description: "完成产品选型、样品验证与技术细节确认。" },
      { name: "生产交付", description: "按标准组织制造、检测、包装与进度反馈。" },
      { name: "售后支持", description: "提供安装指导、问题响应和持续改进服务。" }
    ]
  },
  cases: {
    eyebrow: "PROJECT CASES",
    title: "案例展示",
    subtitle: "可靠五金服务多元家具与空间场景",
    items: [
      { name: "定制家居连接系统", summary: "为全屋定制项目提供标准化连接件组合。", details: "通过统一规格与快装结构，帮助现场提升装配效率并保持稳定外观。", link: "contact.html", image: "assets/product-set.webp", imageAlt: "定制家居五金连接系统案例" },
      { name: "办公家具静音升级", summary: "面向高频使用空间优化滑轨与铰链体验。", details: "结合承重、耐久与静音要求完成选型，并提供安装调试建议。", link: "contact.html", image: "assets/hero-hardware.webp", imageAlt: "办公家具滑轨铰链应用案例" },
      { name: "商业空间柜内照明", summary: "将线性灯光与感应控制融入展示柜体。", details: "兼顾布线、散热和维护便利性，形成整洁一致的照明效果。", link: "contact.html", image: "assets/factory.webp", imageAlt: "商业展示柜内灯光系统案例" }
    ]
  },
  productsPage: {
    bannerTitle: "产品中心",
    bannerSubtitle: "PRODUCT CENTER",
    bannerImage: "assets/hero-hardware.webp",
    bannerImageAlt: "家具五金产品组合",
    categoryTitle: "产品分类",
    allCategoryLabel: "全部产品",
    viewDetailsText: "查看详情",
    categories: ["家具连接件", "灯光照明系统", "滑轨系列", "铰链系列"],
    products: [
      { name: "精密偏心连接件", category: "家具连接件", summary: "适用于板式家具的高强度隐蔽连接。", details: "结构稳定，安装便捷，适配多种柜体应用。", link: "contact.html", image: "assets/product-set.webp", imageAlt: "精密偏心家具连接件" },
      { name: "静音缓冲铰链", category: "铰链系列", summary: "让柜门开合轻柔顺畅。", details: "集成缓冲结构，兼顾耐久性能与安装调节效率。", link: "contact.html", image: "assets/product-set.webp", imageAlt: "静音缓冲家具铰链" },
      { name: "全拉出隐藏滑轨", category: "滑轨系列", summary: "隐藏安装并充分利用抽屉空间。", details: "顺滑承托，支持多向调节，适合中高端柜体。", link: "contact.html", image: "assets/product-set.webp", imageAlt: "全拉出隐藏式抽屉滑轨" }
    ]
  },
  news: {
    homeEyebrow: "NEWS CENTER",
    homeTitle: "新闻动态",
    bannerTitle: "新闻中心",
    bannerSubtitle: "NEWS CENTER",
    bannerImage: "assets/factory.webp",
    bannerImageAlt: "锐界精工企业新闻",
    listEyebrow: "LATEST INFORMATION",
    listTitle: "企业资讯",
    readMoreText: "阅读更多",
    detailBannerTitle: "资讯详情",
    detailBannerSubtitle: "NEWS DETAIL",
    sourceLabel: "锐界精工",
    items: [
      { date: "2026-06-18", title: "企业精益生产体系完成新一轮升级", summary: "围绕产品一致性与交付效率，生产现场完成流程再造与检测节点优化。", body: "近日，锐界精工精益生产体系新一轮升级正式完成。\n\n团队进一步细化了首件确认、过程巡检和成品抽检规则。\n\n未来，公司将继续围绕提升一次合格率展开改善。", link: "news-detail.html?id=0", image: "assets/factory.webp", imageAlt: "精益生产现场与质量检测", detailImage: "assets/factory.webp", detailImageAlt: "锐界精工生产流程升级现场" },
      { date: "2026-06-08", title: "新品功能五金系列正式发布", summary: "面向现代家居场景，推出兼顾结构性能与安装效率的新一代产品方案。", body: "锐界精工新一代功能五金系列正式发布。\n\n新品充分考虑安装效率与使用寿命。\n\n公司同步完善了选型资料与技术支持服务。", link: "news-detail.html?id=1", image: "assets/product-set.webp", imageAlt: "新一代家具功能五金产品", detailImage: "assets/product-set.webp", detailImageAlt: "家具功能五金新品组合" },
      { date: "2026-05-26", title: "绿色制造：从材料到工艺的持续改善", summary: "推进能源管理与材料利用率提升，让可靠制造与环境责任同行。", body: "绿色制造是贯穿产品全生命周期的持续改善。\n\n团队逐步降低生产过程中的能源与资源消耗。\n\n公司将持续记录关键环境指标。", link: "news-detail.html?id=2", image: "assets/hero-hardware.webp", imageAlt: "绿色五金制造与材料管理", detailImage: "assets/factory.webp", detailImageAlt: "节能高效的五金制造车间" }
    ]
  },
  contact: {
    bannerTitle: "联系我们",
    bannerSubtitle: "CONTACT US",
    bannerImage: "assets/factory.webp",
    bannerImageAlt: "锐界精工联系与服务",
    eyebrow: "GET IN TOUCH",
    title: "期待与您建立联系",
    phone: "400-000-0000",
    wechat: "Ruijie-Service",
    email: "hello@example.com",
    address: "华南某工业园创新大道 88 号",
    businessHours: "周一至周六 08:30—17:30",
    mapLink: "https://maps.google.com/",
    mapLabel: "查看地图",
    formNamePlaceholder: "您的姓名",
    formPhonePlaceholder: "联系电话",
    formEmailPlaceholder: "电子邮箱",
    formCompanyPlaceholder: "公司名称",
    formMessagePlaceholder: "请输入您的需求",
    formSubmitText: "提交留言",
    formSuccessText: "提交成功，我们会尽快与您联系"
  },
  footer: {
    description: "专注于家具功能五金的研发与制造，以稳定品质、精密工艺和持续创新，为居住空间提供可靠连接。",
    quickLinksTitle: "快速导航",
    productLinksTitle: "产品系列",
    contactTitle: "联系我们",
    footerText: "本站为脱敏前端设计演示，所有品牌与联系信息均为虚构。",
    copyright: "© 2026 锐界精工"
  },
  theme: { primaryColor: "#df1838", secondaryColor: "#18191b", buttonColor: "#df1838" },
  seo: {
    title: "锐界精工｜家具功能五金解决方案",
    description: "锐界精工专注家具连接件、滑轨、铰链与柜内照明等功能五金的研发、制造和服务。",
    keywords: "家具五金,功能五金,连接件,滑轨,铰链,柜内照明"
  }
};

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};

function cleanText(value, fallback, maxLength = 500, allowEmpty = false) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
  if (!cleaned && !allowEmpty) return fallback;
  return cleaned.slice(0, maxLength);
}

function cleanKey(value, fallback) {
  const key = cleanText(value, fallback, 40);
  return /^[a-z0-9-]+$/i.test(key) ? key : fallback;
}

function cleanHex(value, fallback) {
  const color = cleanText(value, fallback, 7);
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function cleanDate(value, fallback) {
  const candidate = cleanText(value, fallback, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return fallback;
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate ? fallback : candidate;
}

function cleanDateTime(value, fallback) {
  const candidate = cleanText(value, fallback, 40);
  return Number.isNaN(Date.parse(candidate)) ? fallback : candidate;
}

function isSafeImagePath(value) {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  if (!candidate || candidate.includes("\\") || candidate.includes("?") || candidate.includes("#")) return false;
  let decoded;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return false;
  }
  if (decoded !== candidate || decoded.split("/").some(part => part === "." || part === ".." || !part)) return false;
  return /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(candidate);
}

function cleanImage(value, fallback, allowEmpty = false) {
  if (allowEmpty && value === "") return "";
  return isSafeImagePath(value) ? value : fallback;
}

function isSafeLink(value) {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  if (!candidate || candidate.startsWith("//") || /[\u0000-\u001f\u007f]/.test(candidate)) return false;
  let url;
  try {
    url = new URL(candidate, document.baseURI);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "mailto:" || url.protocol === "tel:") return true;
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(candidate);
  if (hasExplicitScheme) return true;
  const siteBase = new URL("./", document.baseURI);
  return url.origin === siteBase.origin && url.pathname.startsWith(siteBase.pathname);
}

function cleanLink(value, fallback) {
  const candidate = cleanText(value, fallback, 1000);
  return isSafeLink(candidate) ? candidate : fallback;
}

function mapObjects(value, fallback, mapper, maxItems = 60, allowEmpty = true) {
  const source = Array.isArray(value) ? value.slice(0, maxItems) : fallback;
  if (!source.length && !allowEmpty) return fallback.map((item, index) => mapper(item, item, index));
  return source.map((item, index) => {
    const base = fallback[Math.min(index, fallback.length - 1)] || fallback[0] || {};
    return mapper(asObject(item), base, index);
  });
}

function mapStrings(value, fallback, maxItems = 30, allowEmpty = false) {
  const source = Array.isArray(value) ? value.slice(0, maxItems) : fallback;
  const mapped = source.map((item, index) => cleanText(item, fallback[index] || fallback[0], 100));
  return mapped.length || allowEmpty ? mapped : [...fallback];
}

function normalizeSite(input) {
  const root = asObject(input);
  const defaults = FALLBACK_SITE;
  const rawSite = asObject(root.site);
  const rawHero = asObject(root.hero);
  const rawHomeAbout = asObject(root.homeAbout);
  const rawProductSection = asObject(root.productSection);
  const rawAbout = asObject(root.aboutPage);
  const rawAdvantages = asObject(root.advantages);
  const rawProcess = asObject(root.process);
  const rawCases = asObject(root.cases);
  const rawProducts = asObject(root.productsPage);
  const rawNews = asObject(root.news);
  const rawContact = asObject(root.contact);
  const rawFooter = asObject(root.footer);
  const rawTheme = asObject(root.theme);
  const rawSeo = asObject(root.seo);

  const navigation = mapObjects(root.navigation, defaults.navigation, (item, base) => ({
    key: cleanKey(item.key, base.key),
    label: cleanText(item.label, base.label, 40),
    href: cleanLink(item.href, base.href)
  }), 12, false);

  const productCategories = mapStrings(rawProducts.categories, defaults.productsPage.categories, 20, false);
  const productItems = mapObjects(rawProducts.products, defaults.productsPage.products, (item, base) => {
    const requestedCategory = cleanText(item.category, base.category, 100);
    return {
      name: cleanText(item.name, base.name, 120),
      category: productCategories.includes(requestedCategory) ? requestedCategory : productCategories[0],
      summary: cleanText(item.summary, base.summary, 500),
      details: cleanText(item.details, base.details, 3000),
      link: cleanLink(item.link, base.link),
      image: cleanImage(item.image, base.image),
      imageAlt: cleanText(item.imageAlt, base.imageAlt, 200)
    };
  }, 100, true);

  const normalized = {
    schemaVersion: Number.isInteger(root.schemaVersion) && root.schemaVersion > 0 ? root.schemaVersion : defaults.schemaVersion,
    updatedAt: cleanDateTime(root.updatedAt, defaults.updatedAt),
    site: {
      siteName: cleanText(rawSite.siteName, defaults.site.siteName, 120),
      companyName: cleanText(rawSite.companyName, defaults.site.companyName, 100),
      companyNameEn: cleanText(rawSite.companyNameEn, defaults.site.companyNameEn, 120),
      logoImage: cleanImage(rawSite.logoImage, defaults.site.logoImage, true),
      logoAlt: cleanText(rawSite.logoAlt, defaults.site.logoAlt, 200),
      logoDescription: cleanText(rawSite.logoDescription, defaults.site.logoDescription, 300),
      welcomeText: cleanText(rawSite.welcomeText, defaults.site.welcomeText, 200),
      tagline: cleanText(rawSite.tagline, defaults.site.tagline, 200)
    },
    navigation,
    hero: {
      eyebrow: cleanText(rawHero.eyebrow, defaults.hero.eyebrow, 120),
      title: cleanText(rawHero.title, defaults.hero.title, 160),
      highlight: cleanText(rawHero.highlight, defaults.hero.highlight, 160),
      subtitle: cleanText(rawHero.subtitle, defaults.hero.subtitle, 300),
      intro: cleanText(rawHero.intro, defaults.hero.intro, 800),
      primaryButtonText: cleanText(rawHero.primaryButtonText, defaults.hero.primaryButtonText, 60),
      primaryButtonLink: cleanLink(rawHero.primaryButtonLink, defaults.hero.primaryButtonLink),
      secondaryButtonText: cleanText(rawHero.secondaryButtonText, defaults.hero.secondaryButtonText, 60),
      secondaryButtonLink: cleanLink(rawHero.secondaryButtonLink, defaults.hero.secondaryButtonLink),
      image: cleanImage(rawHero.image, defaults.hero.image),
      imageAlt: cleanText(rawHero.imageAlt, defaults.hero.imageAlt, 200)
    },
    homeAbout: {
      sectionEyebrow: cleanText(rawHomeAbout.sectionEyebrow, defaults.homeAbout.sectionEyebrow, 120),
      sectionTitle: cleanText(rawHomeAbout.sectionTitle, defaults.homeAbout.sectionTitle, 120),
      subtitle: cleanText(rawHomeAbout.subtitle, defaults.homeAbout.subtitle, 300),
      title: cleanText(rawHomeAbout.title, defaults.homeAbout.title, 160),
      titleHighlight: cleanText(rawHomeAbout.titleHighlight, defaults.homeAbout.titleHighlight, 160),
      body: cleanText(rawHomeAbout.body, defaults.homeAbout.body, 5000),
      buttonText: cleanText(rawHomeAbout.buttonText, defaults.homeAbout.buttonText, 60),
      buttonLink: cleanLink(rawHomeAbout.buttonLink, defaults.homeAbout.buttonLink),
      image: cleanImage(rawHomeAbout.image, defaults.homeAbout.image),
      imageAlt: cleanText(rawHomeAbout.imageAlt, defaults.homeAbout.imageAlt, 200)
    },
    productSection: {
      eyebrow: cleanText(rawProductSection.eyebrow, defaults.productSection.eyebrow, 120),
      title: cleanText(rawProductSection.title, defaults.productSection.title, 120),
      subtitle: cleanText(rawProductSection.subtitle, defaults.productSection.subtitle, 300),
      categories: mapObjects(rawProductSection.categories, defaults.productSection.categories, (item, base) => ({
        name: cleanText(item.name, base.name, 100),
        nameEn: cleanText(item.nameEn, base.nameEn, 120),
        summary: cleanText(item.summary, base.summary, 500),
        link: cleanLink(item.link, base.link),
        image: cleanImage(item.image, base.image),
        imageAlt: cleanText(item.imageAlt, base.imageAlt, 200)
      }), 12, true)
    },
    stats: mapObjects(root.stats, defaults.stats, (item, base) => ({
      number: cleanText(item.number, base.number, 30),
      label: cleanText(item.label, base.label, 100),
      description: cleanText(item.description, base.description, 300)
    }), 12, true),
    aboutPage: {
      bannerTitle: cleanText(rawAbout.bannerTitle, defaults.aboutPage.bannerTitle, 120),
      bannerSubtitle: cleanText(rawAbout.bannerSubtitle, defaults.aboutPage.bannerSubtitle, 120),
      bannerImage: cleanImage(rawAbout.bannerImage, defaults.aboutPage.bannerImage),
      bannerImageAlt: cleanText(rawAbout.bannerImageAlt, defaults.aboutPage.bannerImageAlt, 200),
      storyEyebrow: cleanText(rawAbout.storyEyebrow, defaults.aboutPage.storyEyebrow, 120),
      storyTitle: cleanText(rawAbout.storyTitle, defaults.aboutPage.storyTitle, 300),
      storyBody: cleanText(rawAbout.storyBody, defaults.aboutPage.storyBody, 8000),
      storyImage: cleanImage(rawAbout.storyImage, defaults.aboutPage.storyImage),
      storyImageAlt: cleanText(rawAbout.storyImageAlt, defaults.aboutPage.storyImageAlt, 200),
      manufacturingEyebrow: cleanText(rawAbout.manufacturingEyebrow, defaults.aboutPage.manufacturingEyebrow, 120),
      manufacturingTitle: cleanText(rawAbout.manufacturingTitle, defaults.aboutPage.manufacturingTitle, 120),
      manufacturingHeading: cleanText(rawAbout.manufacturingHeading, defaults.aboutPage.manufacturingHeading, 200),
      manufacturingBody: cleanText(rawAbout.manufacturingBody, defaults.aboutPage.manufacturingBody, 5000),
      manufacturingButtonText: cleanText(rawAbout.manufacturingButtonText, defaults.aboutPage.manufacturingButtonText, 60),
      manufacturingButtonLink: cleanLink(rawAbout.manufacturingButtonLink, defaults.aboutPage.manufacturingButtonLink),
      manufacturingImage: cleanImage(rawAbout.manufacturingImage, defaults.aboutPage.manufacturingImage),
      manufacturingImageAlt: cleanText(rawAbout.manufacturingImageAlt, defaults.aboutPage.manufacturingImageAlt, 200)
    },
    advantages: {
      eyebrow: cleanText(rawAdvantages.eyebrow, defaults.advantages.eyebrow, 120),
      title: cleanText(rawAdvantages.title, defaults.advantages.title, 120),
      subtitle: cleanText(rawAdvantages.subtitle, defaults.advantages.subtitle, 300),
      items: mapObjects(rawAdvantages.items, defaults.advantages.items, (item, base) => ({
        icon: cleanText(item.icon, base.icon, 12),
        name: cleanText(item.name, base.name, 100),
        description: cleanText(item.description, base.description, 600)
      }), 12, true)
    },
    process: {
      eyebrow: cleanText(rawProcess.eyebrow, defaults.process.eyebrow, 120),
      title: cleanText(rawProcess.title, defaults.process.title, 120),
      subtitle: cleanText(rawProcess.subtitle, defaults.process.subtitle, 300),
      items: mapObjects(rawProcess.items, defaults.process.items, (item, base) => ({
        name: cleanText(item.name, base.name, 100),
        description: cleanText(item.description, base.description, 600)
      }), 12, true)
    },
    cases: {
      eyebrow: cleanText(rawCases.eyebrow, defaults.cases.eyebrow, 120),
      title: cleanText(rawCases.title, defaults.cases.title, 120),
      subtitle: cleanText(rawCases.subtitle, defaults.cases.subtitle, 300),
      items: mapObjects(rawCases.items, defaults.cases.items, (item, base) => ({
        name: cleanText(item.name, base.name, 120),
        summary: cleanText(item.summary, base.summary, 600),
        details: cleanText(item.details, base.details, 3000),
        link: cleanLink(item.link, base.link),
        image: cleanImage(item.image, base.image),
        imageAlt: cleanText(item.imageAlt, base.imageAlt, 200)
      }), 24, true)
    },
    productsPage: {
      bannerTitle: cleanText(rawProducts.bannerTitle, defaults.productsPage.bannerTitle, 120),
      bannerSubtitle: cleanText(rawProducts.bannerSubtitle, defaults.productsPage.bannerSubtitle, 120),
      bannerImage: cleanImage(rawProducts.bannerImage, defaults.productsPage.bannerImage),
      bannerImageAlt: cleanText(rawProducts.bannerImageAlt, defaults.productsPage.bannerImageAlt, 200),
      categoryTitle: cleanText(rawProducts.categoryTitle, defaults.productsPage.categoryTitle, 100),
      allCategoryLabel: cleanText(rawProducts.allCategoryLabel, defaults.productsPage.allCategoryLabel, 100),
      viewDetailsText: cleanText(rawProducts.viewDetailsText, defaults.productsPage.viewDetailsText, 80),
      categories: productCategories,
      products: productItems
    },
    news: {
      homeEyebrow: cleanText(rawNews.homeEyebrow, defaults.news.homeEyebrow, 120),
      homeTitle: cleanText(rawNews.homeTitle, defaults.news.homeTitle, 120),
      bannerTitle: cleanText(rawNews.bannerTitle, defaults.news.bannerTitle, 120),
      bannerSubtitle: cleanText(rawNews.bannerSubtitle, defaults.news.bannerSubtitle, 120),
      bannerImage: cleanImage(rawNews.bannerImage, defaults.news.bannerImage),
      bannerImageAlt: cleanText(rawNews.bannerImageAlt, defaults.news.bannerImageAlt, 200),
      listEyebrow: cleanText(rawNews.listEyebrow, defaults.news.listEyebrow, 120),
      listTitle: cleanText(rawNews.listTitle, defaults.news.listTitle, 120),
      readMoreText: cleanText(rawNews.readMoreText, defaults.news.readMoreText, 80),
      detailBannerTitle: cleanText(rawNews.detailBannerTitle, defaults.news.detailBannerTitle, 120),
      detailBannerSubtitle: cleanText(rawNews.detailBannerSubtitle, defaults.news.detailBannerSubtitle, 120),
      sourceLabel: cleanText(rawNews.sourceLabel, defaults.news.sourceLabel, 120),
      items: mapObjects(rawNews.items, defaults.news.items, (item, base, index) => ({
        date: cleanDate(item.date, base.date),
        title: cleanText(item.title, base.title, 220),
        summary: cleanText(item.summary, base.summary, 1000),
        body: cleanText(item.body, base.body, 20000),
        link: cleanLink(item.link, `news-detail.html?id=${index}`),
        image: cleanImage(item.image, base.image),
        imageAlt: cleanText(item.imageAlt, base.imageAlt, 200),
        detailImage: cleanImage(item.detailImage, base.detailImage),
        detailImageAlt: cleanText(item.detailImageAlt, base.detailImageAlt, 200)
      }), 100, false)
    },
    contact: {
      bannerTitle: cleanText(rawContact.bannerTitle, defaults.contact.bannerTitle, 120),
      bannerSubtitle: cleanText(rawContact.bannerSubtitle, defaults.contact.bannerSubtitle, 120),
      bannerImage: cleanImage(rawContact.bannerImage, defaults.contact.bannerImage),
      bannerImageAlt: cleanText(rawContact.bannerImageAlt, defaults.contact.bannerImageAlt, 200),
      eyebrow: cleanText(rawContact.eyebrow, defaults.contact.eyebrow, 120),
      title: cleanText(rawContact.title, defaults.contact.title, 160),
      phone: cleanText(rawContact.phone, defaults.contact.phone, 80),
      wechat: cleanText(rawContact.wechat, defaults.contact.wechat, 100),
      email: cleanText(rawContact.email, defaults.contact.email, 200),
      address: cleanText(rawContact.address, defaults.contact.address, 400),
      businessHours: cleanText(rawContact.businessHours, defaults.contact.businessHours, 200),
      mapLink: cleanLink(rawContact.mapLink, defaults.contact.mapLink),
      mapLabel: cleanText(rawContact.mapLabel, defaults.contact.mapLabel, 100),
      formNamePlaceholder: cleanText(rawContact.formNamePlaceholder, defaults.contact.formNamePlaceholder, 100),
      formPhonePlaceholder: cleanText(rawContact.formPhonePlaceholder, defaults.contact.formPhonePlaceholder, 100),
      formEmailPlaceholder: cleanText(rawContact.formEmailPlaceholder, defaults.contact.formEmailPlaceholder, 100),
      formCompanyPlaceholder: cleanText(rawContact.formCompanyPlaceholder, defaults.contact.formCompanyPlaceholder, 100),
      formMessagePlaceholder: cleanText(rawContact.formMessagePlaceholder, defaults.contact.formMessagePlaceholder, 160),
      formSubmitText: cleanText(rawContact.formSubmitText, defaults.contact.formSubmitText, 80),
      formSuccessText: cleanText(rawContact.formSuccessText, defaults.contact.formSuccessText, 300)
    },
    footer: {
      description: cleanText(rawFooter.description, defaults.footer.description, 1000),
      quickLinksTitle: cleanText(rawFooter.quickLinksTitle, defaults.footer.quickLinksTitle, 100),
      productLinksTitle: cleanText(rawFooter.productLinksTitle, defaults.footer.productLinksTitle, 100),
      contactTitle: cleanText(rawFooter.contactTitle, defaults.footer.contactTitle, 100),
      footerText: cleanText(rawFooter.footerText, defaults.footer.footerText, 500),
      copyright: cleanText(rawFooter.copyright, defaults.footer.copyright, 200)
    },
    theme: {
      primaryColor: cleanHex(rawTheme.primaryColor, defaults.theme.primaryColor),
      secondaryColor: cleanHex(rawTheme.secondaryColor, defaults.theme.secondaryColor),
      buttonColor: cleanHex(rawTheme.buttonColor, defaults.theme.buttonColor)
    },
    seo: {
      title: cleanText(rawSeo.title, defaults.seo.title, 180),
      description: cleanText(rawSeo.description, defaults.seo.description, 500),
      keywords: cleanText(rawSeo.keywords, defaults.seo.keywords, 500)
    }
  };

  return normalized;
}

function element(tagName, className, textValue) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (textValue !== undefined) node.textContent = textValue;
  return node;
}

function setAnchorDestination(anchor, href) {
  const destination = isSafeLink(href) ? href : "index.html";
  anchor.href = destination;
  const parsed = new URL(destination, document.baseURI);
  if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin !== location.origin) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
}

function linkElement(href, className, textValue) {
  const anchor = element("a", className, textValue);
  setAnchorDestination(anchor, href);
  return anchor;
}

function imageElement(src, alt, className, options = {}) {
  const image = element("img", className);
  image.src = isSafeImagePath(src) ? src : "assets/factory.webp";
  image.alt = cleanText(alt, "网站内容图片", 200);
  image.decoding = "async";
  if (options.eager) {
    image.loading = "eager";
    image.fetchPriority = "high";
  } else {
    image.loading = "lazy";
  }
  const fallback = isSafeImagePath(options.fallback) ? options.fallback : "assets/factory.webp";
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") {
      image.hidden = true;
      return;
    }
    image.dataset.fallbackApplied = "true";
    image.src = fallback;
  });
  return image;
}

function brandElement(data) {
  const brand = linkElement("index.html", "brand");
  brand.setAttribute("aria-label", `${data.site.companyName}，${data.site.logoDescription}`);
  if (data.site.logoImage) {
    brand.append(imageElement(data.site.logoImage, data.site.logoAlt, "brand-logo", { eager: true }));
  } else {
    const mark = element("i", "brand-mark");
    mark.setAttribute("aria-hidden", "true");
    brand.append(mark);
  }
  const name = element("span", "brand-name", data.site.companyName);
  name.append(element("small", "", data.site.companyNameEn));
  brand.append(name);
  return brand;
}

function createHeader(data) {
  const fragment = document.createDocumentFragment();
  const topbar = element("div", "topbar");
  const topContainer = element("div", "container");
  topContainer.append(element("span", "", data.site.welcomeText));
  const topLinks = element("div", "top-links");
  topLinks.append(element("span", "", data.site.tagline));
  topLinks.append(element("span", "", `服务热线：${data.contact.phone}`));
  topContainer.append(topLinks);
  topbar.append(topContainer);

  const header = element("header", "header");
  const container = element("div", "container");
  container.append(brandElement(data));
  const nav = element("nav", "nav");
  nav.id = "nav";
  nav.setAttribute("aria-label", "主导航");
  data.navigation.forEach(item => {
    const navLink = linkElement(item.href, item.key === page ? "active" : "", item.label);
    if (item.key === page || (page === "news-detail" && item.key === "news")) navLink.setAttribute("aria-current", "page");
    nav.append(navLink);
  });
  container.append(nav);
  const menuButton = element("button", "menu-btn");
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", "打开导航");
  menuButton.setAttribute("aria-controls", "nav");
  menuButton.setAttribute("aria-expanded", "false");
  const menuLine = element("i");
  menuLine.setAttribute("aria-hidden", "true");
  menuButton.append(menuLine);
  container.append(menuButton);
  header.append(container);
  fragment.append(topbar, header);
  return fragment;
}

function createFooter(data) {
  const fragment = document.createDocumentFragment();
  const footer = element("footer", "footer");
  const grid = element("div", "container footer-grid");

  const company = element("div");
  company.append(brandElement(data), element("p", "", data.footer.description));
  grid.append(company);

  const quick = element("div");
  quick.append(element("h3", "", data.footer.quickLinksTitle));
  const quickLinks = element("div", "footer-links");
  data.navigation.forEach(item => quickLinks.append(linkElement(item.href, "", item.label)));
  quick.append(quickLinks);
  grid.append(quick);

  const products = element("div");
  products.append(element("h3", "", data.footer.productLinksTitle));
  const productLinks = element("div", "footer-links");
  data.productsPage.categories.forEach(category => productLinks.append(linkElement("products.html", "", category)));
  products.append(productLinks);
  grid.append(products);

  const contact = element("div");
  contact.append(element("h3", "", data.footer.contactTitle));
  const contactLines = element("p");
  [
    `地址：${data.contact.address}`,
    `电话：${data.contact.phone}`,
    `微信：${data.contact.wechat}`,
    `邮箱：${data.contact.email}`,
    `工作时间：${data.contact.businessHours}`
  ].forEach((line, index, lines) => {
    contactLines.append(document.createTextNode(line));
    if (index < lines.length - 1) contactLines.append(document.createElement("br"));
  });
  contact.append(contactLines);
  grid.append(contact);
  footer.append(grid);

  const bottom = element("div", "footer-bottom");
  const bottomContainer = element("div", "container");
  bottomContainer.append(document.createTextNode(`${data.footer.copyright} · ${data.footer.footerText}`));
  const updateTime = element("time", "updated-at", `内容更新：${data.updatedAt.slice(0, 10)}`);
  updateTime.dateTime = data.updatedAt;
  bottomContainer.append(updateTime);
  bottom.append(bottomContainer);
  footer.append(bottom);

  const toast = element("div", "toast", data.contact.formSuccessText);
  toast.id = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  fragment.append(footer, toast);
  return fragment;
}

function sectionHead(eyebrow, title, subtitle = "") {
  const head = element("div", "section-head");
  head.append(element("div", "en", eyebrow), element("h2", "", title));
  const dash = element("i", "dash");
  dash.setAttribute("aria-hidden", "true");
  head.append(dash);
  if (subtitle) head.append(element("p", "section-subtitle", subtitle));
  return head;
}

function learnLink(href, label, className = "learn") {
  const anchor = linkElement(href, className);
  anchor.append(document.createTextNode(label));
  const arrow = element("i");
  arrow.setAttribute("aria-hidden", "true");
  anchor.append(arrow);
  return anchor;
}

function addSubHero(main, title, subtitle, image, imageAlt, extraClass = "") {
  const hero = element("section", `sub-hero${extraClass ? ` ${extraClass}` : ""}`);
  hero.append(imageElement(image, imageAlt, "sub-hero-media", { eager: true, fallback: image }));
  const container = element("div", "container");
  container.append(element("h1", "", title), element("p", "", subtitle));
  hero.append(container);
  const breadcrumb = element("div", "container breadcrumb");
  breadcrumb.append(linkElement("index.html", "", "首页"), document.createTextNode("　/　"), element("b", "", title));
  main.append(hero, breadcrumb);
}

function splitParagraphs(value) {
  return value.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}

function multilineHeading(value, className = "") {
  const heading = element("h2", className);
  value.split("\n").forEach((line, index) => {
    if (index) heading.append(document.createElement("br"));
    heading.append(document.createTextNode(line));
  });
  return heading;
}

function createNewsCards(data, count = 3) {
  const grid = element("div", "news-grid");
  data.news.items.slice(0, count).forEach((item, index) => {
    const card = linkElement(item.link, "news-card");
    const cover = element("div", "news-cover");
    cover.append(imageElement(item.image, item.imageAlt, "media-img", { fallback: "assets/factory.webp" }));
    const dateTag = element("time", "date-tag", item.date.slice(8, 10));
    dateTag.dateTime = item.date;
    dateTag.append(element("small", "", item.date.slice(0, 7).replace("-", " / ")));
    cover.append(dateTag);
    const body = element("div", "news-body");
    body.append(element("h3", "", item.title), element("p", "", item.summary));
    card.append(cover, body);
    grid.append(card);
  });
  return grid;
}

function createProcessSection(data) {
  if (!data.process.items.length) return null;
  const section = element("section", "section process-section");
  const container = element("div", "container");
  container.append(sectionHead(data.process.eyebrow, data.process.title, data.process.subtitle));
  const grid = element("div", "process-grid");
  data.process.items.forEach((item, index) => {
    const step = element("article", "process-step");
    step.append(element("div", "process-number", String(index + 1).padStart(2, "0")));
    step.append(element("h3", "", item.name), element("p", "", item.description));
    grid.append(step);
  });
  container.append(grid);
  section.append(container);
  return section;
}

function createCasesSection(data) {
  if (!data.cases.items.length) return null;
  const section = element("section", "section gray case-section");
  const container = element("div", "container");
  container.append(sectionHead(data.cases.eyebrow, data.cases.title, data.cases.subtitle));
  const grid = element("div", "case-grid");
  data.cases.items.forEach(item => {
    const card = linkElement(item.link, "case-card");
    const imageWrap = element("div", "case-image");
    imageWrap.append(imageElement(item.image, item.imageAlt, "media-img", { fallback: "assets/factory.webp" }));
    const body = element("div", "case-body");
    body.append(element("h3", "", item.name), element("p", "case-summary", item.summary), element("p", "case-details", item.details));
    card.append(imageWrap, body);
    grid.append(card);
  });
  container.append(grid);
  section.append(container);
  return section;
}

function createHome(data) {
  const main = element("main");
  const hero = element("section", "hero");
  hero.append(imageElement(data.hero.image, data.hero.imageAlt, "hero-media", { eager: true, fallback: "assets/hero-hardware.webp" }));
  const heroContainer = element("div", "container");
  const copy = element("div", "hero-copy");
  copy.append(element("div", "eyebrow", data.hero.eyebrow));
  const title = element("h1");
  title.append(document.createTextNode(data.hero.title), document.createElement("br"), element("em", "", data.hero.highlight));
  copy.append(title, element("p", "hero-subtitle", data.hero.subtitle), element("p", "hero-intro", data.hero.intro));
  copy.append(linkElement(data.hero.primaryButtonLink, "btn", data.hero.primaryButtonText));
  copy.append(linkElement(data.hero.secondaryButtonLink, "btn outline", data.hero.secondaryButtonText));
  heroContainer.append(copy);
  hero.append(heroContainer);
  main.append(hero);

  const aboutSection = element("section", "section");
  const aboutContainer = element("div", "container");
  aboutContainer.append(sectionHead(data.homeAbout.sectionEyebrow, data.homeAbout.sectionTitle));
  const introGrid = element("div", "intro-grid");
  const introImage = element("div", "intro-image");
  introImage.append(imageElement(data.homeAbout.image, data.homeAbout.imageAlt, "media-img", { fallback: "assets/factory.webp" }));
  const introCopy = element("div", "intro-copy");
  introCopy.append(element("div", "sub", data.homeAbout.subtitle));
  const introTitle = element("h3", "", data.homeAbout.title);
  introTitle.append(element("span", "", data.homeAbout.titleHighlight));
  introCopy.append(introTitle, element("p", "", data.homeAbout.body), learnLink(data.homeAbout.buttonLink, data.homeAbout.buttonText));
  introGrid.append(introImage, introCopy);
  aboutContainer.append(introGrid);
  aboutSection.append(aboutContainer);
  main.append(aboutSection);

  const productSection = element("section", "section gray");
  const productContainer = element("div", "container");
  productContainer.append(sectionHead(data.productSection.eyebrow, data.productSection.title, data.productSection.subtitle));
  const categoryGrid = element("div", "category-grid");
  data.productSection.categories.forEach((item, index) => {
    const card = linkElement(item.link, "category-card");
    card.append(imageElement(item.image, item.imageAlt, "media-img", { fallback: "assets/product-set.webp" }));
    const info = element("div", "category-info");
    info.append(element("h3", "", item.name), element("p", "category-en", item.nameEn), element("p", "category-summary", item.summary), element("b", "", String(index + 1).padStart(2, "0")));
    card.append(info);
    categoryGrid.append(card);
  });
  productContainer.append(categoryGrid);
  productSection.append(productContainer);
  main.append(productSection);

  if (data.stats.length) {
    const strip = element("div", "feature-strip");
    const stripContainer = element("div", "container");
    data.stats.forEach(item => {
      const feature = element("div", "feature");
      const featureCopy = element("div", "feature-copy");
      featureCopy.append(element("strong", "", item.label), element("small", "", item.description));
      feature.append(element("div", "num", item.number), featureCopy);
      stripContainer.append(feature);
    });
    strip.append(stripContainer);
    main.append(strip);
  }

  const processSection = createProcessSection(data);
  if (processSection) main.append(processSection);
  const casesSection = createCasesSection(data);
  if (casesSection) main.append(casesSection);

  const newsSection = element("section", "section");
  const newsContainer = element("div", "container");
  newsContainer.append(sectionHead(data.news.homeEyebrow, data.news.homeTitle), createNewsCards(data));
  newsSection.append(newsContainer);
  main.append(newsSection);
  return main;
}

function createAbout(data) {
  const main = element("main");
  addSubHero(main, data.aboutPage.bannerTitle, data.aboutPage.bannerSubtitle, data.aboutPage.bannerImage, data.aboutPage.bannerImageAlt);

  const storySection = element("section", "section");
  const storyContainer = element("div", "container about-story");
  const photo = element("div", "about-photo");
  photo.append(imageElement(data.aboutPage.storyImage, data.aboutPage.storyImageAlt, "media-img", { fallback: "assets/factory.webp" }));
  const story = element("div", "story");
  story.append(element("div", "eyebrow story-eyebrow", data.aboutPage.storyEyebrow), multilineHeading(data.aboutPage.storyTitle));
  const redline = element("div", "redline");
  redline.setAttribute("aria-hidden", "true");
  story.append(redline);
  splitParagraphs(data.aboutPage.storyBody).forEach(paragraph => story.append(element("p", "", paragraph)));
  storyContainer.append(photo, story);
  storySection.append(storyContainer);
  main.append(storySection);

  if (data.advantages.items.length) {
    const valuesSection = element("section", "section dark");
    const valuesContainer = element("div", "container");
    valuesContainer.append(sectionHead(data.advantages.eyebrow, data.advantages.title, data.advantages.subtitle));
    const values = element("div", "values");
    data.advantages.items.forEach(item => {
      const value = element("article", "value");
      const icon = element("div", "icon", item.icon);
      icon.setAttribute("aria-hidden", "true");
      value.append(icon, element("h3", "", item.name), element("p", "", item.description));
      values.append(value);
    });
    valuesContainer.append(values);
    valuesSection.append(valuesContainer);
    main.append(valuesSection);
  }

  const manufacturingSection = element("section", "section gray");
  const manufacturingContainer = element("div", "container");
  manufacturingContainer.append(sectionHead(data.aboutPage.manufacturingEyebrow, data.aboutPage.manufacturingTitle));
  const manufacturingGrid = element("div", "intro-grid");
  const manufacturingCopy = element("div", "intro-copy");
  manufacturingCopy.append(element("h3", "", data.aboutPage.manufacturingHeading), element("p", "", data.aboutPage.manufacturingBody), learnLink(data.aboutPage.manufacturingButtonLink, data.aboutPage.manufacturingButtonText));
  const manufacturingImage = element("div", "intro-image");
  manufacturingImage.append(imageElement(data.aboutPage.manufacturingImage, data.aboutPage.manufacturingImageAlt, "media-img", { fallback: "assets/product-set.webp" }));
  manufacturingGrid.append(manufacturingCopy, manufacturingImage);
  manufacturingContainer.append(manufacturingGrid);
  manufacturingSection.append(manufacturingContainer);
  main.append(manufacturingSection);
  return main;
}

function createProducts(data) {
  const main = element("main");
  addSubHero(main, data.productsPage.bannerTitle, data.productsPage.bannerSubtitle, data.productsPage.bannerImage, data.productsPage.bannerImageAlt, "products");
  const section = element("section", "section");
  const catalog = element("div", "container catalog");
  const aside = element("aside");
  aside.append(element("div", "side-title", data.productsPage.categoryTitle));
  const filters = element("div", "filters");
  [data.productsPage.allCategoryLabel, ...data.productsPage.categories].forEach((label, index) => {
    const button = element("button", `filter${index === 0 ? " active" : ""}`, label);
    button.type = "button";
    button.dataset.filter = index === 0 ? "all" : String(index - 1);
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    filters.append(button);
  });
  aside.append(filters);
  catalog.append(aside);

  const grid = element("div", "product-grid");
  grid.id = "productGrid";
  data.productsPage.products.forEach(item => {
    const article = element("article", "product");
    article.dataset.category = String(Math.max(0, data.productsPage.categories.indexOf(item.category)));
    const productLink = linkElement(item.link, "product-link");
    const imageWrap = element("div", "product-img");
    imageWrap.append(imageElement(item.image, item.imageAlt, "media-img", { fallback: "assets/product-set.webp" }));
    imageWrap.append(element("span", "product-hover", data.productsPage.viewDetailsText));
    const body = element("div", "product-body");
    body.append(element("h2", "product-name", item.name), element("p", "product-summary", item.summary), element("p", "product-details", item.details));
    productLink.append(imageWrap, body);
    article.append(productLink);
    grid.append(article);
  });
  catalog.append(grid);
  section.append(catalog);
  main.append(section);
  return main;
}

function createNews(data) {
  const main = element("main");
  addSubHero(main, data.news.bannerTitle, data.news.bannerSubtitle, data.news.bannerImage, data.news.bannerImageAlt);
  const section = element("section", "section");
  const container = element("div", "container");
  container.append(sectionHead(data.news.listEyebrow, data.news.listTitle));
  const list = element("div", "news-list");
  data.news.items.forEach(item => {
    const row = element("article", "news-row");
    const imageLink = linkElement(item.link, "news-row-img");
    imageLink.append(imageElement(item.image, item.imageAlt, "media-img", { fallback: "assets/factory.webp" }));
    const copy = element("div");
    copy.append(element("div", "meta", `${item.date}　/　${data.news.listTitle}`));
    const title = element("h2");
    title.append(linkElement(item.link, "", item.title));
    copy.append(title, element("p", "", item.summary), learnLink(item.link, data.news.readMoreText));
    row.append(imageLink, copy);
    list.append(row);
  });
  container.append(list);
  section.append(container);
  main.append(section);
  return main;
}

function newsIndex(data) {
  const raw = new URLSearchParams(location.search).get("id");
  if (raw === null || !/^(?:0|[1-9]\d*)$/.test(raw)) return 0;
  const index = Number(raw);
  return Number.isSafeInteger(index) && index >= 0 && index < data.news.items.length ? index : 0;
}

function createNewsDetail(data) {
  const main = element("main");
  const index = newsIndex(data);
  const item = data.news.items[index];
  addSubHero(main, data.news.detailBannerTitle, data.news.detailBannerSubtitle, data.news.bannerImage, data.news.bannerImageAlt);
  const section = element("section", "article-section");
  const article = element("article", "article container");
  article.append(linkElement("news.html", "article-back", "← 返回企业资讯"));
  const header = element("header");
  header.append(element("h1", "", item.title), element("div", "article-meta", `发布时间：${item.date}　　来源：${data.news.sourceLabel}`));
  article.append(header);
  article.append(imageElement(item.image, item.imageAlt, "article-cover", { eager: true, fallback: "assets/factory.webp" }));
  splitParagraphs(item.body).forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex === 1) article.append(imageElement(item.detailImage, item.detailImageAlt, "article-inline", { fallback: item.image }));
    article.append(element("p", "", paragraph));
  });
  const navigation = element("nav", "article-nav");
  navigation.setAttribute("aria-label", "资讯翻页");
  if (index > 0) {
    const previous = linkElement(data.news.items[index - 1].link, "");
    previous.append(element("small", "", "上一篇"), document.createTextNode(data.news.items[index - 1].title));
    navigation.append(previous);
  } else {
    navigation.append(element("span"));
  }
  if (index < data.news.items.length - 1) {
    const next = linkElement(data.news.items[index + 1].link, "next");
    next.append(element("small", "", "下一篇"), document.createTextNode(data.news.items[index + 1].title));
    navigation.append(next);
  } else {
    navigation.append(element("span"));
  }
  article.append(navigation);
  section.append(article);
  main.append(section);
  return main;
}

function contactItem(iconText, label, value, href = "") {
  const item = element("div", "contact-item");
  const icon = element("div", "contact-icon", iconText);
  icon.setAttribute("aria-hidden", "true");
  const copy = element("div");
  copy.append(element("strong", "", label));
  if (href && isSafeLink(href)) copy.append(linkElement(href, "contact-value", value));
  else copy.append(element("span", "", value));
  item.append(icon, copy);
  return item;
}

function formControl(tagName, id, label, placeholder, options = {}) {
  const wrapper = document.createDocumentFragment();
  const labelNode = element("label", "sr-only", label);
  labelNode.htmlFor = id;
  const control = element(tagName);
  control.id = id;
  control.name = options.name || id;
  control.placeholder = placeholder;
  if (options.type && tagName === "input") control.type = options.type;
  if (options.autocomplete) control.autocomplete = options.autocomplete;
  if (options.required) control.required = true;
  wrapper.append(labelNode, control);
  return wrapper;
}

function createContact(data) {
  const main = element("main");
  addSubHero(main, data.contact.bannerTitle, data.contact.bannerSubtitle, data.contact.bannerImage, data.contact.bannerImageAlt);
  const section = element("section", "section");
  const grid = element("div", "container contact-grid");
  const block = element("div", "contact-block");
  block.append(element("div", "eyebrow contact-eyebrow", data.contact.eyebrow), element("h2", "", data.contact.title));
  const phoneHref = `tel:${data.contact.phone.replace(/[^\d+]/g, "")}`;
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email) ? `mailto:${data.contact.email}` : "";
  block.append(
    contactItem("⌖", "公司地址", data.contact.address),
    contactItem("☎", "服务热线", data.contact.phone, phoneHref),
    contactItem("微", "微信", data.contact.wechat),
    contactItem("✉", "电子邮箱", data.contact.email, emailHref),
    contactItem("◷", "服务时间", data.contact.businessHours)
  );
  grid.append(block);

  const form = element("form", "form");
  form.id = "contactForm";
  form.noValidate = false;
  form.append(
    formControl("input", "contact-name", "您的姓名", data.contact.formNamePlaceholder, { name: "name", autocomplete: "name", required: true }),
    formControl("input", "contact-phone", "联系电话", data.contact.formPhonePlaceholder, { name: "phone", type: "tel", autocomplete: "tel", required: true }),
    formControl("input", "contact-email", "电子邮箱", data.contact.formEmailPlaceholder, { name: "email", type: "email", autocomplete: "email" }),
    formControl("input", "contact-company", "公司名称", data.contact.formCompanyPlaceholder, { name: "company", autocomplete: "organization" }),
    formControl("textarea", "contact-message", "需求说明", data.contact.formMessagePlaceholder, { name: "message", required: true })
  );
  const submit = element("button", "btn", data.contact.formSubmitText);
  submit.type = "submit";
  form.append(submit);
  grid.append(form);
  section.append(grid);
  main.append(section);

  const map = linkElement(data.contact.mapLink, "map");
  map.setAttribute("aria-label", data.contact.mapLabel);
  map.append(element("span", "sr-only", data.contact.mapLabel));
  const pin = element("i", "map-pin");
  pin.setAttribute("aria-hidden", "true");
  map.append(pin);
  main.append(map);
  return main;
}

function applyTheme(data) {
  const root = document.documentElement;
  root.style.setProperty("--red", data.theme.primaryColor);
  root.style.setProperty("--ink", data.theme.secondaryColor);
  root.style.setProperty("--button", data.theme.buttonColor);
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    document.head.append(themeMeta);
  }
  themeMeta.content = data.theme.primaryColor;
}

function setMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

function applySeo(data) {
  const company = data.site.companyName;
  let title = data.seo.title;
  let description = data.seo.description;
  if (page === "about") {
    title = `${data.aboutPage.bannerTitle}｜${company}`;
    description = data.aboutPage.storyBody.replace(/\s+/g, " ").slice(0, 160);
  } else if (page === "products") {
    title = `${data.productsPage.bannerTitle}｜${company}`;
    description = data.productSection.subtitle;
  } else if (page === "news") {
    title = `${data.news.bannerTitle}｜${company}`;
  } else if (page === "news-detail") {
    const item = data.news.items[newsIndex(data)];
    title = `${item.title}｜${company}`;
    description = item.summary;
  } else if (page === "contact") {
    title = `${data.contact.bannerTitle}｜${company}`;
    description = `${data.contact.title}。电话：${data.contact.phone}；地址：${data.contact.address}`;
  }
  document.title = title;
  setMeta("description", description);
  setMeta("keywords", data.seo.keywords);
}

function bindInteractions() {
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.getElementById("nav");
  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "打开导航");
    };
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const filterButtons = [...document.querySelectorAll(".filter")];
  const products = [...document.querySelectorAll(".product")];
  filterButtons.forEach(button => button.addEventListener("click", () => {
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    const filter = button.dataset.filter;
    products.forEach(product => {
      product.hidden = filter !== "all" && product.dataset.category !== filter;
    });
  }));

  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.reset();
      const toast = document.getElementById("toast");
      if (!toast) return;
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 2600);
    });
  }
}

function renderSite(data) {
  applyTheme(data);
  applySeo(data);
  const app = document.getElementById("app");
  const factories = {
    home: createHome,
    about: createAbout,
    products: createProducts,
    news: createNews,
    "news-detail": createNewsDetail,
    contact: createContact
  };
  const fragment = document.createDocumentFragment();
  fragment.append(createHeader(data), factories[page](data), createFooter(data));
  app.replaceChildren(fragment);
  document.body.classList.add("site-ready");
  bindInteractions();
}

async function loadSite() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);
  try {
    const contentUrl = new URL(`content/site.json?v=${Date.now()}`, document.baseURI);
    const response = await fetch(contentUrl, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const content = await response.json();
    return normalizeSite(content);
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "请求超时" : "文件读取或格式异常";
    console.error(`网站内容加载失败，已使用安全默认内容（${reason}）。`);
    return normalizeSite(FALLBACK_SITE);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function init() {
  const data = await loadSite();
  renderSite(data);
}

void init();
