// items.js – No delete button, green/red In/Out, timestamp, smooth search

const searchInput = document.getElementById('searchItemsInput');
const clearSearchBtn = document.getElementById('clearSearchBtnDesktop');
const refreshBtn = document.getElementById('refreshItemsBtn');
const exportBtn = document.getElementById('exportItemsBtn');
const itemsContainer = document.getElementById('itemsTableContainer');
const totalStatsSpan = document.getElementById('totalStats');

let allItems = [];
let filteredItems = [];
let currentSearchTerm = '';

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError ? '#fb7185' : '#34d399';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function fetchAllItems() {
  try {
    const res = await fetch('/api/get-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'items' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load items', true);
    return [];
  }
}

function getItemTypeLabel(typeKey) {
  const map = {
    thread: 'Thread', cdSequence: 'CD Sequence', roleFussing: 'Role Fussing',
    bobbin: 'Bobbin', cone: 'Cone', colySequence: 'Coly Sequence', otherItem: 'Other Item'
  };
  return map[typeKey] || typeKey || '—';
}

function renderItemRows(entries) {
  if (!entries.length) {
    return `<tr><td colspan="10" style="text-align:center; padding: 48px;">✨ No matching items found ✨</td></tr>`;
  }
  let rows = '';
  for (const entry of entries) {
    const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—';
    const inOut = entry.inOut || '—';
    const inOutClass = inOut === 'in' ? 'in-out-green' : 'in-out-red';
    const numberField = entry.number || '—';
    const itemType = getItemTypeLabel(entry.itemType);
    let qtyDisplay = '—';
    if (entry.itemType === 'otherItem') {
      qtyDisplay = entry.quantity || entry.itemName || '—';
    } else {
      qtyDisplay = entry.quantity || '—';
    }
    const person = entry.personName || '—';
    const color = entry.color || '—';
    const grade = entry.grade || '—';
    const size = entry.size || '—';
    let specificName = '—';
    if (entry.itemType === 'otherItem' && entry.itemName) specificName = entry.itemName;
    else if (entry.itemType === 'cone' && entry.grade) specificName = `Grade ${entry.grade}`;
    else if (entry.itemType === 'thread') specificName = 'Thread';
    
    rows += `<tr>
      <td>${timestamp}</td>
      <td class="${inOutClass}">${inOut}</td>
      <td>${numberField}</td>
      <td>${itemType}</td>
      <td>${qtyDisplay}</td>
      <td>${person}</td>
      <td>${color}</td>
      <td>${grade !== '—' ? grade : '—'}</td>
      <td>${size !== '—' ? size : '—'}</td>
      <td>${specificName}</td>
    </tr>`;
  }
  return rows;
}

function filterItemsBySearchTerm(items, term) {
  if (!term.trim()) return items;
  const lowerTerm = term.toLowerCase().trim();
  return items.filter(item => {
    const searchable = [
      item.number, item.personName, item.color, item.grade, item.size,
      item.itemName, item.quantity, item.itemType, item.inOut,
      (item.itemType === 'otherItem' ? item.itemName : ''),
      (item.grade ? `grade ${item.grade}` : ''),
      (item.size ? `size ${item.size}` : '')
    ];
    return searchable.some(field => field && String(field).toLowerCase().includes(lowerTerm));
  });
}

function renderTable() {
  const filtered = filterItemsBySearchTerm(allItems, currentSearchTerm);
  filteredItems = filtered;
  const total = allItems.length;
  const shown = filtered.length;
  
  if (total === 0) {
    totalStatsSpan.innerHTML = `📦 No items yet`;
  } else if (currentSearchTerm && shown !== total) {
    totalStatsSpan.innerHTML = `🔍 ${shown} / ${total} items matched`;
  } else {
    totalStatsSpan.innerHTML = `📊 Total items: ${total}`;
  }
  
  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date/Time</th><th>In/Out</th><th>Number</th><th>Type</th>
          <th>Qty / Item</th><th>Person</th><th>Color</th><th>Grade</th>
          <th>Size</th><th>Specific Name</th>
        </tr>
      </thead>
      <tbody>
        ${renderItemRows(filtered)}
      </tbody>
    </table>
  `;
  itemsContainer.innerHTML = tableHtml;
}

async function loadAndRender() {
  itemsContainer.innerHTML = '<div class="loading-placeholder">📡 Syncing with server ...</div>';
  const items = await fetchAllItems();
  allItems = items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  currentSearchTerm = searchInput.value.trim();
  renderTable();
  if (allItems.length === 0) showToast('No items found. Add entries from Data Entry page.', false);
}

function exportFilteredItems() {
  if (filteredItems.length === 0) {
    showToast('No items to export', true);
    return;
  }
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalItems: filteredItems.length,
    searchTerm: currentSearchTerm || 'none',
    items: filteredItems
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `items_export_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`✅ Exported ${filteredItems.length} items`);
}

let debounceTimer;
function onSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentSearchTerm = searchInput.value;
    renderTable();
    if (currentSearchTerm && allItems.length) showToast(`🔎 Showing results for "${currentSearchTerm}"`);
    else if (!currentSearchTerm && allItems.length) showToast('Showing all items');
  }, 280);
}

function clearSearch() {
  searchInput.value = '';
  currentSearchTerm = '';
  renderTable();
  showToast('Search cleared');
}

async function init() {
  searchInput.addEventListener('input', onSearchInput);
  clearSearchBtn.addEventListener('click', clearSearch);
  refreshBtn.addEventListener('click', async () => {
    await loadAndRender();
    showToast('🔄 Items refreshed');
  });
  exportBtn.addEventListener('click', exportFilteredItems);
  await loadAndRender();
}

document.addEventListener('DOMContentLoaded', init);