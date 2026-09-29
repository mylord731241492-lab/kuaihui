(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SHARED = '__shared__', GLOBAL = '__global__';
  const defaults = { aiReplyStrategy: 'AI_RGA', aiHumanReplyType: 0, subAccount: '', aiSensitiveWords: [], aiReplyFlag: '.', aiWorkMode: 0 };
  const state = {
    loaded: false, busy: false, tab: 'knowledge', shops: [], globalConfig: { ...defaults }, singleShopConfig: {},
    knowledgeScope: SHARED, configScope: GLOBAL, records: [], selectedId: null,
    recordBaseline: '', configBaseline: '', customConfig: null, pendingSelection: null, lastSaved: '', allowClose: false,
    transferMode: 'export', transferScope: SHARED, recordTitleType: '',
    runtime: null, runtimeLoaded: false, runtimeBaseline: '', products: [], productScope: '', selectedProductId: null,
    productBaseline: '', productsLoaded: false, productsError: '',
  };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const splitValues = value => [...new Set((Array.isArray(value) ? value : String(value || '').split(/[,，;；、\n]/)).map(item => String(item).trim()).filter(Boolean))];
  const imageValues = value => {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    const text = String(value || '').trim();
    if (!text) return [];
    if (text.startsWith('[')) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { throw Error('图片地址数组格式不正确。'); }
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) throw Error('图片地址应为文本数组。');
      return parsed.map(item => item.trim()).filter(Boolean);
    }
    return text.split(/[,，\n]/).map(item => item.trim()).filter(Boolean);
  };
  const nameOf = scope => scope === SHARED ? '公共知识库' : scope === GLOBAL ? '全局回复设置' : state.shops.find(shop => String(shop.id) === String(scope))?.shopName || '未命名店铺';
  const platformOf = scope => {
    const value = String(state.shops.find(shop => String(shop.id) === String(scope))?.platformType || '');
    return ({ 4: '拼多多', 5: '抖店', 6: '快手', 7: '小红书', 8: '视频号', 11: '淘工厂' })[value] || value;
  };
  const existingScope = value => String(value) === SHARED || state.shops.some(shop => String(shop.id) === String(value));
  const errorText = error => String(error?.message || error || '操作失败，请重试。');
  async function call(action, data) {
    if (!window.juheAi?.call) throw Error('页面连接尚未就绪，请关闭窗口后重新打开。');
    const result = await window.juheAi.call(action, data);
    if (result?.error) throw Error(typeof result.error === 'string' ? result.error : result.error.message || '操作失败，请重试。');
    return result;
  }
  function notify(message, type = 'info') {
    const notice = $('notification');
    notice.textContent = message;
    notice.className = 'notification ' + type;
    notice.hidden = !message;
    notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const dialogError = $('transfer-error');
    if (dialogError) {
      dialogError.textContent = type === 'error' ? message : '';
      dialogError.hidden = type !== 'error' || !message;
    }
  }
  function recordFormValue() {
    return {
      title: $('record-title').value, content: $('record-content').value,
      scenarios: splitValues($('record-scenarios').value), sendType: Number($('record-send-type').value),
      titleType: String(state.recordTitleType) === $('record-title-type').value ? state.recordTitleType : $('record-title-type').value,
      goodId: $('record-good-id').value, imageurls: $('record-image-urls').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean),
    };
  }
  function configFormValue() {
    const config = {
      aiReplyStrategy: $('config-strategy').value, aiHumanReplyType: Number($('config-human-type').value),
      subAccount: $('config-sub-account').value, aiSensitiveWords: splitValues($('config-sensitive-words').value),
      aiReplyFlag: $('config-reply-flag').value, aiWorkMode: Number($('config-work-mode').value),
    };
    if (state.configScope !== GLOBAL) config.isEnabled = !$('config-inherit').checked;
    return config;
  }
  const recordDirty = () => state.loaded && state.recordBaseline !== JSON.stringify(recordFormValue());
  const configDirty = () => state.loaded && state.configBaseline !== JSON.stringify(configFormValue());
  function runtimeFormValue() {
    const value = { baseUrl: $('runtime-base-url').value.trim(), model: $('runtime-model').value.trim(), apiFormat: $('runtime-format').value,
      enabled: $('runtime-enabled').checked, autoLearn: $('runtime-auto-learn').checked,
      enabledShopIds: [...$('runtime-shops').querySelectorAll('input:checked')].map(node => node.value).sort() };
    if ($('runtime-api-key').value.trim()) value.apiKey = $('runtime-api-key').value.trim();
    return value;
  }
  function productFormValue() {
    return { productId: $('product-id').value.trim(), title: $('product-title').value.trim(), content: $('product-content').value.trim(),
      images: $('product-images').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean), source: 'manual' };
  }
  const runtimeDirty = () => state.runtimeLoaded && state.runtimeBaseline !== JSON.stringify(runtimeFormValue());
  const productDirty = () => state.loaded && state.productBaseline !== JSON.stringify(productFormValue());
  const anyDirty = () => recordDirty() || configDirty() || runtimeDirty() || productDirty();
  function updateStatus() {
    const knowledgeChanged = recordDirty(), configChanged = configDirty(), runtimeChanged = runtimeDirty(), productChanged = productDirty();
    $('record-dirty').hidden = !knowledgeChanged;
    $('config-dirty').hidden = !configChanged;
    $('runtime-dirty').hidden = !runtimeChanged;
    $('product-dirty').hidden = !productChanged;
    const status = $('save-state');
    status.classList.toggle('unsaved', knowledgeChanged || configChanged || runtimeChanged || productChanged);
    status.textContent = state.busy ? '正在处理…' : !state.loaded ? '尚未读取本机配置' : knowledgeChanged || configChanged || runtimeChanged || productChanged ? '有未保存的修改' : state.lastSaved ? '已保存到本机 · ' + state.lastSaved : '当前账号的本机资料';
  }
  function updateLocks() {
    const disabled = state.busy || !state.loaded;
    document.querySelectorAll('[data-lock]').forEach(node => { node.disabled = disabled; });
    $('config-fields').disabled = disabled || state.configScope !== GLOBAL && $('config-inherit').checked;
    $('record-delete').disabled = disabled || state.selectedId === null;
    $('knowledge-copy').disabled = disabled || !state.records.length || !state.shops.some(shop => String(shop.id) !== state.knowledgeScope);
    $('knowledge-export').disabled = disabled || !state.records.length;
    $('transfer-submit').disabled = state.busy;
    $('transfer-cancel').disabled = state.busy;
    $('close-window').disabled = state.busy;
    $('runtime-fields').disabled = disabled || !state.runtimeLoaded;
    $('runtime-save').disabled = disabled || !state.runtimeLoaded;
    $('runtime-test').disabled = disabled || !state.runtimeLoaded || !state.runtime?.hasApiKey;
    $('product-fields').disabled = disabled || !state.productScope;
    for (const id of ['product-save', 'product-new', 'product-reset', 'products-refresh', 'products-collect']) $(id).disabled = disabled || !state.productScope;
    $('product-learn').disabled = disabled || !state.selectedProductId || !state.runtime?.ready;
    $('preview-submit').disabled = disabled || !state.runtime?.ready;
    updateStatus();
  }
  function saved(message) {
    state.lastSaved = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    notify(message, 'success');
  }
  async function perform(task) {
    if (state.busy) return;
    state.busy = true; updateLocks(); notify('');
    try { await task(); }
    catch (error) { notify(errorText(error), 'error'); }
    finally {
      state.busy = false; updateLocks();
      if (state.pendingSelection) {
        const selection = state.pendingSelection;
        state.pendingSelection = null;
        queueMicrotask(() => applySelection(selection));
      }
    }
  }
  function confirmAction(title, message, accept = '确定', cancel = '取消', danger = false) {
    const dialog = $('confirm-dialog');
    if (dialog.open) return Promise.resolve(false);
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-accept').textContent = accept;
    $('confirm-cancel').textContent = cancel;
    $('confirm-accept').className = 'button ' + (danger ? 'danger' : 'primary');
    dialog.returnValue = 'cancel';
    return new Promise(resolve => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'accept'), { once: true });
      dialog.showModal();
      $('confirm-cancel').focus();
    });
  }
  async function allowDiscard(kind = 'record') {
    const dirty = kind === 'both' ? anyDirty() : kind === 'config' ? configDirty() : kind === 'product' ? productDirty() : kind === 'runtime' ? runtimeDirty() : recordDirty();
    return !dirty || confirmAction('放弃未保存的修改？', '当前修改还没有保存。继续操作将放弃这些修改。', '放弃修改', '继续编辑');
  }
  function setTab(tab) {
    if (state.tab !== tab) notify('');
    state.tab = tab;
    for (const name of ['knowledge', 'replies', 'runtime', 'products', 'preview']) {
      const active = name === tab;
      $('tab-' + name).classList.toggle('active', active);
      $('tab-' + name).setAttribute('aria-selected', String(active));
      $(name + '-panel').hidden = !active;
    }
    if (tab === 'products' && !state.productsLoaded && state.productScope && !state.busy) perform(() => loadProducts(state.productScope));
    if (tab === 'preview' && !state.busy) perform(loadHistory);
  }
  function fillScopes() {
    for (const [id, defaultValue, defaultLabel] of [['knowledge-scope', SHARED, '公共知识库'], ['config-scope', GLOBAL, '全局回复设置']]) {
      const select = $(id), first = element('option', '', defaultLabel);
      first.value = defaultValue; select.replaceChildren(first);
      for (const shop of state.shops) {
        const platform = platformOf(shop.id), option = element('option', '', shop.shopName + (platform ? ' · ' + platform : ''));
        option.value = String(shop.id); select.append(option);
      }
    }
    for (const id of ['product-scope', 'preview-scope']) {
      const select = $(id); select.replaceChildren();
      if (id === 'preview-scope') { const option = element('option', '', '公共知识库（不指定店铺）'); option.value = SHARED; select.append(option); }
      for (const shop of state.shops) { const option = element('option', '', shop.shopName); option.value = String(shop.id); select.append(option); }
      if (id === 'product-scope' && !state.shops.length) { const option = element('option', '', '暂无店铺'); option.value = ''; select.append(option); }
    }
    state.productScope = $('product-scope').value;
    $('runtime-shops').replaceChildren();
    for (const shop of state.shops) {
      const label = element('label', 'shop-choice'), input = element('input'); input.type = 'checkbox'; input.value = String(shop.id);
      label.append(input, element('span', '', shop.shopName)); $('runtime-shops').append(label);
    }
    $('runtime-no-shops').hidden = state.shops.length > 0;
  }
  function renderRecords() {
    const query = $('knowledge-search').value.trim().toLocaleLowerCase();
    const records = state.records.filter(record => !query || [record.title, record.content, ...splitValues(record.scenarios)].join('\n').toLocaleLowerCase().includes(query));
    $('record-count').textContent = state.records.length + ' 条知识';
    $('list-count').textContent = query ? '找到 ' + records.length + ' 条' : String(records.length);
    const list = $('knowledge-list'); list.replaceChildren();
    for (const record of records) {
      const button = element('button', 'record-item' + (String(record.id) === String(state.selectedId) ? ' selected' : ''));
      button.type = 'button'; button.dataset.recordId = String(record.id); button.setAttribute('data-lock', '');
      button.setAttribute('aria-pressed', String(String(record.id) === String(state.selectedId)));
      button.append(element('strong', '', record.title || '未命名问题'), element('p', '', record.content || ''));
      const scenarios = splitValues(record.scenarios);
      if (scenarios.length) {
        const tags = element('div', 'record-tags');
        for (const scenario of scenarios.slice(0, 3)) tags.append(element('span', 'record-tag', scenario));
        button.append(tags);
      }
      button.addEventListener('click', () => {
        if (String(state.selectedId) === String(record.id)) return;
        perform(async () => { if (await allowDiscard()) { fillRecord(record); renderRecords(); } });
      });
      list.append(button);
    }
    $('knowledge-empty').hidden = records.length > 0;
    $('knowledge-empty').querySelector('strong').textContent = query ? '没有匹配的知识' : '还没有知识';
    $('knowledge-empty').querySelector('p').textContent = query ? '试试其他关键词，或清空搜索。' : '在右侧写下第一个问题和答案，\n也可以从 JSON 或 CSV 文件导入。';
    updateLocks();
  }
  function fillRecord(record = null) {
    state.selectedId = record?.id ?? null;
    $('editor-title').textContent = record ? '编辑知识' : '新增知识';
    $('editor-scope').textContent = nameOf(state.knowledgeScope);
    $('record-title').value = record?.title || '';
    $('record-content').value = record?.content || '';
    $('record-scenarios').value = splitValues(record?.scenarios).join('、');
    $('record-send-type').value = String(Number(record?.sendType) === 1 ? 1 : 0);
    $('record-title-type').value = record?.titleType ?? '';
    state.recordTitleType = record?.titleType ?? '';
    $('record-good-id').value = record?.goodId ?? '';
    $('record-image-urls').value = imageValues(record?.imageurls).join('\n');
    $('legacy-draft-note').hidden = true;
    state.recordBaseline = JSON.stringify(recordFormValue());
    updateLocks();
  }
  function fillLegacyDraft(record) {
    fillRecord({ ...record, id: undefined });
    $('editor-title').textContent = '旧版资料草稿';
    $('legacy-draft-note').hidden = false;
    if (record.goodId || record.imageurls?.length) document.querySelector('.record-details').open = true;
    state.recordBaseline = '{}';
    updateStatus();
  }
  async function loadRecords(scope, selectedId = null) {
    const result = await call('knowledge-list', { shopId: scope });
    if (!Array.isArray(result?.records)) throw Error('知识列表格式不正确，请重试。');
    state.knowledgeScope = scope;
    $('knowledge-scope').value = scope;
    $('knowledge-scope-note').textContent = scope === SHARED ? '当前账号的公共知识，可复制到指定店铺。' : '此范围下的知识保存在当前账号的本机工作空间。';
    state.records = result.records;
    $('knowledge-search').value = '';
    fillRecord(selectedId === null ? null : state.records.find(record => String(record.id) === String(selectedId)) || null);
    renderRecords();
  }
  function normalizeConfig(input) {
    const source = { ...defaults, ...input };
    return {
      ...source,
      aiReplyStrategy: source.aiReplyStrategy === 'AI_RGA_FILTER' ? 'AI_RGA_FILTER' : 'AI_RGA',
      aiHumanReplyType: [0, 1, 2].includes(Number(source.aiHumanReplyType)) ? Number(source.aiHumanReplyType) : 0,
      aiSensitiveWords: splitValues(source.aiSensitiveWords), aiWorkMode: Number(source.aiWorkMode) === 1 ? 1 : 0,
      aiReplyFlag: source.aiReplyFlag ?? '.', subAccount: source.subAccount || '',
    };
  }
  function setConfigFields(config) {
    const value = normalizeConfig(config);
    $('config-strategy').value = value.aiReplyStrategy;
    $('config-work-mode').value = String(value.aiWorkMode);
    $('config-human-type').value = String(value.aiHumanReplyType);
    $('config-sensitive-words').value = value.aiSensitiveWords.join('、');
    $('config-reply-flag').value = value.aiReplyFlag;
    $('config-sub-account').value = value.subAccount;
    updateHumanOptions();
  }
  function updateHumanOptions() {
    const restricted = ['视频号', '淘工厂'].includes(platformOf(state.configScope));
    $('config-human-type').querySelector('option[value="2"]').disabled = restricted;
    $('human-type-note').hidden = !restricted;
    if (restricted && $('config-human-type').value === '2') $('config-human-type').value = '0';
    const subAccount = $('config-human-type').value === '1';
    $('sub-account-field').hidden = !subAccount;
    $('config-sub-account').required = subAccount && (state.configScope === GLOBAL || !$('config-inherit').checked);
  }
  function fillConfig(scope) {
    state.configScope = scope;
    $('config-scope').value = scope;
    const isGlobal = scope === GLOBAL, custom = state.singleShopConfig[scope];
    $('inherit-row').hidden = isGlobal;
    $('config-inherit').checked = !custom?.isEnabled;
    state.customConfig = normalizeConfig(custom || state.globalConfig);
    setConfigFields(isGlobal || $('config-inherit').checked ? state.globalConfig : state.customConfig);
    state.configBaseline = JSON.stringify(configFormValue());
    updateLocks();
  }
  function fillRuntime(status) {
    if (!status || typeof status !== 'object' || typeof status.hasApiKey !== 'boolean') throw Error('模型配置返回格式不正确，请重试。');
    // The main process only returns public connection fields. Never retain a key in UI state.
    state.runtime = { baseUrl: String(status.baseUrl || ''), model: String(status.model || ''), apiFormat: status.apiFormat === 'responses' ? 'responses' : 'chat-completions',
      hasApiKey: status.hasApiKey, enabled: status.enabled === true, autoLearn: status.autoLearn === true, ready: status.ready === true,
      enabledShopIds: Array.isArray(status.enabledShopIds) ? status.enabledShopIds.map(String) : [], lastProbe: status.lastProbe || null };
    const value = state.runtime;
    $('runtime-base-url').value = value.baseUrl;
    $('runtime-model').value = value.model;
    $('runtime-format').value = value.apiFormat;
    $('runtime-enabled').checked = value.enabled;
    $('runtime-auto-learn').checked = value.autoLearn;
    $('runtime-api-key').value = '';
    $('runtime-api-key').placeholder = value.hasApiKey ? '已保存；留空保留，填写则替换' : '输入新密钥';
    $('runtime-key-status').textContent = value.hasApiKey ? '密钥已保存，不回显。留空可保留已有密钥。' : '尚未保存密钥。';
    for (const input of $('runtime-shops').querySelectorAll('input')) input.checked = value.enabledShopIds.includes(input.value);
    state.runtimeLoaded = true;
    state.runtimeBaseline = JSON.stringify(runtimeFormValue());
    $('runtime-load-error').hidden = true;
    const caption = value.ready ? value.enabled && value.enabledShopIds.length ? '已启用选定店铺' : '已配置 · 自动回复关闭' : '模型连接尚未配置完成';
    for (const id of ['sidebar-runtime-status', 'footer-runtime-status', 'runtime-ready']) $(id).textContent = caption;
    if (value.lastProbe) renderProbe(value.lastProbe);
    updateLocks();
  }
  function renderProbe(result) {
    if (!result || typeof result !== 'object') throw Error('连接测试未返回有效结果。');
    const success = result.ok === true || result.success === true;
    const detail = String(result.message || result.error || (success ? '模型已返回测试结果。' : '模型未返回成功结果，请检查地址、格式、模型名称和密钥。'));
    $('runtime-probe').textContent = (success ? '连接测试成功：' : '连接测试失败：') + detail;
    $('runtime-probe').className = 'probe-result notification ' + (success ? 'success' : 'error');
    $('runtime-probe').hidden = false;
  }
  async function loadRuntime() {
    try { fillRuntime(await call('runtime-status')); }
    catch (error) {
      state.runtimeLoaded = false;
      $('runtime-load-error').textContent = '无法读取模型连接：' + errorText(error);
      $('runtime-load-error').hidden = false;
      for (const id of ['sidebar-runtime-status', 'footer-runtime-status', 'runtime-ready']) $(id).textContent = '模型连接读取失败';
    }
  }
  const productSource = product => product?.observed?.source === 'manual' ? '手动补充' : product?.observed?.source ? '平台采集 · ' + product.observed.source : '来源未标明';
  function productStatus(product) {
    if (product?.stale) return '资料已更新 · 待重新学习';
    return ({ learned: '已学习', learning: '学习中', failed: '学习失败', unlearned: '待学习' })[product?.learning] || '待学习';
  }
  function displayTime(value) {
    if (!value) return '时间未记录';
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? '时间未记录' : date.toLocaleString('zh-CN');
  }
  function fillProduct(product = null) {
    const observed = product?.observed || {};
    state.selectedProductId = product?.productId ?? null;
    $('product-id').value = product?.productId || '';
    $('product-id').readOnly = !!product;
    $('product-title').value = observed.title || '';
    $('product-content').value = observed.description || '';
    $('product-images').value = Array.isArray(observed.images) ? observed.images.join('\n') : '';
    $('product-editor-title').textContent = product ? '商品资料 · ' + productStatus(product) : '手动补充资料';
    $('product-meta').textContent = product ? productSource(product) + ' · ' + displayTime(observed.collectedAt || product.updatedAt) + (observed.source !== 'manual' ? '。修改后保存会标为手动补充。' : '') : '手动资料与平台采集资料分别标明来源。';
    const learned = product?.learning === 'learned' && !product.stale;
    $('product-learned').hidden = !learned && !product?.lastError;
    $('product-learned').querySelector('h3').textContent = learned ? '整理后的商品知识' : '上次学习未成功';
    $('product-learned-text').textContent = learned ? String(product.summary || '模型已整理商品知识。') : String(product?.lastError || '');
    state.productBaseline = JSON.stringify(productFormValue());
    updateLocks();
  }
  function renderProducts() {
    $('product-count').textContent = state.products.length + ' 件商品';
    $('product-list').replaceChildren();
    for (const product of state.products) {
      const button = element('button', 'record-item' + (String(product.productId) === String(state.selectedProductId) ? ' selected' : ''));
      button.type = 'button'; button.setAttribute('data-lock', ''); button.dataset.productId = String(product.productId);
      button.setAttribute('aria-pressed', String(String(product.productId) === String(state.selectedProductId)));
      button.append(element('strong', '', product.observed?.title || product.productId), element('p', '', productSource(product) + '\n采集时间：' + displayTime(product.observed?.collectedAt || product.updatedAt)));
      const tags = element('div', 'record-tags'); tags.append(element('span', 'record-tag', productStatus(product))); button.append(tags);
      button.addEventListener('click', () => perform(async () => { if (await allowDiscard('product')) { fillProduct(product); renderProducts(); } }));
      $('product-list').append(button);
    }
    $('product-empty').hidden = state.products.length > 0;
    updateLocks();
  }
  async function loadProducts(scope, selectedId = state.selectedProductId) {
    const result = await call('products-list', { shopId: scope });
    if (!Array.isArray(result?.products)) throw Error('商品列表格式不正确，请重试。');
    state.productScope = scope; $('product-scope').value = scope;
    state.products = result.products; state.productsLoaded = true;
    fillProduct(state.products.find(product => String(product.productId) === String(selectedId)) || null);
    renderProducts();
  }
  function putProduct(product) {
    if (!product?.productId || !product.observed || !product.learning) throw Error('商品返回结果不完整，请刷新列表确认。');
    const index = state.products.findIndex(item => String(item.productId) === String(product.productId));
    if (index < 0) state.products.unshift(product); else state.products[index] = product;
    fillProduct(product); renderProducts();
  }
  function renderPreview(result) {
    if (!result || typeof result !== 'object' || !String(result.answer || '').trim() && result.needsHuman !== true) throw Error('试答没有返回有效内容，请重试。');
    $('preview-empty').hidden = true; $('preview-output').hidden = false;
    $('preview-outcome').textContent = result.needsHuman ? '需要人工处理' : '可回复';
    $('preview-outcome').classList.toggle('human-required', result.needsHuman === true);
    $('preview-reason').textContent = String(result.reason || (result.needsHuman ? '没有足够依据，请由人工处理。' : '已按当前保存的设置生成。'));
    $('preview-answer').textContent = String(result.answer || '本次未生成自动回复。');
    $('preview-sources').replaceChildren();
    const sources = Array.isArray(result.sources) ? result.sources : [];
    for (const source of sources) $('preview-sources').append(element('li', '', String(source.title || source.id || '知识资料')));
    if (!sources.length) $('preview-sources').append(element('li', '', '没有引用已保存的知识。'));
    const matched = Array.isArray(result.matchedRecords) ? result.matchedRecords.length : Number(result.matchedRecords);
    $('preview-source-heading').textContent = '参考资料' + (Number.isFinite(matched) ? ' · 命中 ' + matched + ' 条' : '');
    $('preview-request-id').textContent = result.requestId ? '请求编号：' + String(result.requestId) : '';
    $('preview-result').scrollTop = 0;
  }
  async function loadHistory() {
    const scope = $('preview-scope').value;
    try {
      const result = await call('runtime-history', { shopId: scope });
      if (!Array.isArray(result?.records)) throw Error('记录格式不正确。');
      $('runtime-history').replaceChildren();
      $('history-message').textContent = result.records.length ? '可把未解决的问题补充为知识，检查并保存后再次试答。' : '此范围还没有试答或接待记录。';
      for (const record of result.records.slice(0, 20)) {
        const item = element('article', 'history-item');
        item.append(element('strong', '', record.question || '未记录问题'), element('p', 'field-note', (record.kind === 'conversation' ? '客户接待' : '试答') + ' · ' + displayTime(record.at) + ' · ' + (record.needsHuman ? '需要人工处理' : '已生成回复')));
        if (record.reason) item.append(element('p', 'field-note', record.reason));
        const add = element('button', 'button quiet', '补充为知识'); add.type = 'button'; add.setAttribute('data-lock', '');
        add.addEventListener('click', () => perform(async () => {
          if (!(await allowDiscard())) return;
          await loadRecords(scope);
          fillRecord({title: record.question || '', content: record.needsHuman ? '' : record.answer || ''});
          $('editor-title').textContent = '补充知识'; state.recordBaseline = '{}';
          setTab('knowledge'); updateStatus(); $('record-content').focus();
        }));
        item.append(add); $('runtime-history').append(item);
      }
      updateLocks();
    } catch (error) {
      $('runtime-history').replaceChildren();
      $('history-message').textContent = '最近记录读取失败：' + errorText(error);
    }
  }
  async function applySelection(selection) {
    if (!selection || typeof selection !== 'object') return;
    if (state.busy || !state.loaded || $('transfer-dialog').open) { state.pendingSelection = selection; return; }
    const scope = selection.shopId === undefined ? state.knowledgeScope : String(selection.shopId);
    if (!existingScope(scope)) { notify('这家店铺暂未出现在当前账号中，请重新打开配置。', 'error'); return; }
    if (scope === state.knowledgeScope && selection.entryId === undefined && !selection.record) return;
    await perform(async () => {
      if (!(await allowDiscard('both'))) return;
      await loadRecords(scope, selection.entryId ?? null);
      if (selection.record && typeof selection.record === 'object') fillLegacyDraft(selection.record);
      fillConfig(scope === SHARED ? GLOBAL : scope);
      setTab('knowledge');
    });
  }
  async function initialize() {
    await perform(async () => {
      $('initial-error').hidden = true;
      try {
        const data = await call('snapshot');
        state.shops = (Array.isArray(data?.shops) ? data.shops : []).filter(shop => shop && shop.id !== null && shop.id !== undefined).map(shop => ({ ...shop, shopName: String(shop.shopName || '未命名店铺') }));
        state.globalConfig = normalizeConfig(data?.globalConfig);
        state.singleShopConfig = data?.singleShopConfig && typeof data.singleShopConfig === 'object' ? data.singleShopConfig : {};
        fillScopes();
        const selection = state.pendingSelection || data?.selection || {};
        state.pendingSelection = null;
        const scope = selection.shopId !== undefined && existingScope(selection.shopId) ? String(selection.shopId) : SHARED;
        await loadRecords(scope, selection.entryId ?? null);
        if (selection.record && typeof selection.record === 'object') fillLegacyDraft(selection.record);
        fillConfig(scope === SHARED ? GLOBAL : scope);
        fillProduct();
        state.loaded = true;
        await loadRuntime();
        if (Array.isArray(data?.warnings) && data.warnings.length) notify(String(data.warnings[0]));
        updateLocks();
      } catch (error) {
        state.loaded = false;
        $('initial-error-text').textContent = errorText(error);
        $('initial-error').hidden = false;
        throw error;
      }
    });
  }
  function download(filename, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const link = element('a'); link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  const csvColumns = ['title', 'content', 'scenarios', 'sendType', 'titleType', 'goodId', 'imageurls'];
  function toCsv(records) {
    const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    return '\uFEFF' + [csvColumns, ...records.map(record => csvColumns.map(key => key === 'scenarios' ? JSON.stringify(splitValues(record[key])) : key === 'imageurls' ? JSON.stringify(imageValues(record[key])) : record[key] ?? ''))].map(row => row.map(quote).join(',')).join('\r\n');
  }
  function parseCsv(text) {
    const rows = []; let row = [], value = '', quoted = false, afterQuote = false;
    for (let index = 0; index < text.length; index++) {
      const character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') { value += '"'; index++; }
        else if (character === '"') { quoted = false; afterQuote = true; }
        else value += character;
      } else if (character === '"' && !value && !afterQuote) quoted = true;
      else if (character === ',') { row.push(value); value = ''; afterQuote = false; }
      else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[index + 1] === '\n') index++;
        row.push(value); rows.push(row); row = []; value = ''; afterQuote = false;
      } else {
        if (afterQuote && !/\s/.test(character)) throw Error('CSV 引号格式不正确，请参考模板。');
        if (!afterQuote) value += character;
      }
    }
    if (quoted) throw Error('CSV 中有未闭合的引号，请检查文件。');
    if (value || row.length) { row.push(value); rows.push(row); }
    const nonempty = rows.filter(items => items.some(item => item.trim()));
    if (!nonempty.length) throw Error('文件中没有知识记录。');
    const aliases = { '问题': 'title', '问答': 'title', '标题': 'title', '标准答案': 'content', '答案': 'content', '回复场景': 'scenarios', '场景': 'scenarios', '发送方式': 'sendType', '分类标识': 'titleType', '关联商品ID': 'goodId', '关联商品 ID': 'goodId', '图片地址': 'imageurls', question: 'title', answer: 'content' };
    const headers = nonempty.shift().map(header => aliases[header.trim()] || header.trim());
    if (!headers.includes('title') || !headers.includes('content')) throw Error('CSV 需要 title（问题）和 content（答案）两列，请参考模板。');
    if (new Set(headers).size !== headers.length) throw Error('CSV 含重复列名，请检查表头。');
    return nonempty.map((cells, index) => {
      if (cells.length !== headers.length) throw Error('CSV 第 ' + (index + 2) + ' 行列数不一致，请检查逗号与引号。');
      return Object.fromEntries(headers.map((key, position) => [key, key === 'titleType' && /^(?:0|[1-9]\d{0,2}|1000)$/.test(cells[position]) ? Number(cells[position]) : cells[position]]));
    });
  }
  function normalizeImported(records) {
    if (!Array.isArray(records) || !records.length) throw Error('文件中没有知识记录。');
    if (records.length > 2000) throw Error('一次最多导入 2000 条知识，请拆分文件。');
    return records.map((record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw Error('第 ' + (index + 1) + ' 条知识格式不正确。');
      const title = String(record.title ?? record.question ?? '').trim(), content = String(record.content ?? record.answer ?? '').trim();
      const imageurls = imageValues(record.imageurls);
      if (!title || !content && !imageurls.length) throw Error('第 ' + (index + 1) + ' 条缺少问题或答案。');
      if (imageurls.length > 20) throw Error('第 ' + (index + 1) + ' 条图片地址超过 20 项。');
      if (title.length > 200 || content.length > 20000) throw Error('第 ' + (index + 1) + ' 条内容过长，请缩短后导入。');
      let scenarios = record.scenarios || [];
      if (typeof scenarios === 'string' && scenarios.trim().startsWith('[')) {
        try { scenarios = JSON.parse(scenarios); } catch { throw Error('第 ' + (index + 1) + ' 条回复场景格式不正确。'); }
      }
      const sendType = record.sendType === '' || record.sendType === undefined ? 0 : Number(record.sendType);
      if (![0, 1].includes(sendType)) throw Error('第 ' + (index + 1) + ' 条发送方式应为 0（AI 润色）或 1（原话发送）。');
      scenarios = splitValues(scenarios);
      if (scenarios.length > 32 || scenarios.some(value => value.length > 100)) throw Error('第 ' + (index + 1) + ' 条场景过多或过长，最多 32 项、每项 100 字。');
      return { title, content, scenarios, sendType, titleType: typeof record.titleType === 'number' ? record.titleType : String(record.titleType ?? ''), goodId: String(record.goodId ?? ''), imageurls };
    });
  }
  function openTransfer(mode) {
    if (state.busy || !state.loaded) return;
    state.transferMode = mode; state.transferScope = state.knowledgeScope;
    const titles = { export: '导出知识', template: '下载导入模板', copy: '复制到店铺' };
    $('transfer-title').textContent = titles[mode];
    $('transfer-description').textContent = mode === 'copy' ? '将「' + nameOf(state.transferScope) + '」的全部 ' + state.records.length + ' 条知识追加到所选店铺。' : mode === 'template' ? '按模板填写问题与答案，再导入到当前知识范围。CSV 请使用 UTF-8 编码。' : '导出「' + nameOf(state.transferScope) + '」的已保存知识。';
    $('transfer-submit').textContent = mode === 'copy' ? '开始复制' : mode === 'template' ? '下载模板' : '导出';
    $('format-options').hidden = mode === 'copy';
    $('copy-targets').hidden = mode !== 'copy';
    $('copy-targets').replaceChildren();
    if (mode === 'copy') {
      for (const shop of state.shops.filter(shop => String(shop.id) !== state.transferScope)) {
        const label = element('label'), checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.value = String(shop.id); checkbox.name = 'copy-shop';
        label.append(checkbox, element('span', '', shop.shopName), element('small', '', platformOf(shop.id)));
        $('copy-targets').append(label);
      }
    }
    notify(''); $('transfer-dialog').showModal();
  }
  $('tab-knowledge').addEventListener('click', () => setTab('knowledge'));
  $('tab-replies').addEventListener('click', () => setTab('replies'));
  for (const tab of ['runtime', 'products', 'preview']) $('tab-' + tab).addEventListener('click', () => setTab(tab));
  for (const form of ['runtime-form', 'product-form']) {
    $(form).addEventListener('input', updateStatus);
    $(form).addEventListener('change', updateStatus);
  }
  $('runtime-reload').addEventListener('click', () => perform(async () => { if (await allowDiscard('runtime')) await loadRuntime(); }));
  $('runtime-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('runtime-form').reportValidity()) return;
    perform(async () => {
      const config = runtimeFormValue();
      if (!config.apiKey && !state.runtime?.hasApiKey) throw Error('首次配置请填写 API Key。');
      if (config.enabled && !config.enabledShopIds.length) throw Error('开启自动回复前，请至少选择一家店铺。');
      const status = await call('runtime-config-save', config);
      fillRuntime(status);
      saved(status.enabled ? '模型连接已保存，选定店铺允许自动回复。' : '模型连接已保存，自动回复保持关闭。可以测试连接和试答。');
    });
  });
  $('runtime-test').addEventListener('click', () => perform(async () => {
    if (runtimeDirty()) throw Error('连接配置有未保存修改，请先保存再测试。');
    $('runtime-probe').hidden = true;
    renderProbe(await call('runtime-test'));
    $('runtime-probe').scrollIntoView({ block: 'nearest' });
  }));
  $('product-scope').addEventListener('change', () => {
    const scope = $('product-scope').value; $('product-scope').value = state.productScope;
    perform(async () => { if (await allowDiscard('product')) await loadProducts(scope, null); });
  });
  $('products-refresh').addEventListener('click', () => perform(async () => { if (await allowDiscard('product')) await loadProducts(state.productScope); }));
  $('products-collect').addEventListener('click', () => perform(async () => {
    const result = await call('products-collect', { shopId: state.productScope });
    if (result?.started !== true) throw Error(result?.message || '采集未启动，请先确认该店铺已登录。');
    notify(result.message || '已发起商品采集。平台返回资料需要一定时间，请稍后刷新资料列表。', 'success');
  }));
  $('product-new').addEventListener('click', () => perform(async () => {
    if (await allowDiscard('product')) { fillProduct(); renderProducts(); $('product-id').focus(); }
  }));
  $('product-reset').addEventListener('click', () => perform(async () => {
    if (await allowDiscard('product')) fillProduct(state.products.find(product => String(product.productId) === String(state.selectedProductId)) || null);
  }));
  $('product-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('product-form').reportValidity()) return;
    perform(async () => {
      const product = productFormValue();
      if (!product.productId || !product.title || !product.content) throw Error('请填写商品 ID、名称和实际文字资料。');
      if (product.images.length > 20) throw Error('图片地址最多保存 20 项。');
      putProduct(await call('product-save', { shopId: state.productScope, product }));
      saved('商品资料已保存为手动补充，可继续学习已保存资料。');
    });
  });
  $('product-learn').addEventListener('click', () => perform(async () => {
    if (productDirty()) throw Error('商品资料有未保存修改，请先保存再学习。');
    if (runtimeDirty()) throw Error('模型连接有未保存修改，请先保存再学习。');
    const product = await call('product-learn', { shopId: state.productScope, productId: state.selectedProductId });
    putProduct(product);
    if (product.learning !== 'learned' || product.stale) throw Error(product.lastError || '本次商品学习未完成，可检查资料后重试。');
    saved('模型已整理商品知识，现在可在试答中指定该商品检查结果。');
  }));
  $('preview-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('preview-form').reportValidity()) return;
    perform(async () => {
      if (runtimeDirty() || configDirty() || recordDirty() || productDirty()) throw Error('存在未保存的配置或资料，请先保存，再使用最新内容试答。');
      const question = $('preview-question').value.trim();
      if (!question) throw Error('请输入要测试的客户问题。');
      $('preview-output').hidden = true; $('preview-empty').hidden = false;
      const result = await call('runtime-preview', { shopId: $('preview-scope').value, question, productId: $('preview-product-id').value.trim() || undefined });
      renderPreview(result);
      await loadHistory();
      notify('试答已完成，没有发送给客户。', 'success');
    });
  });
  $('history-refresh').addEventListener('click', () => perform(loadHistory));
  $('preview-scope').addEventListener('change', () => {
    $('preview-output').hidden = true; $('preview-empty').hidden = false;
    perform(loadHistory);
  });
  $('retry-load').addEventListener('click', initialize);
  $('knowledge-search').addEventListener('input', renderRecords);
  $('record-form').addEventListener('input', updateStatus);
  $('record-form').addEventListener('change', updateStatus);
  $('config-form').addEventListener('input', updateStatus);
  $('config-form').addEventListener('change', updateStatus);
  $('knowledge-scope').addEventListener('change', () => {
    const scope = $('knowledge-scope').value; $('knowledge-scope').value = state.knowledgeScope;
    perform(async () => { if (await allowDiscard()) await loadRecords(scope); });
  });
  $('config-scope').addEventListener('change', () => {
    const scope = $('config-scope').value; $('config-scope').value = state.configScope;
    perform(async () => { if (await allowDiscard('config')) fillConfig(scope); });
  });
  $('record-new').addEventListener('click', () => perform(async () => {
    if (!(await allowDiscard())) return;
    $('knowledge-search').value = ''; fillRecord(); renderRecords(); $('record-title').focus();
  }));
  $('record-reset').addEventListener('click', () => perform(async () => {
    if (await allowDiscard()) fillRecord(state.records.find(record => String(record.id) === String(state.selectedId)) || null);
  }));
  $('record-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('record-form').reportValidity()) return;
    perform(async () => {
      const scope = state.knowledgeScope, record = recordFormValue();
      record.title = record.title.trim(); record.content = record.content.trim();
      if (!record.title || !record.content && !record.imageurls.length) throw Error('请填写问题，并提供标准答案或图片地址。');
      if (state.selectedId !== null) record.id = state.selectedId;
      const result = await call('knowledge-save', { shopId: scope, record });
      if (!result?.record?.id) throw Error('保存结果不完整，请重新打开知识库确认。');
      const position = state.records.findIndex(item => String(item.id) === String(result.record.id));
      if (position < 0) state.records.unshift(result.record); else state.records[position] = result.record;
      fillRecord(result.record); renderRecords(); saved('知识已保存到「' + nameOf(scope) + '」。');
    });
  });
  $('record-delete').addEventListener('click', () => perform(async () => {
    if (state.selectedId === null) return;
    const id = state.selectedId, scope = state.knowledgeScope, record = state.records.find(item => String(item.id) === String(id));
    if (!(await confirmAction('删除这条知识？', '「' + (record?.title || '未命名问题') + '」将从当前知识库删除。', '删除', '取消', true))) return;
    const result = await call('knowledge-delete', { shopId: scope, id });
    if (!result?.deleted) throw Error('未能删除这条知识，请重试。');
    state.records = state.records.filter(item => String(item.id) !== String(id));
    fillRecord(); renderRecords(); saved('知识已删除。');
  }));
  $('config-human-type').addEventListener('change', () => { updateHumanOptions(); updateStatus(); });
  $('config-inherit').addEventListener('change', () => {
    if ($('config-inherit').checked) {
      state.customConfig = { ...configFormValue(), isEnabled: true };
      setConfigFields(state.globalConfig);
    } else setConfigFields(state.customConfig || state.globalConfig);
    updateHumanOptions(); updateLocks();
  });
  $('config-reset').addEventListener('click', () => perform(async () => { if (await allowDiscard('config')) fillConfig(state.configScope); }));
  $('config-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!$('config-form').reportValidity()) return;
    perform(async () => {
      const scope = state.configScope, config = configFormValue();
      config.subAccount = config.subAccount.trim();
      if ((scope === GLOBAL || config.isEnabled) && config.aiHumanReplyType === 1 && !config.subAccount) throw Error('请输入转接的子账号昵称。');
      const result = await call('config-save', scope === GLOBAL ? { config } : { shopId: scope, config });
      if (!result || typeof result !== 'object') throw Error('保存结果不完整，请重新打开配置确认。');
      if (scope === GLOBAL) state.globalConfig = normalizeConfig(result);
      else state.singleShopConfig[scope] = result;
      fillConfig(scope); saved('「' + nameOf(scope) + '」已保存到本机。');
    });
  });
  $('knowledge-import').addEventListener('click', () => { if (!state.busy) { $('import-file').value = ''; $('import-file').click(); } });
  $('import-file').addEventListener('change', () => {
    const file = $('import-file').files[0];
    if (!file) return;
    perform(async () => {
      const scope = state.knowledgeScope;
      if (file.size > 10 * 1024 * 1024) throw Error('文件超过 10 MB，请拆分后导入。');
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()).replace(/^\uFEFF/, ''); }
      catch { throw Error('无法读取文件，请使用 UTF-8 编码的 JSON 或 CSV 文件。'); }
      let imported;
      if (/\.csv$/i.test(file.name)) imported = parseCsv(text);
      else if (/\.json$/i.test(file.name)) {
        let json;
        try { json = JSON.parse(text); } catch { throw Error('JSON 格式不正确，请参考模板。'); }
        imported = Array.isArray(json) ? json : json?.records;
      } else throw Error('请选择 JSON 或 CSV 文件。');
      const records = normalizeImported(imported);
      if (!(await confirmAction('导入 ' + records.length + ' 条知识？', '追加到「' + nameOf(scope) + '」，原有知识保留。' + (recordDirty() ? '\n导入后将保留当前未保存的编辑。' : ''), '开始导入'))) return;
      const result = await call('knowledge-import', { shopId: scope, records });
      const fresh = await call('knowledge-list', { shopId: scope });
      if (!Array.isArray(fresh?.records)) throw Error('导入已提交，但列表刷新失败，请重新打开知识库确认。');
      state.records = fresh.records; renderRecords(); saved('已导入 ' + (result?.count ?? records.length) + ' 条知识。');
    });
  });
  $('knowledge-export').addEventListener('click', () => openTransfer('export'));
  $('knowledge-template').addEventListener('click', () => openTransfer('template'));
  $('knowledge-copy').addEventListener('click', () => openTransfer('copy'));
  $('transfer-cancel').addEventListener('click', () => $('transfer-dialog').close());
  $('transfer-dialog').addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
  $('transfer-dialog').addEventListener('close', () => {
    if (state.pendingSelection && !state.busy) { const selection = state.pendingSelection; state.pendingSelection = null; queueMicrotask(() => applySelection(selection)); }
  });
  $('transfer-description').after(Object.assign(element('p', 'notification error'), { id: 'transfer-error', hidden: true }));
  $('transfer-form').addEventListener('submit', event => {
    event.preventDefault();
    perform(async () => {
      const scope = state.transferScope;
      if (state.transferMode === 'copy') {
        const targetShopIds = [...$('copy-targets').querySelectorAll('input:checked')].map(input => input.value);
        if (!targetShopIds.length) throw Error('请至少选择一家目标店铺。');
        const result = await call('knowledge-copy', { shopId: scope, targetShopIds });
        $('transfer-dialog').close(); saved('已向 ' + targetShopIds.length + ' 家店铺复制 ' + (result?.count ?? 0) + ' 条知识。');
        return;
      }
      const format = document.querySelector('input[name="file-format"]:checked').value;
      const isTemplate = state.transferMode === 'template';
      const data = isTemplate ? { version: 1, records: [{ title: '下单后多久发货？', content: '我们会在付款后 48 小时内安排发货，预售商品以页面说明为准。', scenarios: ['售前咨询', '物流查询'], sendType: 0, titleType: '', goodId: '', imageurls: '' }] } : await call('knowledge-export', { shopId: scope });
      if (!Array.isArray(data?.records)) throw Error('导出内容格式不正确，请重试。');
      const filename = (isTemplate ? '知识库导入模板' : '知识库-' + nameOf(scope).replace(/[\\/:*?"<>|]/g, '_')) + '.' + format;
      download(filename, format === 'csv' ? toCsv(data.records) : JSON.stringify(data, null, 2), format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8');
      $('transfer-dialog').close(); notify(isTemplate ? '模板已下载，可填写后导入。' : '知识文件已导出。', 'success');
    });
  });
  $('close-window').addEventListener('click', () => perform(async () => {
    if (await allowDiscard('both')) { state.allowClose = true; window.close(); }
  }));
  window.addEventListener('beforeunload', event => {
    if (state.allowClose || !anyDirty() && !state.busy) return;
    event.preventDefault(); event.returnValue = '';
    if (!state.busy) perform(async () => { if (await allowDiscard('both')) { state.allowClose = true; window.close(); } });
  });
  if (window.juheAi?.onSelection) window.juheAi.onSelection(applySelection);
  updateLocks();
  initialize();
})();
