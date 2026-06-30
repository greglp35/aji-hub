/**
 * AJI Studio - Main JavaScript
 * Gestion de l'interface de conception de catalogues
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
  pages: [],
  currentPageId: 1,
  zoom: 1,
  selectedBlocks: [],
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  showGrid: true,
  showGuides: true,
  showBleed: true,
  showSafe: true,
  isSaved: true,
  clipboard: null,
  history: [],
  historyIndex: -1,
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
  app: document.querySelector('.app'),
  canvasWrap: document.getElementById('canvas-wrap'),
  canvas: document.getElementById('canvas'),
  blocksContainer: document.getElementById('blocks-container'),
  saveStatus: document.getElementById('save-status'),
  zoomLevel: document.getElementById('zoom-level'),
  pageNumber: document.getElementById('page-number'),
  selectionCount: document.getElementById('selection-count'),
  selectionNotice: document.getElementById('selection-notice'),
  propertiesPanel: document.getElementById('properties-panel'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Initialize state
  AppState.pages = [{
    id: 1,
    blocks: [],
  }];
  
  // Load saved state if available
  loadState();
  
  // Setup event listeners
  setupEventListeners();
  
  // Render initial state
  renderPages();
  updateUI();
  
  // Show welcome message
  showToast('Bienvenue dans AJI Studio!', 'success');
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Toolbar buttons
  document.getElementById('btn-new').addEventListener('click', handleNewProject);
  document.getElementById('btn-open').addEventListener('click', handleOpenProject);
  document.getElementById('btn-save').addEventListener('click', handleSaveProject);
  document.getElementById('btn-export-pdf').addEventListener('click', handleExportPDF);
  
  document.getElementById('btn-undo').addEventListener('click', handleUndo);
  document.getElementById('btn-redo').addEventListener('click', handleRedo);
  document.getElementById('btn-copy').addEventListener('click', handleCopy);
  document.getElementById('btn-paste').addEventListener('click', handlePaste);
  
  // View toggles
  document.getElementById('btn-toggle-grid').addEventListener('click', () => {
    AppState.showGrid = !AppState.showGrid;
    updatePageFrameClasses();
  });
  
  document.getElementById('btn-toggle-guides').addEventListener('click', () => {
    AppState.showGuides = !AppState.showGuides;
    updatePageFrameClasses();
  });
  
  document.getElementById('btn-toggle-bleed').addEventListener('click', () => {
    AppState.showBleed = !AppState.showBleed;
    updatePageFrameClasses();
  });
  
  document.getElementById('btn-toggle-safe').addEventListener('click', () => {
    AppState.showSafe = !AppState.showSafe;
    updatePageFrameClasses();
  });
  
  // Zoom controls
  document.getElementById('btn-zoom-out').addEventListener('click', () => handleZoom('out'));
  document.getElementById('btn-zoom-in').addEventListener('click', () => handleZoom('in'));
  document.getElementById('btn-zoom-reset').addEventListener('click', () => handleZoom('reset'));
  
  // Page navigation
  document.getElementById('btn-prev-page').addEventListener('click', () => navigatePage('prev'));
  document.getElementById('btn-next-page').addEventListener('click', () => navigatePage('next'));
  document.getElementById('btn-add-page').addEventListener('click', addPage);
  
  // Selection actions
  document.getElementById('btn-delete-selected').addEventListener('click', deleteSelectedBlocks);
  document.getElementById('btn-duplicate-selected').addEventListener('click', duplicateSelectedBlocks);
  
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Layer switching
  document.querySelectorAll('.list-item[data-layer]').forEach(item => {
    item.addEventListener('click', () => switchLayer(item.dataset.layer));
  });
  
  // Template buttons
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => addBlock(btn.dataset.blockType));
  });
  
  // Canvas interactions
  DOM.canvas.addEventListener('mousedown', handleCanvasMouseDown);
  DOM.canvas.addEventListener('mousemove', handleCanvasMouseMove);
  DOM.canvas.addEventListener('mouseup', handleCanvasMouseUp);
  DOM.canvas.addEventListener('mouseleave', handleCanvasMouseUp);
  DOM.canvas.addEventListener('click', handleCanvasClick);
  DOM.canvas.addEventListener('keydown', handleCanvasKeyDown);
  
  // Window events
  window.addEventListener('keydown', handleGlobalKeyDown);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Mouse wheel zoom
  DOM.canvasWrap.addEventListener('wheel', handleWheelZoom, { passive: false });
}

// ============================================
// STATE MANAGEMENT
// ============================================
function saveState() {
  localStorage.setItem('aji-studio-state', JSON.stringify({
    pages: AppState.pages,
    currentPageId: AppState.currentPageId,
    zoom: AppState.zoom,
  }));
  AppState.isSaved = true;
  updateSaveStatus();
}

function loadState() {
  const savedState = localStorage.getItem('aji-studio-state');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      AppState.pages = state.pages || AppState.pages;
      AppState.currentPageId = state.currentPageId || AppState.currentPageId;
      AppState.zoom = state.zoom || AppState.zoom;
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }
}

function updateSaveStatus() {
  DOM.saveStatus.textContent = AppState.isSaved ? 'Enregistré' : 'Non enregistré';
  DOM.saveStatus.className = AppState.isSaved ? 'pill saved' : 'pill unsaved';
}

// ============================================
// RENDERING
// ============================================
function renderPages() {
  DOM.canvas.innerHTML = '';
  
  AppState.pages.forEach(page => {
    const pageFrame = createPageFrame(page.id);
    DOM.canvas.appendChild(pageFrame);
    
    // Render blocks for this page
    if (page.id === AppState.currentPageId) {
      renderBlocks(page.blocks, pageFrame.querySelector('.blocks-container'));
    }
  });
  
  updatePageFrameClasses();
  scrollToCurrentPage();
}

function createPageFrame(pageId) {
  const frame = document.createElement('div');
  frame.className = 'page-frame';
  frame.id = `page-${pageId}`;
  frame.dataset.pageId = pageId;
  
  frame.innerHTML = `
    <!-- Guide Boxes -->
    <div class="trim-box"></div>
    <div class="guide-label trim">TRIM</div>
    <div class="bleed-box"></div>
    <div class="guide-label bleed">BLEED</div>
    <div class="safe-box"></div>
    <div class="guide-label safe">SAFE</div>

    <!-- Mid Guides -->
    <div class="mid-guide v"></div>
    <div class="mid-guide h"></div>
    <div class="mid-guide-label v">CENTRE V</div>
    <div class="mid-guide-label h">CENTRE H</div>

    <!-- Crop Marks -->
    <div class="crop tl-h"></div>
    <div class="crop tl-v"></div>
    <div class="crop tr-h"></div>
    <div class="crop tr-v"></div>
    <div class="crop bl-h"></div>
    <div class="crop bl-v"></div>
    <div class="crop br-h"></div>
    <div class="crop br-v"></div>

    <!-- Page Badge -->
    <div class="page-badge">Page ${pageId}</div>

    <!-- Blocks Container -->
    <div class="blocks-container"></div>
  `;
  
  return frame;
}

function renderBlocks(blocks, container) {
  container.innerHTML = '';
  
  blocks.forEach(block => {
    const blockElement = createBlockElement(block);
    container.appendChild(blockElement);
  });
}

function createBlockElement(block) {
  const div = document.createElement('div');
  div.className = `block ${block.type}`;
  div.dataset.blockId = block.id;
  div.dataset.blockType = block.type;
  div.style.left = `${block.x}px`;
  div.style.top = `${block.y}px`;
  div.style.width = `${block.width}px`;
  div.style.height = `${block.height}px`;
  
  // Add content based on block type
  switch (block.type) {
    case 'text':
      div.innerHTML = `<div contenteditable="true" class="block-content">${block.content || 'Double-cliquez pour éditer'}</div>`;
      break;
    case 'image':
      div.innerHTML = `<div class="block-content">🖼️ Image</div>`;
      break;
    case 'shape':
      div.innerHTML = `<div class="block-content">🟨 Forme</div>`;
      break;
    case 'table':
      div.innerHTML = `<div class="block-content">📊 Tableau</div>`;
      break;
    case 'product':
      div.innerHTML = `<div class="block-content">📦 Produit</div>`;
      break;
    case 'qr':
      div.innerHTML = `<div class="block-content">🔲 QR Code</div>`;
      break;
    case 'service':
      div.innerHTML = `<div class="block-content">🛠️ Service</div>`;
      break;
    case 'contact':
      div.innerHTML = `<div class="block-content">📞 Contact</div>`;
      break;
    default:
      div.innerHTML = `<div class="block-content">${block.type}</div>`;
  }
  
  // Add resize handles
  div.innerHTML += `
    <div class="resize-handle tl"></div>
    <div class="resize-handle tr"></div>
    <div class="resize-handle bl"></div>
    <div class="resize-handle br"></div>
  `;
  
  // Add event listeners
  div.addEventListener('mousedown', (e) => handleBlockMouseDown(e, block.id));
  div.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => handleResizeMouseDown(e, block.id));
  });
  
  // Make text blocks editable
  const content = div.querySelector('[contenteditable]');
  if (content) {
    content.addEventListener('input', (e) => {
      updateBlockContent(block.id, e.target.innerHTML);
    });
  }
  
  return div;
}

function updatePageFrameClasses() {
  const pageFrame = document.getElementById(`page-${AppState.currentPageId}`);
  if (pageFrame) {
    pageFrame.classList.toggle('show-grid', AppState.showGrid);
    pageFrame.classList.toggle('show-guides', AppState.showGuides);
    pageFrame.classList.toggle('show-bleed', AppState.showBleed);
    pageFrame.classList.toggle('show-safe', AppState.showSafe);
  }
}

function scrollToCurrentPage() {
  const pageFrame = document.getElementById(`page-${AppState.currentPageId}`);
  if (pageFrame) {
    const canvasRect = DOM.canvas.getBoundingClientRect();
    const pageRect = pageFrame.getBoundingClientRect();
    
    DOM.canvas.scrollTo({
      left: pageRect.left - canvasRect.left + DOM.canvas.scrollLeft - canvasRect.width / 2 + pageRect.width / 2,
      top: pageRect.top - canvasRect.top + DOM.canvas.scrollTop - canvasRect.height / 2 + pageRect.height / 2,
      behavior: 'smooth'
    });
  }
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
  // Update zoom level
  DOM.zoomLevel.value = `${Math.round(AppState.zoom * 100)}%`;
  DOM.canvas.style.transform = `scale(${AppState.zoom})`;
  
  // Update page number
  DOM.pageNumber.value = AppState.currentPageId;
  
  // Update selection count
  DOM.selectionCount.textContent = `${AppState.selectedBlocks.length} bloc(s)`;
  
  // Show/hide properties panel
  if (AppState.selectedBlocks.length === 1) {
    DOM.selectionNotice.classList.add('hidden');
    DOM.propertiesPanel.classList.remove('hidden');
    updatePropertiesPanel();
  } else {
    DOM.selectionNotice.classList.remove('hidden');
    DOM.propertiesPanel.classList.add('hidden');
  }
  
  updateSaveStatus();
}

function updatePropertiesPanel() {
  if (AppState.selectedBlocks.length === 1) {
    const block = getBlockById(AppState.selectedBlocks[0]);
    if (block) {
      document.getElementById('block-type').value = block.type;
      document.getElementById('block-x').value = block.x;
      document.getElementById('block-y').value = block.y;
      document.getElementById('block-width').value = block.width;
      document.getElementById('block-height').value = block.height;
    }
  }
}

// ============================================
// TOOLBAR ACTIONS
// ============================================
function handleNewProject() {
  if (!AppState.isSaved) {
    if (!confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer?')) {
      return;
    }
  }
  
  AppState.pages = [{
    id: 1,
    blocks: [],
  }];
  AppState.currentPageId = 1;
  AppState.zoom = 1;
  AppState.selectedBlocks = [];
  AppState.isSaved = true;
  
  renderPages();
  updateUI();
  saveState();
  
  showToast('Nouveau projet créé', 'success');
}

function handleOpenProject() {
  // In a real app, this would open a file dialog
  showToast('Fonctionnalité à venir: Ouverture de projet', 'success');
}

function handleSaveProject() {
  saveState();
  showToast('Projet enregistré', 'success');
}

function handleExportPDF() {
  // In a real app, this would use jsPDF or similar
  showToast('Fonctionnalité à venir: Export PDF', 'success');
  
  // For now, just print
  window.print();
}

function handleUndo() {
  if (AppState.historyIndex > 0) {
    AppState.historyIndex--;
    const previousState = AppState.history[AppState.historyIndex];
    if (previousState) {
      AppState.pages = previousState.pages;
      AppState.currentPageId = previousState.currentPageId;
      renderPages();
      updateUI();
    }
  }
}

function handleRedo() {
  if (AppState.historyIndex < AppState.history.length - 1) {
    AppState.historyIndex++;
    const nextState = AppState.history[AppState.historyIndex];
    if (nextState) {
      AppState.pages = nextState.pages;
      AppState.currentPageId = nextState.currentPageId;
      renderPages();
      updateUI();
    }
  }
}

function handleCopy() {
  if (AppState.selectedBlocks.length > 0) {
    AppState.clipboard = AppState.selectedBlocks.map(id => {
      const block = getBlockById(id);
      return { ...block, id: null }; // Remove ID for new blocks
    });
    showToast(`${AppState.selectedBlocks.length} bloc(s) copié(s)`, 'success');
  }
}

function handlePaste() {
  if (AppState.clipboard && AppState.clipboard.length > 0) {
    const currentPage = getCurrentPage();
    const newBlocks = AppState.clipboard.map(block => ({
      ...block,
      id: generateId(),
      x: block.x + 20, // Offset to avoid overlapping
      y: block.y + 20,
    }));
    
    currentPage.blocks.push(...newBlocks);
    AppState.selectedBlocks = newBlocks.map(b => b.id);
    AppState.isSaved = false;
    
    renderBlocks(currentPage.blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
    updateUI();
    saveState();
    
    showToast(`${newBlocks.length} bloc(s) collé(s)`, 'success');
  }
}

// ============================================
// ZOOM CONTROLS
// ============================================
function handleZoom(direction) {
  const zoomSteps = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  let currentIndex = zoomSteps.findIndex(step => Math.abs(step - AppState.zoom) < 0.01);
  
  if (currentIndex === -1) currentIndex = 0;
  
  switch (direction) {
    case 'in':
      currentIndex = Math.min(currentIndex + 1, zoomSteps.length - 1);
      break;
    case 'out':
      currentIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'reset':
      currentIndex = zoomSteps.findIndex(step => step === 1);
      break;
  }
  
  AppState.zoom = zoomSteps[currentIndex];
  updateUI();
}

function handleWheelZoom(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 'out' : 'in';
    handleZoom(delta);
  }
}

// ============================================
// PAGE NAVIGATION
// ============================================
function navigatePage(direction) {
  const pageIds = AppState.pages.map(p => p.id);
  const currentIndex = pageIds.findIndex(id => id === AppState.currentPageId);
  
  let newIndex;
  switch (direction) {
    case 'prev':
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'next':
      newIndex = Math.min(currentIndex + 1, pageIds.length - 1);
      break;
  }
  
  if (newIndex !== currentIndex) {
    AppState.currentPageId = pageIds[newIndex];
    renderPages();
    updateUI();
  }
}

function addPage() {
  const newPageId = Math.max(...AppState.pages.map(p => p.id), 0) + 1;
  AppState.pages.push({
    id: newPageId,
    blocks: [],
  });
  AppState.currentPageId = newPageId;
  AppState.isSaved = false;
  
  renderPages();
  updateUI();
  saveState();
  
  showToast(`Page ${newPageId} ajoutée`, 'success');
}

// ============================================
// TAB AND LAYER SWITCHING
// ============================================
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });
}

function switchLayer(layerId) {
  document.querySelectorAll('.list-item[data-layer]').forEach(item => {
    item.classList.toggle('active', item.dataset.layer === layerId);
  });
  
  // In a real app, this would show/hide specific layers
  showToast(`Calque "${layerId}" sélectionné`, 'success');
}

// ============================================
// BLOCK MANAGEMENT
// ============================================
function addBlock(type) {
  const currentPage = getCurrentPage();
  const newBlock = {
    id: generateId(),
    type,
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    content: '',
  };
  
  currentPage.blocks.push(newBlock);
  AppState.selectedBlocks = [newBlock.id];
  AppState.isSaved = false;
  
  renderBlocks(currentPage.blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  updateUI();
  saveState();
  
  showToast(`Bloc "${type}" ajouté`, 'success');
}

function getBlockById(id) {
  const currentPage = getCurrentPage();
  return currentPage.blocks.find(block => block.id === id);
}

function getCurrentPage() {
  return AppState.pages.find(page => page.id === AppState.currentPageId);
}

function updateBlockContent(blockId, content) {
  const block = getBlockById(blockId);
  if (block) {
    block.content = content;
    AppState.isSaved = false;
    saveState();
  }
}

function deleteSelectedBlocks() {
  if (AppState.selectedBlocks.length === 0) return;
  
  const currentPage = getCurrentPage();
  currentPage.blocks = currentPage.blocks.filter(block => !AppState.selectedBlocks.includes(block.id));
  AppState.selectedBlocks = [];
  AppState.isSaved = false;
  
  renderBlocks(currentPage.blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  updateUI();
  saveState();
  
  showToast(`${AppState.selectedBlocks.length} bloc(s) supprimé(s)`, 'success');
}

function duplicateSelectedBlocks() {
  if (AppState.selectedBlocks.length === 0) return;
  
  const currentPage = getCurrentPage();
  const newBlocks = AppState.selectedBlocks.map(id => {
    const block = getBlockById(id);
    return {
      ...block,
      id: generateId(),
      x: block.x + 20,
      y: block.y + 20,
    };
  });
  
  currentPage.blocks.push(...newBlocks);
  AppState.selectedBlocks = newBlocks.map(b => b.id);
  AppState.isSaved = false;
  
  renderBlocks(currentPage.blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  updateUI();
  saveState();
  
  showToast(`${newBlocks.length} bloc(s) dupliqué(s)`, 'success');
}

// ============================================
// CANVAS INTERACTIONS
// ============================================
function handleCanvasMouseDown(e) {
  if (e.target === DOM.canvas || e.target === DOM.canvasInner) {
    // Deselect all blocks if clicking on empty canvas
    AppState.selectedBlocks = [];
    updateUI();
    renderBlocks(getCurrentPage().blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  }
}

function handleCanvasMouseMove(e) {
  if (AppState.isDragging && AppState.selectedBlocks.length > 0) {
    const dx = e.clientX - AppState.dragStart.x;
    const dy = e.clientY - AppState.dragStart.y;
    
    const currentPage = getCurrentPage();
    const scale = 1 / AppState.zoom;
    
    currentPage.blocks.forEach(block => {
      if (AppState.selectedBlocks.includes(block.id)) {
        block.x = AppState.dragOffset.x + dx * scale;
        block.y = AppState.dragOffset.y + dy * scale;
      }
    });
    
    AppState.isSaved = false;
    renderBlocks(currentPage.blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  }
}

function handleCanvasMouseUp() {
  if (AppState.isDragging) {
    AppState.isDragging = false;
    saveState();
  }
}

function handleCanvasClick(e) {
  // Handle empty canvas click
  if (e.target === DOM.canvas || e.target === DOM.canvasInner) {
    AppState.selectedBlocks = [];
    updateUI();
  }
}

function handleCanvasKeyDown(e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelectedBlocks();
  }
}

// ============================================
// BLOCK INTERACTIONS
// ============================================
function handleBlockMouseDown(e, blockId) {
  if (e.target.classList.contains('resize-handle')) return;
  
  // Handle selection
  const isShiftKey = e.shiftKey;
  const isCtrlKey = e.ctrlKey || e.metaKey;
  
  if (!isShiftKey && !isCtrlKey) {
    AppState.selectedBlocks = [blockId];
  } else if (isShiftKey || isCtrlKey) {
    const index = AppState.selectedBlocks.findIndex(id => id === blockId);
    if (index === -1) {
      AppState.selectedBlocks.push(blockId);
    } else {
      AppState.selectedBlocks.splice(index, 1);
    }
  }
  
  updateUI();
  renderBlocks(getCurrentPage().blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
  
  // Start dragging
  AppState.isDragging = true;
  AppState.dragStart = { x: e.clientX, y: e.clientY };
  
  const block = getBlockById(blockId);
  if (block) {
    AppState.dragOffset = { x: block.x, y: block.y };
  }
  
  e.stopPropagation();
}

function handleResizeMouseDown(e, blockId) {
  AppState.isResizing = true;
  AppState.resizeBlockId = blockId;
  AppState.resizeStart = { x: e.clientX, y: e.clientY };
  
  const block = getBlockById(blockId);
  if (block) {
    AppState.resizeBlock = { ...block };
  }
  
  e.stopPropagation();
  
  // Add temporary event listeners for resizing
  const handleMouseMove = (e) => {
    if (AppState.isResizing) {
      const dx = e.clientX - AppState.resizeStart.x;
      const dy = e.clientY - AppState.resizeStart.y;
      const scale = 1 / AppState.zoom;
      
      const block = getBlockById(AppState.resizeBlockId);
      if (block) {
        // Determine which handle is being dragged
        const handle = e.target;
        
        if (handle.classList.contains('tl')) {
          block.width = Math.max(20, AppState.resizeBlock.width - dx * scale);
          block.height = Math.max(20, AppState.resizeBlock.height - dy * scale);
          block.x = AppState.resizeBlock.x + dx * scale;
          block.y = AppState.resizeBlock.y + dy * scale;
        } else if (handle.classList.contains('tr')) {
          block.width = Math.max(20, AppState.resizeBlock.width + dx * scale);
          block.height = Math.max(20, AppState.resizeBlock.height - dy * scale);
          block.y = AppState.resizeBlock.y + dy * scale;
        } else if (handle.classList.contains('bl')) {
          block.width = Math.max(20, AppState.resizeBlock.width + dx * scale);
          block.height = Math.max(20, AppState.resizeBlock.height + dy * scale);
          block.x = AppState.resizeBlock.x + dx * scale;
        } else if (handle.classList.contains('br')) {
          block.width = Math.max(20, AppState.resizeBlock.width + dx * scale);
          block.height = Math.max(20, AppState.resizeBlock.height + dy * scale);
        }
        
        AppState.isSaved = false;
        renderBlocks(getCurrentPage().blocks, document.querySelector(`#page-${AppState.currentPageId} .blocks-container`));
      }
    }
  };
  
  const handleMouseUp = () => {
    if (AppState.isResizing) {
      AppState.isResizing = false;
      saveState();
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// ============================================
// GLOBAL EVENTS
// ============================================
function handleGlobalKeyDown(e) {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    handleSaveProject();
  }
  
  // Ctrl/Cmd + Z to undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    handleUndo();
  }
  
  // Ctrl/Cmd + Y to redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    handleRedo();
  }
  
  // Ctrl/Cmd + C to copy
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault();
    handleCopy();
  }
  
  // Ctrl/Cmd + V to paste
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    handlePaste();
  }
}

function handleBeforeUnload(e) {
  if (!AppState.isSaved) {
    e.preventDefault();
    e.returnValue = 'Vous avez des modifications non enregistrées. Voulez-vous quitter sans enregistrer?';
    return e.returnValue;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showToast(message, type = '') {
  DOM.toastMessage.textContent = message;
  DOM.toast.className = 'toast';
  if (type) {
    DOM.toast.classList.add(type);
  }
  DOM.toast.classList.add('show');
  
  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 3000);
}

// ============================================
// HISTORY MANAGEMENT
// ============================================
function saveToHistory() {
  // Remove redo history
  AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
  
  // Add new state
  AppState.history.push({
    pages: JSON.parse(JSON.stringify(AppState.pages)),
    currentPageId: AppState.currentPageId,
  });
  
  // Limit history size
  if (AppState.history.length > 50) {
    AppState.history.shift();
    AppState.historyIndex--;
  }
  
  AppState.historyIndex = AppState.history.length - 1;
}

// Save initial state
setTimeout(() => {
  saveToHistory();
}, 1000);
