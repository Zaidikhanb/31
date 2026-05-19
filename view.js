// view.js - with search and category download buttons

const periodFilter = document.getElementById('periodFilter');
const customDateInput = document.getElementById('customDate');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const sectionsContainer = document.getElementById('sectionsContainer');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');

let currentSearchTerm = '';

const categoriesMeta = [
  { key: 'items', label: 'Items Details' },
  { key: 'samples', label: 'Sample Details' },
  { key: 'cleaning', label: 'Clipping Details' },
  { key: 'persons', label: 'Person Details (Absent)' },
  { key: 'complains', label: 'Complains' }
];

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#fb7185' : '#34d399';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getDateRange(period) {
  if (period === 'custom') {
    const dateVal = customDateInput.value;
    if (dateVal) {
      const start = new Date(dateVal + 'T00:00:00.000Z');
      const end = new Date(dateVal + 'T23:59:59.999Z');
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    return { startDate: null, endDate: null };
  }
  const now = new Date();
  let start = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    return { startDate: null, endDate: null };
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

async function fetchCategory(category, startDate, endDate) {
  try {
    const res = await fetch('/api/get-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, startDate, endDate }),
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

function matchesSearchTerm(entry, term) {
  if (!term) return true;
  const lowerTerm = term.toLowerCase();
  const searchableFields = [
    entry.number, entry.personName, entry.name, entry.itemName,
    entry.sampleName, entry.complain, entry.color, entry.sizeGuzz,
    entry.itemType, entry.quantity, entry.reason
  ];
  return searchableFields.some(field => field && String(field).toLowerCase().includes(lowerTerm));
}

function renderTableForCategory(category, entries) {
  if (!entries.length) {
    return '<p style="color: var(--text-secondary);">No matching entries for this period / search.</p>';
  }

  let tableHtml = '<div class="table-wrapper"><table class="data-table"><thead><tr>';

  if (category === 'items') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Type</th><th>Qty</th><th>Person</th><th>Color</th><th>Grade</th><th>Size</th><th></th></tr></thead><tbody>';
    const itemTypeLabels = {
      thread: 'Thread', cdSequence: 'CD Sequence', roleFussing: 'Role Fussing',
      bobbin: 'Bobbin', cone: 'Cone', colySequence: 'Coly Sequence', otherItem: 'Other Item'
    };
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${itemTypeLabels[entry.itemType] || entry.itemType || '-'}</td>
        <td>${entry.quantity || entry.itemName || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td>${entry.color || '-'}</td>
        <td>${entry.grade || '-'}</td>
        <td>${entry.size || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
      </tr>`;
    });
  } else if (category === 'samples') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Sample Name</th><th>Color</th><th>Person</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.sampleName || '-'}</td>
        <td>${entry.sampleColor || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'cleaning') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Size (Guzz)</th><th>Person</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.sizeGuzz || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'persons') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Reason</th><th></th></table></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.name || '-'}</td>
        <td>${entry.reason || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'complains') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Complain</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.name || '-'}</td>
        <td>${entry.complain || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  }

  tableHtml += '</tbody></table></div>';
  return tableHtml;
}

async function refreshCategoryView(category) {
  const contentDiv = document.getElementById(`content-${category}`);
  if (!contentDiv) return;

  contentDiv.innerHTML = '<div class="loading-indicator" style="padding: 20px; text-align: center;">Loading...</div>';

  const period = periodFilter.value;
  const { startDate, endDate } = getDateRange(period);
  let entries = await fetchCategory(category, startDate, endDate);
  
  if (currentSearchTerm) {
    entries = entries.filter(entry => matchesSearchTerm(entry, currentSearchTerm));
  }

  const tableHtml = renderTableForCategory(category, entries);
  const downloadBtnHtml = `<button class="category-download-btn" data-category="${category}">📥 Download ${categoriesMeta.find(c => c.key === category).label}</button>`;
  
  contentDiv.innerHTML = `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">${downloadBtnHtml}</div>
    ${tableHtml}
  `;

  // Delete handlers
  contentDiv.querySelectorAll('.delete-entry-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.id;
      if (confirm('Delete this entry?')) {
        await deleteEntry(category, id);
        await refreshCategoryView(category);
      }
    });
  });

  // Category download handler
  const catDownloadBtn = contentDiv.querySelector('.category-download-btn');
  if (catDownloadBtn) {
    catDownloadBtn.addEventListener('click', () => downloadCategory(category, entries));
  }
}

async function deleteEntry(category, id) {
  try {
    const res = await fetch('/api/delete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, id }),
    });
    if (res.ok) {
      showToast('✓ Entry deleted');
    } else {
      showToast('✗ Delete failed', true);
    }
  } catch (e) {
    showToast('✗ Network error', true);
  }
}

function downloadCategory(category, entries) {
  if (!entries.length) {
    showToast('No data to download for this category', true);
    return;
  }
  const dataStr = JSON.stringify({ category, entries, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${category}_${new Date().toISOString().slice(0,19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${category}`);
}

async function refreshAllCategories() {
  for (const cat of categoriesMeta) {
    await refreshCategoryView(cat.key);
  }
}

function resetToSkeleton() {
  currentSearchTerm = '';
  if (searchInput) searchInput.value = '';
  renderSkeleton();
}

function renderSkeleton() {
  let html = '';
  for (const cat of categoriesMeta) {
    html += `
      <div class="glass-card category-section" style="margin-bottom: 28px;" data-category="${cat.key}">
        <h2 style="margin-bottom: 16px;">
          <svg ...>...</svg>
          ${cat.label}
        </h2>
        <div class="category-content" id="content-${cat.key}">
          <div class="placeholder-load">
            <button class="btn see-data-btn" data-category="${cat.key}">
              <svg ...>...</svg>
              See Data
            </button>
          </div>
        </div>
      </div>
    `;
  }
  sectionsContainer.innerHTML = html;

  document.querySelectorAll('.see-data-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSearchTerm = ''; // clear search when manually loading a category
      if (searchInput) searchInput.value = '';
      refreshCategoryView(btn.dataset.category);
    });
  });
}

async function performSearch() {
  const term = searchInput.value.trim();
  if (!term) {
    showToast('Please enter a search term', true);
    return;
  }
  currentSearchTerm = term;
  await refreshAllCategories();
  showToast(`Search results for "${term}"`);
}

async function downloadAllData() {
  showToast('Preparing download...');
  try {
    const allResults = {};
    for (const cat of categoriesMeta) {
      const period = periodFilter.value;
      const { startDate, endDate } = getDateRange(period);
      let entries = await fetchCategory(cat.key, startDate, endDate);
      if (currentSearchTerm) {
        entries = entries.filter(e => matchesSearchTerm(e, currentSearchTerm));
      }
      allResults[cat.key] = entries;
    }
    if (Object.values(allResults).every(arr => arr.length === 0)) {
      showToast('No data to download', true);
      return;
    }
    const blob = new Blob([JSON.stringify(allResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_data_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Download complete');
  } catch (err) {
    showToast('Error preparing download', true);
  }
}

// Event listeners
periodFilter.addEventListener('change', () => {
  if (periodFilter.value === 'custom') {
    customDateInput.style.display = 'inline-block';
  } else {
    customDateInput.style.display = 'none';
  }
  resetToSkeleton();
});

customDateInput.addEventListener('change', () => {
  resetToSkeleton();
});

searchBtn.addEventListener('click', performSearch);
clearSearchBtn.addEventListener('click', resetToSkeleton);
downloadAllBtn.addEventListener('click', downloadAllData);

document.addEventListener('DOMContentLoaded', () => {
  renderSkeleton();
});