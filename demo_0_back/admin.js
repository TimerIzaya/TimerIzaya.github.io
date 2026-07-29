(() => {
  "use strict";

  const API_ORIGIN = "https://api.github.com";
  const API_VERSION = "2026-03-10";
  const TOKEN_STORAGE_KEY = "pagepilot_demo0_github_token";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = Object.freeze({
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
  });
  const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

  const state = {
    token: "",
    data: null,
    baseData: null,
    baseSha: "",
    loadedAt: null,
    dirty: false,
    publishing: false,
    pendingImages: [],
    uploadedOrphans: [],
    fieldCounter: 0,
    sectionCounter: 0,
    previewTimer: 0
  };

  const field = (key, label, type = "text", options = {}) => ({
    key,
    label,
    type,
    required: options.required !== false,
    placeholder: options.placeholder || "",
    help: options.help || "",
    rows: options.rows || 4
  });
  const imageField = (key, altKey, label, prefix, options = {}) => ({
    key,
    altKey,
    label,
    prefix,
    type: "image",
    required: options.required !== false,
    help: options.help || ""
  });

  const FIELDSETS = Object.freeze({
    site: [
      field("siteName", "网站名称"),
      field("companyName", "企业名称"),
      field("companyNameEn", "企业英文名称"),
      imageField("logoImage", "logoAlt", "Logo 图片", "logo", { required: false, help: "未设置图片时，前台继续使用现有几何标志。" }),
      field("logoDescription", "Logo 说明", "textarea"),
      field("welcomeText", "顶部欢迎语"),
      field("tagline", "企业宣传语")
    ],
    navigation: [
      field("label", "菜单名称"),
      field("href", "菜单链接", "link")
    ],
    hero: [
      field("eyebrow", "英文眉题"),
      field("title", "首页主标题"),
      field("highlight", "首页强调标题"),
      field("subtitle", "首页副标题"),
      field("intro", "首页介绍文字", "textarea"),
      field("primaryButtonText", "主按钮文字"),
      field("primaryButtonLink", "主按钮链接", "link"),
      field("secondaryButtonText", "次按钮文字"),
      field("secondaryButtonLink", "次按钮链接", "link"),
      imageField("image", "imageAlt", "首页主视觉图片", "hero")
    ],
    homeAbout: [
      field("sectionEyebrow", "模块英文标题"),
      field("sectionTitle", "模块标题"),
      field("subtitle", "模块副标题"),
      field("title", "介绍标题"),
      field("titleHighlight", "介绍强调文字"),
      field("body", "企业介绍正文", "textarea", { rows: 6 }),
      field("buttonText", "按钮文字"),
      field("buttonLink", "按钮链接", "link"),
      imageField("image", "imageAlt", "企业介绍图片", "about")
    ],
    stats: [
      field("number", "数据数字"),
      field("label", "数据说明"),
      field("description", "补充说明", "textarea", { required: false })
    ],
    productSection: [
      field("eyebrow", "模块英文标题"),
      field("title", "产品模块标题"),
      field("subtitle", "产品模块副标题", "textarea")
    ],
    productCategory: [
      field("name", "分类名称"),
      field("nameEn", "分类英文名称"),
      field("summary", "分类简介", "textarea"),
      field("link", "分类链接", "link"),
      imageField("image", "imageAlt", "分类图片", "category")
    ],
    aboutPage: [
      field("bannerTitle", "横幅标题"),
      field("bannerSubtitle", "横幅副标题"),
      imageField("bannerImage", "bannerImageAlt", "横幅图片", "about-banner"),
      field("storyEyebrow", "企业故事眉题"),
      field("storyTitle", "企业故事标题", "textarea"),
      field("storyBody", "企业故事正文", "textarea", { rows: 8 }),
      imageField("storyImage", "storyImageAlt", "企业故事图片", "about-story"),
      field("manufacturingEyebrow", "智造模块英文标题"),
      field("manufacturingTitle", "智造模块标题"),
      field("manufacturingHeading", "智造介绍标题"),
      field("manufacturingBody", "智造介绍正文", "textarea", { rows: 6 }),
      field("manufacturingButtonText", "智造按钮文字"),
      field("manufacturingButtonLink", "智造按钮链接", "link"),
      imageField("manufacturingImage", "manufacturingImageAlt", "智造实力图片", "manufacturing")
    ],
    advantageSettings: [
      field("eyebrow", "模块英文标题"),
      field("title", "企业优势标题"),
      field("subtitle", "企业优势副标题", "textarea")
    ],
    advantageItem: [
      field("icon", "图标文字"),
      field("name", "优势名称"),
      field("description", "优势介绍", "textarea")
    ],
    processSettings: [
      field("eyebrow", "模块英文标题"),
      field("title", "服务流程标题"),
      field("subtitle", "服务流程副标题", "textarea")
    ],
    processItem: [
      field("name", "流程步骤名称"),
      field("description", "流程步骤说明", "textarea")
    ],
    casesSettings: [
      field("eyebrow", "模块英文标题"),
      field("title", "案例模块标题"),
      field("subtitle", "案例模块副标题", "textarea")
    ],
    caseItem: [
      field("name", "案例名称"),
      field("summary", "案例简介", "textarea"),
      field("details", "案例详细说明", "textarea", { rows: 5 }),
      field("link", "案例链接", "link"),
      imageField("image", "imageAlt", "案例图片", "case")
    ],
    productsPage: [
      field("bannerTitle", "横幅标题"),
      field("bannerSubtitle", "横幅副标题"),
      imageField("bannerImage", "bannerImageAlt", "产品页横幅图片", "products-banner"),
      field("categoryTitle", "分类栏标题"),
      field("allCategoryLabel", "全部分类文字"),
      field("viewDetailsText", "查看详情文字")
    ],
    productItem: [
      field("name", "产品名称"),
      field("category", "产品分类"),
      field("summary", "产品简介", "textarea"),
      field("details", "产品详细说明", "textarea", { rows: 5 }),
      field("link", "产品链接", "link"),
      imageField("image", "imageAlt", "产品图片", "product")
    ],
    newsSettings: [
      field("homeEyebrow", "首页模块英文标题"),
      field("homeTitle", "首页新闻标题"),
      field("bannerTitle", "新闻页横幅标题"),
      field("bannerSubtitle", "新闻页横幅副标题"),
      imageField("bannerImage", "bannerImageAlt", "新闻页横幅图片", "news-banner"),
      field("listEyebrow", "新闻列表英文标题"),
      field("listTitle", "新闻列表标题"),
      field("readMoreText", "阅读更多文字"),
      field("detailBannerTitle", "详情页横幅标题"),
      field("detailBannerSubtitle", "详情页横幅副标题"),
      field("sourceLabel", "新闻来源文字")
    ],
    newsItem: [
      field("date", "发布日期", "date"),
      field("title", "新闻标题"),
      field("summary", "新闻简介", "textarea"),
      field("body", "新闻正文（段落间空一行）", "textarea", { rows: 10 }),
      field("link", "新闻详情链接", "link"),
      imageField("image", "imageAlt", "新闻列表图片", "news"),
      imageField("detailImage", "detailImageAlt", "新闻详情图片", "news-detail")
    ],
    contact: [
      field("bannerTitle", "横幅标题"),
      field("bannerSubtitle", "横幅副标题"),
      imageField("bannerImage", "bannerImageAlt", "联系页横幅图片", "contact-banner"),
      field("eyebrow", "联系模块英文标题"),
      field("title", "联系模块标题"),
      field("phone", "联系电话"),
      field("wechat", "微信"),
      field("email", "电子邮箱"),
      field("address", "公司地址", "textarea"),
      field("businessHours", "营业时间"),
      field("mapLink", "地图跳转链接", "link"),
      field("mapLabel", "地图链接文字"),
      field("formNamePlaceholder", "姓名输入提示"),
      field("formPhonePlaceholder", "电话输入提示"),
      field("formEmailPlaceholder", "邮箱输入提示"),
      field("formCompanyPlaceholder", "公司输入提示"),
      field("formMessagePlaceholder", "需求输入提示"),
      field("formSubmitText", "表单按钮文字"),
      field("formSuccessText", "提交成功提示")
    ],
    footer: [
      field("description", "页脚企业介绍", "textarea"),
      field("quickLinksTitle", "快捷导航标题"),
      field("productLinksTitle", "产品链接标题"),
      field("contactTitle", "联系信息标题"),
      field("footerText", "页脚文字", "textarea"),
      field("copyright", "版权文字")
    ],
    seo: [
      field("title", "SEO 标题"),
      field("description", "SEO 描述", "textarea"),
      field("keywords", "SEO 关键词", "textarea")
    ],
    theme: [
      field("primaryColor", "网站主色", "color"),
      field("secondaryColor", "网站辅助色", "color"),
      field("buttonColor", "按钮颜色", "color")
    ]
  });

  const ARRAY_DEFAULTS = Object.freeze({
    navigation: { key: "custom", label: "新菜单", href: "#" },
    stats: { number: "0", label: "新数据", description: "" },
    productCategory: { name: "新分类", nameEn: "NEW CATEGORY", summary: "请输入分类简介", link: "products.html", image: "assets/product-set.webp", imageAlt: "产品分类图片" },
    advantageItem: { icon: "◆", name: "新优势", description: "请输入优势介绍" },
    processItem: { name: "新步骤", description: "请输入流程说明" },
    caseItem: { name: "新案例", summary: "请输入案例简介", details: "请输入案例详细说明", link: "contact.html", image: "assets/factory.webp", imageAlt: "案例图片" },
    productItem: { name: "新产品", category: "家具连接件", summary: "请输入产品简介", details: "请输入产品详细说明", link: "contact.html", image: "assets/product-set.webp", imageAlt: "产品图片" },
    newsItem: { date: new Date().toISOString().slice(0, 10), title: "新资讯", summary: "请输入新闻简介", body: "请输入新闻正文", link: "news-detail.html", image: "assets/factory.webp", imageAlt: "新闻图片", detailImage: "assets/factory.webp", detailImageAlt: "新闻详情图片" }
  });

  const dom = {};

  function getElement(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function stringValue(value) {
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  }

  function semanticEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function setText(element, value) {
    if (element) element.textContent = stringValue(value);
  }

  function setGlobalStatus(message, kind = "info") {
    if (!dom.globalStatus) return;
    dom.globalStatus.textContent = message;
    dom.globalStatus.dataset.kind = kind;
  }

  function safeStorageGet(storage, key) {
    try {
      return storage.getItem(key) || "";
    } catch (_error) {
      return "";
    }
  }

  function safeStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function safeStorageRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch (_error) {
      // Storage can be unavailable in privacy modes; the in-memory token is still cleared.
    }
  }

  const TokenStore = Object.freeze({
    read() {
      const sessionToken = safeStorageGet(sessionStorage, TOKEN_STORAGE_KEY);
      const localToken = safeStorageGet(localStorage, TOKEN_STORAGE_KEY);
      return { token: sessionToken || localToken, remembered: Boolean(localToken) };
    },
    save(token, remember) {
      const sessionSaved = safeStorageSet(sessionStorage, TOKEN_STORAGE_KEY, token);
      if (remember) {
        const localSaved = safeStorageSet(localStorage, TOKEN_STORAGE_KEY, token);
        return sessionSaved && localSaved;
      }
      safeStorageRemove(localStorage, TOKEN_STORAGE_KEY);
      return sessionSaved;
    },
    clear() {
      safeStorageRemove(sessionStorage, TOKEN_STORAGE_KEY);
      safeStorageRemove(localStorage, TOKEN_STORAGE_KEY);
    }
  });

  class ApiError extends Error {
    constructor(status, rateLimited = false) {
      super("GitHub API request failed");
      this.name = "ApiError";
      this.status = status;
      this.rateLimited = rateLimited;
    }
  }

  class SiteFormatError extends Error {
    constructor() {
      super("Site JSON format is invalid");
      this.name = "SiteFormatError";
    }
  }

  class OnlineConflictError extends Error {
    constructor() {
      super("Online site content changed");
      this.name = "OnlineConflictError";
    }
  }

  class ImageValidationError extends Error {
    constructor(message, label = "") {
      super(message);
      this.name = "ImageValidationError";
      this.label = label;
    }
  }

  function validateConfig() {
    if (typeof githubConfig !== "object" || !githubConfig) throw new Error("后台配置缺失。");
    const simpleName = /^[A-Za-z0-9_.-]+$/;
    if (!simpleName.test(githubConfig.owner) || !simpleName.test(githubConfig.repo)) throw new Error("仓库配置格式不正确。");
    if (!/^[A-Za-z0-9._/-]+$/.test(githubConfig.branch) || githubConfig.branch.includes("..")) throw new Error("分支配置格式不正确。");
    if (githubConfig.contentPath !== "demo_0/content/site.json") throw new Error("内容文件路径配置不正确。");
    if (githubConfig.uploadDirectory !== "demo_0/assets/uploads") throw new Error("图片上传目录配置不正确。");
    if (githubConfig.publicSiteUrl !== "/demo_0/") throw new Error("公开网站路径配置不正确。");
  }

  function encodeRepositoryPath(path) {
    return path.split("/").map((part) => encodeURIComponent(part)).join("/");
  }

  function contentsEndpoint(path) {
    const owner = encodeURIComponent(githubConfig.owner);
    const repo = encodeURIComponent(githubConfig.repo);
    const encodedPath = encodeRepositoryPath(path);
    const branch = encodeURIComponent(githubConfig.branch);
    return `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;
  }

  function contentPutEndpoint(path) {
    const owner = encodeURIComponent(githubConfig.owner);
    const repo = encodeURIComponent(githubConfig.repo);
    return `/repos/${owner}/${repo}/contents/${encodeRepositoryPath(path)}`;
  }

  async function githubRequest(method, endpoint, body) {
    if (!state.token) throw new Error("请先输入并验证 GitHub 令牌。");
    const url = new URL(endpoint, API_ORIGIN);
    if (url.origin !== API_ORIGIN) throw new Error("GitHub API 地址不安全。");

    const request = {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.token}`,
        "X-GitHub-Api-Version": API_VERSION
      }
    };
    if (body !== undefined) {
      request.headers["Content-Type"] = "application/json";
      request.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url.href, request);
    } catch (_error) {
      throw new TypeError("NETWORK_ERROR");
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      const rateLimited = response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0";
      if (response.status === 401) clearToken(false);
      throw new ApiError(response.status, rateLimited);
    }
    return payload;
  }

  function decodeBase64Utf8(base64) {
    try {
      const clean = String(base64).replace(/\s/g, "");
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (_error) {
      throw new SiteFormatError();
    }
  }

  function bytesToBase64(bytes) {
    const chunkSize = 0x8000;
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const slice = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
      let binary = "";
      for (let index = 0; index < slice.length; index += 1) binary += String.fromCharCode(slice[index]);
      chunks.push(binary);
    }
    return btoa(chunks.join(""));
  }

  function encodeUtf8Base64(text) {
    return bytesToBase64(new TextEncoder().encode(text));
  }

  async function blobToBase64(blob) {
    return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  }

  function parseSiteJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/^\uFEFF/, ""), (key, value) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype") throw new SiteFormatError();
        return value;
      });
    } catch (error) {
      if (error instanceof SiteFormatError) throw error;
      throw new SiteFormatError();
    }
    assertSiteStructure(parsed);
    return parsed;
  }

  function assertSiteStructure(data) {
    const objectSections = ["site", "hero", "homeAbout", "productSection", "aboutPage", "advantages", "process", "cases", "productsPage", "news", "contact", "footer", "theme", "seo"];
    if (!data || typeof data !== "object" || Array.isArray(data) || data.schemaVersion !== 1) throw new SiteFormatError();
    if (!Array.isArray(data.navigation) || !Array.isArray(data.stats)) throw new SiteFormatError();
    for (const key of objectSections) {
      if (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key])) throw new SiteFormatError();
    }
    const arrays = [
      data.productSection.categories,
      data.advantages.items,
      data.process.items,
      data.cases.items,
      data.productsPage.categories,
      data.productsPage.products,
      data.news.items
    ];
    if (arrays.some((value) => !Array.isArray(value))) throw new SiteFormatError();
  }

  async function fetchOnlineSite() {
    const payload = await githubRequest("GET", contentsEndpoint(githubConfig.contentPath));
    if (!payload || typeof payload.content !== "string" || typeof payload.sha !== "string") throw new SiteFormatError();
    const data = parseSiteJson(decodeBase64Utf8(payload.content));
    return { data, sha: payload.sha };
  }

  function isSafeLink(value) {
    const link = stringValue(value).trim();
    if (!link || /[\u0000-\u001f\u007f]/.test(link) || link.includes("\\")) return false;
    if (link.startsWith("//")) return false;
    const schemeMatch = link.match(/^([a-z][a-z0-9+.-]*):/i);
    if (schemeMatch) {
      const protocol = schemeMatch[1].toLowerCase();
      if (!["http", "https", "mailto", "tel"].includes(protocol)) return false;
      try {
        const parsed = new URL(link);
        return parsed.protocol === `${protocol}:` && !parsed.username && !parsed.password;
      } catch (_error) {
        return protocol === "mailto" || protocol === "tel";
      }
    }
    if (link.startsWith("#")) return true;
    try {
      const siteBase = new URL(githubConfig.publicSiteUrl, window.location.origin);
      const resolved = new URL(link, siteBase);
      return resolved.origin === siteBase.origin && resolved.pathname.startsWith(siteBase.pathname);
    } catch (_error) {
      return false;
    }
  }

  function isSafeImagePath(value) {
    const path = stringValue(value).trim();
    if (!/^assets\/[A-Za-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(path)) return false;
    return path.split("/").every((segment) => segment && segment !== "." && segment !== "..");
  }

  function resolvePublicImage(path) {
    if (!isSafeImagePath(path)) return "";
    const siteBase = new URL(githubConfig.publicSiteUrl, window.location.origin);
    return new URL(path, siteBase).href;
  }

  function publicSiteUrl(cacheBusted = false) {
    const url = new URL(githubConfig.publicSiteUrl, window.location.origin);
    if (cacheBusted) url.searchParams.set("v", String(Date.now()));
    return url.href;
  }

  function friendlyError(error) {
    if (error instanceof OnlineConflictError) return "线上内容已发生变化，请重新加载后检查修改。为避免覆盖他人的更新，本次未提交 site.json。";
    if (error instanceof SiteFormatError) return "网站内容文件格式异常，请检查 site.json。";
    if (error instanceof ImageValidationError) return error.label ? `${error.label}：${error.message}` : error.message;
    if (error instanceof ApiError) {
      if (error.rateLimited) return "GitHub API 请求过于频繁，请稍后再试。";
      const messages = {
        401: "GitHub 令牌无效、已经过期或被撤销，请重新生成令牌。无效令牌已从当前浏览器清除。",
        403: "GitHub 令牌权限不足、仓库未授权或触发 GitHub 访问限制。",
        404: "仓库、分支或文件路径不存在，或者当前令牌无权访问。",
        409: "网站文件已经被其他操作修改，请重新加载后再次发布。",
        422: "提交内容或 GitHub API 请求格式不正确。"
      };
      return messages[error.status] || `GitHub API 请求失败（HTTP ${error.status}）。`;
    }
    if (error instanceof TypeError && error.message === "NETWORK_ERROR") return "无法连接 GitHub，请检查当前网络环境后重试。";
    return error && typeof error.message === "string" && error.message.startsWith("请先")
      ? error.message
      : "操作未完成，请检查输入后重试。";
  }

  function nextFieldId(key) {
    state.fieldCounter += 1;
    return `admin-field-${key.replace(/[^a-z0-9_-]/gi, "-")}-${state.fieldCounter}`;
  }

  function makeButton(label, className, handler) {
    const button = createElement("button", className, label);
    button.type = "button";
    button.disabled = state.publishing;
    button.addEventListener("click", handler);
    return button;
  }

  function markDirty() {
    if (dom.validationSummary) dom.validationSummary.hidden = true;
    refreshDirtyState();
    schedulePreview();
  }

  function refreshDirtyState() {
    state.dirty = Boolean(state.data && state.baseData && (!semanticEqual(state.data, state.baseData) || state.pendingImages.length));
    if (dom.dirtyStatus) {
      dom.dirtyStatus.textContent = state.dirty ? "存在未发布的修改" : "内容与线上版本一致";
      dom.dirtyStatus.dataset.dirty = String(state.dirty);
    }
    if (dom.publishButton) dom.publishButton.disabled = state.publishing || !state.dirty;
  }

  function schedulePreview() {
    if (!dom.previewPanel || dom.previewPanel.hidden) return;
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(renderPreview, 120);
  }

  function appendHelp(container, help) {
    if (!help) return;
    container.append(createElement("small", "field-help", help));
  }

  function renderBasicField(container, object, descriptor) {
    const wrapper = createElement("div", descriptor.type === "textarea" ? "form-field form-field--wide" : "form-field");
    const id = nextFieldId(descriptor.key);
    const label = createElement("label", "field-label", descriptor.label);
    label.htmlFor = id;
    const input = descriptor.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    input.id = id;
    input.name = id;
    input.value = stringValue(object[descriptor.key]);
    input.required = descriptor.required;
    input.placeholder = descriptor.placeholder;
    input.disabled = state.publishing;
    if (descriptor.type === "textarea") input.rows = descriptor.rows;
    if (descriptor.type === "date") input.type = "date";
    else if (descriptor.type !== "textarea") input.type = "text";
    if (descriptor.type === "link") input.inputMode = "url";
    input.addEventListener("input", () => {
      object[descriptor.key] = input.value;
      markDirty();
    });
    wrapper.append(label, input);
    appendHelp(wrapper, descriptor.help);
    container.append(wrapper);
  }

  function renderColorField(container, object, descriptor) {
    const wrapper = createElement("div", "form-field color-field");
    const id = nextFieldId(descriptor.key);
    const label = createElement("label", "field-label", descriptor.label);
    label.htmlFor = id;
    const controls = createElement("div", "color-controls");
    const picker = document.createElement("input");
    picker.type = "color";
    picker.id = id;
    picker.value = COLOR_PATTERN.test(stringValue(object[descriptor.key])) ? stringValue(object[descriptor.key]) : "#000000";
    picker.disabled = state.publishing;
    picker.setAttribute("aria-label", `${descriptor.label}颜色选择器`);
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = stringValue(object[descriptor.key]);
    textInput.maxLength = 7;
    textInput.spellcheck = false;
    textInput.disabled = state.publishing;
    textInput.setAttribute("aria-label", `${descriptor.label}十六进制值`);
    picker.addEventListener("input", () => {
      textInput.value = picker.value;
      object[descriptor.key] = picker.value;
      textInput.setCustomValidity("");
      markDirty();
    });
    textInput.addEventListener("input", () => {
      object[descriptor.key] = textInput.value;
      const valid = COLOR_PATTERN.test(textInput.value);
      textInput.setCustomValidity(valid ? "" : "请输入 #RRGGBB 格式的颜色值");
      if (valid) picker.value = textInput.value;
      markDirty();
    });
    controls.append(picker, textInput);
    wrapper.append(label, controls);
    container.append(wrapper);
  }

  function findPendingImage(owner, fieldName) {
    return state.pendingImages.find((entry) => entry.owner === owner && entry.fieldName === fieldName) || null;
  }

  function pendingPreviewSource(owner, fieldName) {
    const pending = findPendingImage(owner, fieldName);
    return pending ? pending.previewUrl : resolvePublicImage(owner[fieldName]);
  }

  function revokePendingPreview(entry) {
    if (entry && entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  }

  function removePendingEntry(entry, restoreOriginal = true) {
    const index = state.pendingImages.indexOf(entry);
    if (index === -1) return;
    revokePendingPreview(entry);
    if (restoreOriginal && entry.owner) entry.owner[entry.fieldName] = entry.originalPath;
    state.pendingImages.splice(index, 1);
  }

  function removePendingForObject(object, restoreOriginal = false) {
    for (const entry of [...state.pendingImages]) {
      if (entry.owner === object) removePendingEntry(entry, restoreOriginal);
    }
  }

  async function verifyImageSignature(file, extension) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (extension === ".jpg" || extension === ".jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (extension === ".png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
    if (extension === ".webp") {
      const signature = String.fromCharCode(...bytes);
      return signature.slice(0, 4) === "RIFF" && signature.slice(8, 12) === "WEBP";
    }
    return false;
  }

  async function validateImageFile(file, label) {
    if (!(file instanceof File) || file.size <= 0) throw new ImageValidationError("请选择有效的图片文件。", label);
    if (file.size > MAX_IMAGE_BYTES) throw new ImageValidationError("单张图片不能超过 5MB。", label);
    const match = file.name.toLowerCase().match(/\.(jpe?g|png|webp)$/);
    const extension = match ? `.${match[1]}` : "";
    const expectedMime = ALLOWED_IMAGE_TYPES[extension];
    if (!expectedMime || file.type.toLowerCase() !== expectedMime) {
      throw new ImageValidationError("仅支持扩展名与 MIME 类型一致的 JPG、JPEG、PNG 或 WebP 图片。", label);
    }
    if (!(await verifyImageSignature(file, extension))) throw new ImageValidationError("图片文件签名与格式不一致。", label);
    return extension;
  }

  function renderImageField(container, object, descriptor, contextLabel) {
    const wrapper = createElement("fieldset", "image-field form-field--wide");
    const legend = createElement("legend", "field-label", descriptor.label);
    const layout = createElement("div", "image-editor");
    const current = createElement("div", "image-preview-block");
    current.append(createElement("span", "image-preview-title", "当前图片"));
    const currentImage = document.createElement("img");
    currentImage.alt = stringValue(object[descriptor.altKey]) || `${descriptor.label}预览`;
    const currentSource = resolvePublicImage(object[descriptor.key]);
    if (currentSource) currentImage.src = currentSource;
    else currentImage.hidden = true;
    const currentEmpty = createElement("div", "image-empty", "未设置图片");
    currentEmpty.hidden = Boolean(currentSource);
    const pathLabel = createElement("code", "image-path", stringValue(object[descriptor.key]) || "未设置路径");
    current.append(currentImage, currentEmpty, pathLabel);

    const replacement = createElement("div", "image-preview-block");
    replacement.append(createElement("span", "image-preview-title", "待发布图片"));
    const newImage = document.createElement("img");
    const pending = findPendingImage(object, descriptor.key);
    newImage.alt = "新选择图片的本地预览";
    if (pending) newImage.src = pending.previewUrl;
    else newImage.hidden = true;
    const replacementEmpty = createElement("div", "image-empty", "尚未选择新图片");
    replacementEmpty.hidden = Boolean(pending);
    replacement.append(newImage, replacementEmpty);

    const controls = createElement("div", "image-controls");
    const altId = nextFieldId(descriptor.altKey);
    const altLabel = createElement("label", "field-label", "图片替代文字（alt）");
    altLabel.htmlFor = altId;
    const altInput = document.createElement("input");
    altInput.type = "text";
    altInput.id = altId;
    altInput.value = stringValue(object[descriptor.altKey]);
    altInput.required = true;
    altInput.disabled = state.publishing;
    altInput.addEventListener("input", () => {
      object[descriptor.altKey] = altInput.value;
      currentImage.alt = altInput.value;
      markDirty();
    });

    const fileId = nextFieldId(descriptor.key);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = fileId;
    fileInput.className = "visually-hidden";
    fileInput.accept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
    fileInput.disabled = state.publishing;
    const fileLabel = createElement("label", "button button--secondary", "选择新图片");
    fileLabel.htmlFor = fileId;
    const cancelButton = makeButton("取消替换", "button button--quiet", () => {
      const active = findPendingImage(object, descriptor.key);
      if (!active) return;
      if (active.uploadedPath) state.uploadedOrphans.push(active.uploadedPath);
      removePendingEntry(active, true);
      renderEditor();
      markDirty();
      setGlobalStatus("已取消本地图片替换。", "info");
    });
    cancelButton.hidden = !pending;

    fileInput.addEventListener("change", async () => {
      const selected = fileInput.files && fileInput.files[0];
      if (!selected) return;
      fileInput.disabled = true;
      try {
        const extension = await validateImageFile(selected, contextLabel || descriptor.label);
        let entry = findPendingImage(object, descriptor.key);
        if (entry) {
          revokePendingPreview(entry);
          if (entry.uploadedPath) state.uploadedOrphans.push(entry.uploadedPath);
          object[descriptor.key] = entry.originalPath;
        } else {
          entry = {
            owner: object,
            fieldName: descriptor.key,
            altFieldName: descriptor.altKey,
            originalPath: stringValue(object[descriptor.key]),
            label: contextLabel || descriptor.label,
            prefix: descriptor.prefix
          };
          state.pendingImages.push(entry);
        }
        entry.file = selected;
        entry.extension = extension;
        entry.previewUrl = URL.createObjectURL(selected);
        entry.uploadedPath = "";
        entry.uploadedRepositoryPath = "";
        renderEditor();
        markDirty();
        setGlobalStatus(`${entry.label}已选择新图片，将在发布时上传。`, "success");
      } catch (error) {
        setGlobalStatus(friendlyError(error), "error");
        fileInput.value = "";
      } finally {
        fileInput.disabled = state.publishing;
      }
    });

    controls.append(altLabel, altInput, fileInput, fileLabel, cancelButton);
    appendHelp(controls, descriptor.help || "支持 JPG、JPEG、PNG、WebP；单张最大 5MB。选择后仅本地预览，发布时才上传。 ");
    layout.append(current, replacement, controls);
    wrapper.append(legend, layout);
    container.append(wrapper);
  }

  function renderFields(container, object, descriptors, contextLabel) {
    for (const descriptor of descriptors) {
      if (descriptor.type === "image") renderImageField(container, object, descriptor, contextLabel);
      else if (descriptor.type === "color") renderColorField(container, object, descriptor);
      else renderBasicField(container, object, descriptor);
    }
  }

  function createEditorCard(title, description) {
    state.sectionCounter += 1;
    const details = createElement("details", "editor-card");
    details.open = state.sectionCounter <= 2;
    const summary = createElement("summary", "editor-card__summary");
    summary.append(createElement("span", "editor-card__title", title));
    const body = createElement("div", "editor-card__body");
    if (description) body.append(createElement("p", "editor-card__description", description));
    details.append(summary, body);
    dom.editorSections.append(details);
    return body;
  }

  function addObjectSection(title, description, object, descriptors) {
    const body = createEditorCard(title, description);
    const grid = createElement("div", "form-grid");
    renderFields(grid, object, descriptors, title);
    body.append(grid);
  }

  function itemHeading(item, index, fallback) {
    return stringValue(item.name || item.title || item.label) || `${fallback} ${index + 1}`;
  }

  function addArraySection(title, description, array, descriptors, defaultKey, fallbackLabel) {
    const body = createEditorCard(title, description);
    const list = createElement("div", "array-list");
    array.forEach((item, index) => {
      const itemCard = createElement("article", "array-item");
      const header = createElement("div", "array-item__header");
      header.append(createElement("h3", "array-item__title", itemHeading(item, index, fallbackLabel)));
      const controls = createElement("div", "array-item__actions");
      const up = makeButton("上移", "mini-button", () => {
        if (index <= 0) return;
        [array[index - 1], array[index]] = [array[index], array[index - 1]];
        renderEditor();
        markDirty();
      });
      const down = makeButton("下移", "mini-button", () => {
        if (index >= array.length - 1) return;
        [array[index], array[index + 1]] = [array[index + 1], array[index]];
        renderEditor();
        markDirty();
      });
      const remove = makeButton("删除", "mini-button mini-button--danger", () => {
        if (!window.confirm(`确定删除“${itemHeading(item, index, fallbackLabel)}”吗？删除后仍需发布才会影响线上网站。`)) return;
        removePendingForObject(item, false);
        array.splice(index, 1);
        renderEditor();
        markDirty();
      });
      up.disabled = state.publishing || index === 0;
      down.disabled = state.publishing || index === array.length - 1;
      controls.append(up, down, remove);
      header.append(controls);
      const grid = createElement("div", "form-grid");
      renderFields(grid, item, descriptors, `${title}「${itemHeading(item, index, fallbackLabel)}」`);
      itemCard.append(header, grid);
      list.append(itemCard);
    });
    if (!array.length) list.append(createElement("p", "empty-list", "当前没有内容，请点击下方按钮新增。"));
    const addButton = makeButton(`新增${fallbackLabel}`, "button button--secondary array-add", () => {
      const item = deepClone(ARRAY_DEFAULTS[defaultKey]);
      if (defaultKey === "navigation") item.key = `custom-${Date.now()}`;
      array.push(item);
      renderEditor();
      markDirty();
    });
    body.append(list, addButton);
  }

  function addStringArraySection(title, description, array, itemLabel) {
    const body = createEditorCard(title, description);
    const list = createElement("div", "string-array-list");
    array.forEach((value, index) => {
      const row = createElement("div", "string-array-row");
      const id = nextFieldId("category");
      const label = createElement("label", "field-label", `${itemLabel} ${index + 1}`);
      label.htmlFor = id;
      const input = document.createElement("input");
      input.type = "text";
      input.id = id;
      input.value = stringValue(value);
      input.required = true;
      input.disabled = state.publishing;
      input.addEventListener("input", () => {
        array[index] = input.value;
        markDirty();
      });
      const controls = createElement("div", "array-item__actions");
      const up = makeButton("上移", "mini-button", () => {
        if (!index) return;
        [array[index - 1], array[index]] = [array[index], array[index - 1]];
        renderEditor();
        markDirty();
      });
      const down = makeButton("下移", "mini-button", () => {
        if (index >= array.length - 1) return;
        [array[index], array[index + 1]] = [array[index + 1], array[index]];
        renderEditor();
        markDirty();
      });
      const remove = makeButton("删除", "mini-button mini-button--danger", () => {
        if (!window.confirm(`确定删除“${stringValue(value)}”分类吗？`)) return;
        array.splice(index, 1);
        renderEditor();
        markDirty();
      });
      up.disabled = state.publishing || index === 0;
      down.disabled = state.publishing || index === array.length - 1;
      controls.append(up, down, remove);
      row.append(label, input, controls);
      list.append(row);
    });
    const add = makeButton("新增产品分类", "button button--secondary array-add", () => {
      array.push("新分类");
      renderEditor();
      markDirty();
    });
    body.append(list, add);
  }

  function renderEditor() {
    if (!state.data || !dom.editorSections) return;
    state.fieldCounter = 0;
    state.sectionCounter = 0;
    dom.editorSections.replaceChildren();

    addObjectSection("网站基本信息", "设置站点、企业与品牌标志信息。", state.data.site, FIELDSETS.site);
    addArraySection("导航菜单", "菜单按当前顺序显示；链接支持安全的站内路径及 http、https、mailto、tel。", state.data.navigation, FIELDSETS.navigation, "navigation", "菜单");
    addObjectSection("首页横幅", "设置首页首屏文字、按钮和主视觉图片。", state.data.hero, FIELDSETS.hero);
    addObjectSection("企业介绍", "设置首页企业介绍模块。", state.data.homeAbout, FIELDSETS.homeAbout);
    addArraySection("企业数据", "维护首页红色数据条中的数字和说明。", state.data.stats, FIELDSETS.stats, "stats", "数据");
    addObjectSection("产品中心设置", "设置首页产品模块标题。", state.data.productSection, FIELDSETS.productSection);
    addArraySection("首页产品分类", "维护首页展示的产品分类卡片。", state.data.productSection.categories, FIELDSETS.productCategory, "productCategory", "产品分类");
    addObjectSection("关于我们页面", "设置企业故事、智造实力与对应图片。", state.data.aboutPage, FIELDSETS.aboutPage);
    addObjectSection("企业优势设置", "设置优势模块的标题和说明。", state.data.advantages, FIELDSETS.advantageSettings);
    addArraySection("企业优势项目", "维护每一项企业优势。", state.data.advantages.items, FIELDSETS.advantageItem, "advantageItem", "优势");
    addObjectSection("服务流程设置", "设置服务流程模块标题。", state.data.process, FIELDSETS.processSettings);
    addArraySection("服务流程步骤", "维护服务流程的顺序、名称与说明。", state.data.process.items, FIELDSETS.processItem, "processItem", "流程步骤");
    addObjectSection("案例展示设置", "设置案例模块标题。", state.data.cases, FIELDSETS.casesSettings);
    addArraySection("案例项目", "维护案例内容、链接和图片。", state.data.cases.items, FIELDSETS.caseItem, "caseItem", "案例");
    addObjectSection("产品页面设置", "设置产品页面横幅和分类文字。", state.data.productsPage, FIELDSETS.productsPage);
    addStringArraySection("产品分类列表", "分类名称应与产品条目中的“产品分类”保持一致。", state.data.productsPage.categories, "分类");
    addArraySection("产品列表", "维护产品名称、简介、详情、分类、链接与图片。", state.data.productsPage.products, FIELDSETS.productItem, "productItem", "产品");
    addObjectSection("新闻模块设置", "设置首页新闻、新闻列表和详情页共用文字与横幅。", state.data.news, FIELDSETS.newsSettings);
    addArraySection("新闻动态", "新闻条目顺序同时决定首页、列表和详情页顺序。", state.data.news.items, FIELDSETS.newsItem, "newsItem", "新闻");
    addObjectSection("联系方式", "维护电话、微信、邮箱、地址、营业时间、地图和留言表单文字。", state.data.contact, FIELDSETS.contact);
    addObjectSection("页脚", "维护页脚介绍、栏目名称与版权信息。", state.data.footer, FIELDSETS.footer);
    addObjectSection("SEO 设置", "设置网页搜索标题、描述和关键词。", state.data.seo, FIELDSETS.seo);
    addObjectSection("网站配色", "颜色选择器与十六进制输入值会保持同步。", state.data.theme, FIELDSETS.theme);

    updateEditorMeta();
    refreshDirtyState();
  }

  function updateEditorMeta() {
    if (!state.data) return;
    setText(dom.siteNameHeading, state.data.site.siteName || "五金网站内容管理后台");
    setText(dom.repoMeta, `${githubConfig.owner}/${githubConfig.repo}`);
    setText(dom.branchMeta, githubConfig.branch);
    setText(dom.pathMeta, githubConfig.contentPath);
    setText(dom.lastLoadedMeta, state.loadedAt ? state.loadedAt.toLocaleString("zh-CN", { hour12: false }) : "尚未加载");
  }

  function previewImage(owner, fieldName, className) {
    const source = pendingPreviewSource(owner, fieldName);
    const image = document.createElement("img");
    image.className = className;
    image.alt = stringValue(owner[`${fieldName}Alt`]) || "预览图片";
    if (source) image.src = source;
    else image.hidden = true;
    return image;
  }

  function renderPreview() {
    if (!state.data || !dom.previewRoot) return;
    const data = state.data;
    dom.previewRoot.replaceChildren();
    dom.previewRoot.style.setProperty("--preview-primary", COLOR_PATTERN.test(data.theme.primaryColor) ? data.theme.primaryColor : "#df1838");
    dom.previewRoot.style.setProperty("--preview-secondary", COLOR_PATTERN.test(data.theme.secondaryColor) ? data.theme.secondaryColor : "#18191b");
    dom.previewRoot.style.setProperty("--preview-button", COLOR_PATTERN.test(data.theme.buttonColor) ? data.theme.buttonColor : "#df1838");

    const header = createElement("header", "site-preview__header");
    header.append(createElement("strong", "", data.site.companyName));
    const nav = createElement("nav", "site-preview__nav");
    data.navigation.slice(0, 5).forEach((item) => nav.append(createElement("span", "", item.label)));
    header.append(nav);

    const hero = createElement("section", "site-preview__hero");
    const heroSource = pendingPreviewSource(data.hero, "image");
    if (heroSource) hero.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,.7), rgba(0,0,0,.12)), url("${heroSource}")`;
    const heroCopy = createElement("div", "site-preview__hero-copy");
    heroCopy.append(createElement("small", "", data.hero.eyebrow));
    const heroTitle = createElement("h2", "", data.hero.title);
    heroTitle.append(document.createElement("br"), createElement("em", "", data.hero.highlight));
    heroCopy.append(heroTitle, createElement("p", "", data.hero.subtitle), createElement("span", "site-preview__button", data.hero.primaryButtonText));
    hero.append(heroCopy);

    const about = createElement("section", "site-preview__section site-preview__about");
    const aboutImage = previewImage(data.homeAbout, "image", "site-preview__image");
    const aboutCopy = createElement("div", "");
    aboutCopy.append(createElement("small", "", data.homeAbout.sectionEyebrow), createElement("h3", "", data.homeAbout.sectionTitle), createElement("p", "", data.homeAbout.body));
    about.append(aboutImage, aboutCopy);

    const products = createElement("section", "site-preview__section");
    products.append(createElement("small", "", data.productSection.eyebrow), createElement("h3", "", data.productSection.title));
    const productGrid = createElement("div", "site-preview__cards");
    data.productsPage.products.slice(0, 3).forEach((product) => {
      const card = createElement("article", "site-preview__card");
      card.append(previewImage(product, "image", "site-preview__card-image"), createElement("strong", "", product.name), createElement("p", "", product.summary));
      productGrid.append(card);
    });
    products.append(productGrid);

    const contact = createElement("section", "site-preview__contact");
    contact.append(createElement("h3", "", data.contact.title));
    [data.contact.phone, data.contact.wechat, data.contact.email, data.contact.address].forEach((value) => contact.append(createElement("span", "", value)));

    dom.previewRoot.append(header, hero, about, products, contact);
  }

  function validateDescriptors(object, descriptors, label, errors) {
    for (const descriptor of descriptors) {
      if (descriptor.type === "image") {
        const pending = findPendingImage(object, descriptor.key);
        const imagePath = pending && pending.uploadedPath ? pending.uploadedPath : stringValue(object[descriptor.key]);
        if (descriptor.required && !imagePath) errors.push(`${label}的${descriptor.label}不能为空`);
        if (imagePath && !isSafeImagePath(imagePath)) errors.push(`${label}的${descriptor.label}必须是 assets/ 下的安全 JPG、PNG 或 WebP 相对路径`);
        if (!stringValue(object[descriptor.altKey]).trim()) errors.push(`${label}的${descriptor.label}必须填写 alt 替代文字`);
        continue;
      }
      const value = stringValue(object[descriptor.key]).trim();
      if (descriptor.required && !value) errors.push(`${label}的${descriptor.label}不能为空`);
      if (descriptor.type === "link" && value && !isSafeLink(value)) errors.push(`${label}的${descriptor.label}包含不安全或不支持的链接`);
      if (descriptor.type === "color" && !COLOR_PATTERN.test(value)) errors.push(`${label}的${descriptor.label}必须使用 #RRGGBB 格式`);
      if (descriptor.type === "date" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push(`${label}的${descriptor.label}格式不正确`);
    }
  }

  function validateArray(array, descriptors, label, errors) {
    if (!Array.isArray(array) || !array.length) {
      errors.push(`${label}至少保留一项`);
      return;
    }
    array.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) errors.push(`${label}第 ${index + 1} 项格式不正确`);
      else validateDescriptors(item, descriptors, `${label}第 ${index + 1} 项`, errors);
    });
  }

  function validateAllContent() {
    const data = state.data;
    const errors = [];
    try {
      assertSiteStructure(data);
    } catch (_error) {
      return ["网站内容整体结构不正确"];
    }
    validateDescriptors(data.site, FIELDSETS.site, "网站基本信息", errors);
    validateArray(data.navigation, FIELDSETS.navigation, "导航菜单", errors);
    validateDescriptors(data.hero, FIELDSETS.hero, "首页横幅", errors);
    validateDescriptors(data.homeAbout, FIELDSETS.homeAbout, "企业介绍", errors);
    validateArray(data.stats, FIELDSETS.stats, "企业数据", errors);
    validateDescriptors(data.productSection, FIELDSETS.productSection, "产品中心设置", errors);
    validateArray(data.productSection.categories, FIELDSETS.productCategory, "首页产品分类", errors);
    validateDescriptors(data.aboutPage, FIELDSETS.aboutPage, "关于我们页面", errors);
    validateDescriptors(data.advantages, FIELDSETS.advantageSettings, "企业优势设置", errors);
    validateArray(data.advantages.items, FIELDSETS.advantageItem, "企业优势项目", errors);
    validateDescriptors(data.process, FIELDSETS.processSettings, "服务流程设置", errors);
    validateArray(data.process.items, FIELDSETS.processItem, "服务流程步骤", errors);
    validateDescriptors(data.cases, FIELDSETS.casesSettings, "案例展示设置", errors);
    validateArray(data.cases.items, FIELDSETS.caseItem, "案例项目", errors);
    validateDescriptors(data.productsPage, FIELDSETS.productsPage, "产品页面设置", errors);
    if (!data.productsPage.categories.length || data.productsPage.categories.some((item) => !stringValue(item).trim())) errors.push("产品分类列表不能包含空项且至少保留一项");
    validateArray(data.productsPage.products, FIELDSETS.productItem, "产品列表", errors);
    validateDescriptors(data.news, FIELDSETS.newsSettings, "新闻模块设置", errors);
    validateArray(data.news.items, FIELDSETS.newsItem, "新闻动态", errors);
    validateDescriptors(data.contact, FIELDSETS.contact, "联系方式", errors);
    validateDescriptors(data.footer, FIELDSETS.footer, "页脚", errors);
    validateDescriptors(data.seo, FIELDSETS.seo, "SEO 设置", errors);
    validateDescriptors(data.theme, FIELDSETS.theme, "网站配色", errors);
    if (data.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) errors.push("电子邮箱格式不正确");
    for (const pending of state.pendingImages) {
      if (!pending.file && !pending.uploadedPath) errors.push(`${pending.label}缺少待上传图片文件`);
    }
    return errors;
  }

  function showValidationErrors(errors) {
    const message = errors.length > 4
      ? `${errors.slice(0, 4).join("；")}；另有 ${errors.length - 4} 项需要修正。`
      : errors.join("；");
    setGlobalStatus(message, "error");
    if (dom.validationSummary && dom.validationList) {
      dom.validationList.replaceChildren();
      errors.forEach((error) => dom.validationList.append(createElement("li", "", error)));
      dom.validationSummary.hidden = false;
      dom.validationSummary.focus();
    }
    const firstInvalid = dom.editorSections && dom.editorSections.querySelector(":invalid");
    if (firstInvalid) {
      const details = firstInvalid.closest("details");
      if (details) details.open = true;
      firstInvalid.focus();
      firstInvalid.reportValidity();
    } else if (dom.editorSections) {
      dom.editorSections.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function loadBitmap(file) {
    if (typeof createImageBitmap === "function") return createImageBitmap(file);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("IMAGE_DECODE_FAILED"));
      };
      image.src = url;
    });
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
  }

  async function prepareImage(entry) {
    await validateImageFile(entry.file, entry.label);
    let bitmap;
    try {
      bitmap = await loadBitmap(entry.file);
    } catch (_error) {
      throw new ImageValidationError("浏览器无法解码这张图片。", entry.label);
    }
    const sourceWidth = bitmap.width || bitmap.naturalWidth;
    const sourceHeight = bitmap.height || bitmap.naturalHeight;
    if (!sourceWidth || !sourceHeight) {
      if (typeof bitmap.close === "function") bitmap.close();
      throw new ImageValidationError("无法读取图片尺寸。", entry.label);
    }
    const scale = Math.min(1, 1920 / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      if (typeof bitmap.close === "function") bitmap.close();
      return { blob: entry.file, extension: entry.extension.replace(".jpeg", ".jpg") };
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (typeof bitmap.close === "function") bitmap.close();

    let output = await canvasToBlob(canvas, "image/webp", 0.84);
    let extension = ".webp";
    if (!output || output.type !== "image/webp") {
      const fallbackMime = entry.file.type === "image/png" ? "image/png" : "image/jpeg";
      output = await canvasToBlob(canvas, fallbackMime, 0.86);
      extension = fallbackMime === "image/png" ? ".png" : ".jpg";
    }
    if (!output) {
      output = entry.file;
      extension = entry.extension.replace(".jpeg", ".jpg");
    }
    if (scale === 1 && output.size >= entry.file.size) {
      output = entry.file;
      extension = entry.extension.replace(".jpeg", ".jpg");
    }
    if (output.size > MAX_IMAGE_BYTES) throw new ImageValidationError("图片处理后仍超过 5MB，请先缩小图片。", entry.label);
    return { blob: output, extension };
  }

  function generateImagePath(prefix, extension) {
    if (!window.crypto || typeof window.crypto.randomUUID !== "function") throw new Error("当前浏览器不支持安全随机文件名，请升级浏览器后重试。");
    const safePrefix = String(prefix).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) || "image";
    return `${githubConfig.uploadDirectory}/${safePrefix}-${window.crypto.randomUUID()}${extension}`;
  }

  async function uploadPendingImage(entry) {
    if (entry.uploadedPath) return entry.uploadedPath;
    const prepared = await prepareImage(entry);
    const repositoryPath = generateImagePath(entry.prefix, prepared.extension);
    const payload = await githubRequest("PUT", contentPutEndpoint(repositoryPath), {
      message: "上传网站图片",
      content: await blobToBase64(prepared.blob),
      branch: githubConfig.branch
    });
    if (!payload || !payload.content || typeof payload.content.path !== "string") throw new ApiError(422);
    const relativePath = repositoryPath.slice("demo_0/".length);
    if (!isSafeImagePath(relativePath)) throw new ImageValidationError("上传后生成的图片路径不安全。", entry.label);
    entry.uploadedRepositoryPath = repositoryPath;
    entry.uploadedPath = relativePath;
    entry.owner[entry.fieldName] = relativePath;
    state.uploadedOrphans.push(relativePath);
    return relativePath;
  }

  function showPrimaryView(id) {
    [dom.connectionView, dom.loadingView, dom.editorView].forEach((view) => {
      if (view) view.hidden = view.id !== id;
    });
  }

  function setInteractiveDisabled(disabled) {
    state.publishing = disabled;
    document.querySelectorAll("button, input, textarea, select").forEach((control) => {
      if (dom.confirmPublishButton === control || dom.cancelPublishButton === control) return;
      control.disabled = disabled;
    });
    refreshDirtyState();
  }

  function startProgress() {
    if (dom.publishProgressList) dom.publishProgressList.replaceChildren();
    state.progressStep = 0;
    if (dom.publishProgressBar) {
      dom.publishProgressBar.max = 8 + state.pendingImages.length;
      dom.publishProgressBar.value = 0;
    }
    if (dom.publishOverlay) dom.publishOverlay.hidden = false;
  }

  function setPublishStage(message) {
    setText(dom.publishStage, message);
    state.progressStep += 1;
    if (dom.publishProgressBar) dom.publishProgressBar.value = Math.min(state.progressStep, Number(dom.publishProgressBar.max));
    if (!dom.publishProgressList) return;
    const previous = dom.publishProgressList.querySelector("li[data-current='true']");
    if (previous) {
      previous.dataset.current = "false";
      previous.dataset.complete = "true";
    }
    const item = createElement("li", "", message);
    item.dataset.current = "true";
    dom.publishProgressList.append(item);
  }

  function stopProgress() {
    if (dom.publishOverlay) dom.publishOverlay.hidden = true;
  }

  function confirmPublish() {
    if (!dom.confirmDialog || typeof dom.confirmDialog.showModal !== "function") {
      return Promise.resolve(window.confirm("发布后将修改线上网站内容，是否继续？"));
    }
    return new Promise((resolve) => {
      const finish = (confirmed) => {
        dom.confirmPublishButton.removeEventListener("click", onConfirm);
        dom.cancelPublishButton.removeEventListener("click", onCancel);
        dom.confirmDialog.removeEventListener("cancel", onCancel);
        if (dom.confirmDialog.open) dom.confirmDialog.close();
        resolve(confirmed);
      };
      const onConfirm = () => finish(true);
      const onCancel = (event) => {
        if (event) event.preventDefault();
        finish(false);
      };
      dom.confirmPublishButton.addEventListener("click", onConfirm);
      dom.cancelPublishButton.addEventListener("click", onCancel);
      dom.confirmDialog.addEventListener("cancel", onCancel);
      dom.confirmDialog.showModal();
    });
  }

  async function putSiteJson(data, sha) {
    const jsonText = `${JSON.stringify(data, null, 2)}\n`;
    return githubRequest("PUT", contentPutEndpoint(githubConfig.contentPath), {
      message: "通过内容管理后台更新五金网站",
      content: encodeUtf8Base64(jsonText),
      sha,
      branch: githubConfig.branch
    });
  }

  async function commitSiteWithOneConflictRetry(draft, sha) {
    try {
      return await putSiteJson(draft, sha);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 409) throw error;
      setPublishStage("检测到提交冲突，正在读取 GitHub 最新版本……");
      const latest = await fetchOnlineSite();
      if (!semanticEqual(latest.data, state.baseData)) throw new OnlineConflictError();
      setPublishStage("线上内容未变化，正在进行唯一一次安全重试……");
      return putSiteJson(draft, latest.sha);
    }
  }

  function orphanWarning() {
    const uniquePaths = [...new Set(state.uploadedOrphans)];
    if (!uniquePaths.length) return "";
    const visible = uniquePaths.slice(0, 5).join("、");
    const suffix = uniquePaths.length > 5 ? ` 等 ${uniquePaths.length} 个文件` : "";
    return ` 已成功上传但尚未写入 site.json 的图片可能成为孤立文件：${visible}${suffix}。重试发布会复用本次已上传图片。`;
  }

  function showPublishResult(payload) {
    if (!dom.resultPanel) return;
    const commit = payload && payload.commit ? payload.commit : {};
    const sha = stringValue(commit.sha);
    const commitUrl = sha
      ? `https://github.com/${encodeURIComponent(githubConfig.owner)}/${encodeURIComponent(githubConfig.repo)}/commit/${encodeURIComponent(sha)}`
      : "";
    const siteUrl = publicSiteUrl(true);
    dom.resultPanel.hidden = false;
    setText(dom.resultMessage, "发布成功，内容已经提交到 GitHub。GitHub Pages 通常需要 1 至 10 分钟完成更新，请 10 分钟后查看网站。");
    setText(dom.resultSha, sha || "GitHub 未返回提交 SHA");
    if (dom.resultCommitLink) {
      dom.resultCommitLink.textContent = sha ? "查看 GitHub 提交" : "提交链接不可用";
      dom.resultCommitLink.href = commitUrl || "#";
      dom.resultCommitLink.hidden = !commitUrl;
    }
    if (dom.resultSiteLink) {
      dom.resultSiteLink.textContent = siteUrl;
      dom.resultSiteLink.href = siteUrl;
    }
    setText(dom.resultTime, new Date().toLocaleString("zh-CN", { hour12: false }));
    if (dom.resultOpenSite) dom.resultOpenSite.href = siteUrl;
    dom.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function publishSite() {
    if (state.publishing) return;
    if (!state.token) {
      setGlobalStatus("GitHub 令牌已清除，请重新连接后再发布。当前编辑内容仍保留在本页面内存中。", "error");
      showPrimaryView("connectionView");
      return;
    }
    refreshDirtyState();
    if (!state.dirty) {
      setGlobalStatus("当前没有需要发布的修改。", "info");
      return;
    }
    const errors = validateAllContent();
    if (errors.length) {
      showValidationErrors(errors);
      return;
    }
    if (!(await confirmPublish())) return;

    setInteractiveDisabled(true);
    startProgress();
    if (dom.resultPanel) dom.resultPanel.hidden = true;
    let currentImage = null;
    try {
      setPublishStage("正在检查网站内容……");
      const validationErrors = validateAllContent();
      if (validationErrors.length) throw new Error(validationErrors[0]);

      const pending = [...state.pendingImages];
      setPublishStage("正在处理上传图片……");
      for (let index = 0; index < pending.length; index += 1) {
        currentImage = pending[index];
        setPublishStage(`正在上传第 ${index + 1} 张图片（共 ${pending.length} 张）：${currentImage.label}……`);
        await uploadPendingImage(currentImage);
      }
      currentImage = null;

      setPublishStage("正在读取 GitHub 最新版本……");
      const latest = await fetchOnlineSite();
      if (!semanticEqual(latest.data, state.baseData)) throw new OnlineConflictError();

      setPublishStage("正在生成网站 JSON……");
      state.data.updatedAt = new Date().toISOString();
      const draft = deepClone(state.data);
      setPublishStage("正在提交网站内容……");
      const resultPromise = commitSiteWithOneConflictRetry(draft, latest.sha);
      setPublishStage("正在等待 GitHub API 返回……");
      const result = await resultPromise;
      if (!result || !result.commit || !result.content || typeof result.content.sha !== "string") throw new ApiError(422);

      for (const entry of state.pendingImages) revokePendingPreview(entry);
      state.pendingImages = [];
      state.uploadedOrphans = [];
      state.baseData = deepClone(state.data);
      state.baseSha = result.content.sha;
      state.loadedAt = new Date();
      refreshDirtyState();
      renderEditor();
      setGlobalStatus("内容已提交到 GitHub，请等待 GitHub Pages 更新。", "success");
      showPublishResult(result);
    } catch (error) {
      const imagePrefix = currentImage ? `${currentImage.label}上传失败：` : "发布失败：";
      setGlobalStatus(`${imagePrefix}${friendlyError(error)}${orphanWarning()}`, "error");
    } finally {
      stopProgress();
      setInteractiveDisabled(false);
      refreshDirtyState();
    }
  }

  function clearAllPendingImages(restoreOriginal = false) {
    for (const entry of [...state.pendingImages]) removePendingEntry(entry, restoreOriginal);
    state.pendingImages = [];
  }

  function loadIntoEditor(data, sha) {
    clearAllPendingImages(false);
    state.uploadedOrphans = [];
    state.data = deepClone(data);
    state.baseData = deepClone(data);
    state.baseSha = sha;
    state.loadedAt = new Date();
    state.dirty = false;
    renderEditor();
    renderPreview();
    if (dom.validationSummary) dom.validationSummary.hidden = true;
    if (dom.resultPanel) dom.resultPanel.hidden = true;
    showPrimaryView("editorView");
  }

  function clearToken(showMessage = true) {
    state.token = "";
    TokenStore.clear();
    if (dom.tokenInput) dom.tokenInput.value = "";
    if (dom.rememberToken) dom.rememberToken.checked = false;
    if (showMessage) setGlobalStatus("GitHub 令牌已从内存、sessionStorage 和 localStorage 清除。", "success");
  }

  async function connectAndLoad() {
    if (state.publishing) return;
    const candidate = dom.tokenInput ? dom.tokenInput.value.trim() : "";
    if (!candidate) {
      if (dom.tokenInput) {
        dom.tokenInput.setCustomValidity("请输入 GitHub 令牌");
        dom.tokenInput.reportValidity();
        dom.tokenInput.focus();
      }
      setText(dom.connectionStatus, "请输入 GitHub 细粒度访问令牌。 ");
      return;
    }
    dom.tokenInput.setCustomValidity("");
    const hasDraft = Boolean(state.data && state.baseData && state.dirty);
    state.token = candidate;
    if (dom.connectButton) dom.connectButton.disabled = true;
    showPrimaryView("loadingView");
    setText(dom.loadingMessage, "正在连接 GitHub 并读取网站内容……");
    try {
      const online = await fetchOnlineSite();
      if (hasDraft && !semanticEqual(online.data, state.baseData)) throw new OnlineConflictError();
      const stored = TokenStore.save(candidate, Boolean(dom.rememberToken && dom.rememberToken.checked));
      if (hasDraft) {
        state.baseSha = online.sha;
        state.loadedAt = new Date();
        renderEditor();
        showPrimaryView("editorView");
        setGlobalStatus(stored ? "GitHub 已重新连接，未发布草稿已保留。" : "GitHub 已重新连接；浏览器阻止了令牌持久化，本次仅在内存中使用。", "success");
      } else {
        loadIntoEditor(online.data, online.sha);
        setGlobalStatus(stored ? "网站内容加载成功。" : "网站内容已加载；浏览器阻止了令牌持久化，本次仅在内存中使用。", "success");
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) state.token = "";
      showPrimaryView("connectionView");
      setText(dom.connectionStatus, friendlyError(error));
    } finally {
      if (dom.connectButton) dom.connectButton.disabled = false;
    }
  }

  async function reloadOnlineContent() {
    if (state.publishing) return;
    if (!state.token) {
      setGlobalStatus("请先重新连接 GitHub。", "error");
      showPrimaryView("connectionView");
      return;
    }
    if (state.dirty && !window.confirm("重新加载会放弃当前未发布修改，是否继续？")) return;
    showPrimaryView("loadingView");
    setText(dom.loadingMessage, "正在重新读取线上网站内容……");
    try {
      const online = await fetchOnlineSite();
      loadIntoEditor(online.data, online.sha);
      setGlobalStatus("已重新加载线上内容。", "success");
    } catch (error) {
      showPrimaryView("editorView");
      setGlobalStatus(friendlyError(error), "error");
    }
  }

  function undoChanges() {
    if (!state.dirty || !state.baseData) return;
    if (!window.confirm("确定撤销本次全部未发布修改吗？")) return;
    const warning = orphanWarning();
    clearAllPendingImages(false);
    state.data = deepClone(state.baseData);
    state.uploadedOrphans = [];
    renderEditor();
    renderPreview();
    setGlobalStatus(warning ? `已撤销本次修改。${warning}` : "已撤销本次全部未发布修改。", "success");
  }

  function cacheDom() {
    const ids = [
      "connectionView", "connectionForm", "connectionRepoMeta", "connectionBranchMeta", "tokenInput", "toggleTokenButton",
      "rememberToken", "connectButton", "clearTokenButton", "connectionStatus", "loadingView", "loadingMessage", "editorView",
      "siteNameHeading", "dirtyStatus", "openSiteLink", "repoMeta", "branchMeta", "pathMeta", "lastLoadedMeta",
      "validationSummary", "validationList", "editorSections", "previewPanel", "previewRoot", "previewButton", "closePreviewButton",
      "reloadButton", "undoButton", "publishButton", "clearTokenEditorButton", "resultPanel", "resultMessage", "resultSha",
      "resultCommitLink", "resultSiteLink", "resultTime", "resultOpenSite", "resultReloadButton", "publishOverlay", "publishStage",
      "publishProgressBar", "publishProgressList", "confirmDialog", "confirmPublishButton", "cancelPublishButton", "globalStatus"
    ];
    ids.forEach((id) => {
      dom[id] = getElement(id);
    });
  }

  function toggleTokenVisibility() {
    if (!dom.tokenInput || !dom.toggleTokenButton) return;
    const showing = dom.tokenInput.type === "text";
    dom.tokenInput.type = showing ? "password" : "text";
    dom.toggleTokenButton.textContent = showing ? "显示" : "隐藏";
    dom.toggleTokenButton.setAttribute("aria-label", showing ? "显示 GitHub 令牌" : "隐藏 GitHub 令牌");
    dom.toggleTokenButton.setAttribute("aria-pressed", String(!showing));
    dom.tokenInput.focus();
  }

  function clearTokenFromEditor() {
    clearToken(true);
    setText(dom.connectionStatus, state.dirty
      ? "令牌已清除。当前未发布草稿仍保留在页面内存中；重新连接同一线上版本后可继续编辑。"
      : "令牌已清除，请输入新令牌后重新连接。 ");
    showPrimaryView("connectionView");
    if (dom.tokenInput) dom.tokenInput.focus();
  }

  function bindEvents() {
    dom.connectionForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      connectAndLoad();
    });
    dom.connectButton?.addEventListener("click", connectAndLoad);
    dom.toggleTokenButton?.addEventListener("click", toggleTokenVisibility);
    dom.clearTokenButton?.addEventListener("click", () => {
      clearToken(true);
      setText(dom.connectionStatus, "GitHub 令牌已从当前浏览器清除。 ");
      dom.tokenInput?.focus();
    });
    dom.reloadButton?.addEventListener("click", reloadOnlineContent);
    dom.resultReloadButton?.addEventListener("click", reloadOnlineContent);
    dom.undoButton?.addEventListener("click", undoChanges);
    dom.publishButton?.addEventListener("click", publishSite);
    dom.clearTokenEditorButton?.addEventListener("click", clearTokenFromEditor);
    dom.previewButton?.addEventListener("click", () => {
      if (!dom.previewPanel) return;
      dom.previewPanel.hidden = false;
      dom.previewButton.setAttribute("aria-expanded", "true");
      renderPreview();
      dom.previewRoot?.focus();
    });
    dom.closePreviewButton?.addEventListener("click", () => {
      if (!dom.previewPanel) return;
      dom.previewPanel.hidden = true;
      dom.previewButton?.setAttribute("aria-expanded", "false");
      dom.previewButton?.focus();
    });
    window.addEventListener("beforeunload", (event) => {
      if (!state.publishing) return;
      event.preventDefault();
      event.returnValue = "";
    });
    window.addEventListener("pagehide", () => {
      state.pendingImages.forEach(revokePendingPreview);
    });
  }

  function initializeStaticMeta() {
    setText(dom.connectionRepoMeta, `${githubConfig.owner}/${githubConfig.repo}`);
    setText(dom.connectionBranchMeta, githubConfig.branch);
    if (dom.openSiteLink) dom.openSiteLink.href = publicSiteUrl(false);
    if (dom.resultSiteLink) dom.resultSiteLink.href = publicSiteUrl(false);
    if (dom.resultOpenSite) dom.resultOpenSite.href = publicSiteUrl(false);
  }

  function init() {
    cacheDom();
    try {
      validateConfig();
      initializeStaticMeta();
    } catch (error) {
      setText(dom.connectionStatus, error.message || "后台配置无法读取。 ");
      if (dom.connectButton) dom.connectButton.disabled = true;
      return;
    }
    const stored = TokenStore.read();
    if (stored.token && dom.tokenInput) dom.tokenInput.value = stored.token;
    if (dom.rememberToken) dom.rememberToken.checked = stored.remembered;
    if (stored.token) setText(dom.connectionStatus, "已从当前浏览器读取保存的令牌，请点击“连接并加载网站”进行验证。 ");
    if (dom.previewButton) dom.previewButton.setAttribute("aria-expanded", String(!dom.previewPanel?.hidden));
    bindEvents();
    refreshDirtyState();
  }

  init();
})();
