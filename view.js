const periodFilter = document.getElementById('periodFilter');
const customDateInput = document.getElementById('customDate');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const sectionsContainer = document.getElementById('sectionsContainer');
const toast = document.getElementById('toast');

let allData = {
  items: [],
  samples: [],
  cleaning: [],
  persons: [],
  complains: []
};

const itemTypes = ['thread', 'cdSequence', 'roleFussing', 'bobbin', 'cone', 'colySequence', 'otherItem'];
const itemTypeLabels = {
  thread: 'Thread',
  cdSequence: 'CD Sequence',
  roleFussing: 'Role Fussing',
  bobbin: 'Bobbin',
  cone: 'Cone',
  colySequence: 'Coly Sequence',
  otherItem: 'Other Item'
};

// Show / hide custom date input
periodFilter.addEventListener('change', () => {
  if (periodFilter.value === 'custom') {
    customDateInput.style.display = 'inline-block';
  } else {
    customDateInput.style.display = 'none';
    // Auto‑fetch when switching to a predefined period
    loadAllData();
  }
});

// Also fetch when a custom date is chosen
customDateInput.addEventListener('change', () => {
  if (customDateInput.value) {
    loadAllData();
  }
});

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#fb7185' : '#34d399';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getDateRange(period) {
  // If custom date is selected and a date is provided, use that single day
  if (period === 'custom') {
    const dateVal = customDateInput.value;
    if (dateVal) {
      // Set start to beginning of that day, end to end of that day (UTC)
      const start = new Date(dateVal + 'T00:00:00.000Z');
      const end = new Date(dateVal + 'T23:59:59.999Z');
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    // If no date entered yet, fallback to all
    return { startDate: null, endDate: null };
  }

  const now = new Date();
  const start = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === 'daily') {
    start.setHours(0,0,0,0);
  } else if (period === 'weekly') {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0,0,0,0);
  } else if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0,0,0,0);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0,0,0,0);
  } else {
    // 'all' or any unknown
    return { startDate: null, endDate: null };
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

async function fetchCategory(category) {
  const period = periodFilter.value;
  const { startDate, endDate } = getDateRange(period);
  try {
    const res = await fetch('/api/get-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, startDate, endDate }),
    });
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function loadAllData() {
  sectionsContainer.innerHTML = '<p style="color: var(--text-secondary);">Loading all data...</p>';
  const [items, samples, cleaning, persons, complains] = await Promise.all([
    fetchCategory('items'),
    fetchCategory('samples'),
    fetchCategory('cleaning'),
    fetchCategory('persons'),
    fetchCategory('complains')
  ]);
  allData = { items, samples, cleaning, persons, complains };
  renderAllSections();
}

function renderAllSections() {
  let html = '';

  // ---- ITEMS SECTION ----
  html += renderMainCategoryHeader('Items Details');
  const itemsByType = {};
  itemTypes.forEach(type => { itemsByType[type] = []; });
  allData.items.forEach(entry => {
    const type = entry.itemType || 'otherItem';
    if (itemsByType[type]) itemsByType[type].push(entry);
  });

  itemTypes.forEach(type => {
    const entries = itemsByType[type] || [];
    if (entries.length === 0) return;
    html += `<div class="sub-section"><h4>${itemTypeLabels[type]}</h4><div class="table-wrapper"><table class="data-table"><thead><tr>`;
    html += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Qty</th><th>Person</th><th>Color</th><th>Grade</th><th>Size</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      html += '<tr>';
      html += `<td>${new Date(entry.timestamp).toLocaleString()}</td>`;
      html += `<td>${entry.inOut || '-'}</td>`;
      html += `<td>${entry.number || '-'}</td>`;
      html += `<td>${entry.quantity || '-'}</td>`;
      html += `<td>${entry.personName || '-'}</td>`;
      html += `<td>${entry.color || '-'}</td>`;
      html += `<td>${entry.grade || '-'}</td>`;
      html += `<td>${entry.size || '-'}</td>`;
      html += `<td><button class="action-btn" onclick="deleteEntry('items', '${entry.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
  });

  if (allData.items.length === 0) html += '<p style="color: var(--text-secondary);">No items found.</p>';
  html += '</div>';

  // ---- SAMPLES SECTION ----
  html += renderMainCategoryHeader('Sample Details');
  if (allData.samples.length) {
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date/Time</th><th>In/Out</th><th>Number</th><th>Sample Name</th><th>Color</th><th>Person</th><th></th></tr></thead><tbody>';
    allData.samples.forEach(entry => {
      html += '<tr>';
      html += `<td>${new Date(entry.timestamp).toLocaleString()}</td><td>${entry.inOut || '-'}</td>`;
      html += `<td>${entry.number || '-'}</td>`;
      html += `<td>${entry.sampleName || ''}</td><td>${entry.sampleColor || ''}</td><td>${entry.personName || ''}</td>`;
      html += `<td><button class="action-btn" onclick="deleteEntry('samples', '${entry.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else html += '<p style="color: var(--text-secondary);">No samples found.</p>';
  html += '</div>';

  // ---- CLIPPING SECTION ----
  html += renderMainCategoryHeader('Clipping Details');
  if (allData.cleaning.length) {
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date/Time</th><th>In/Out</th><th>Number</th><th>Size (Guzz)</th><th>Person</th><th></th></tr></thead><tbody>';
    allData.cleaning.forEach(entry => {
      html += '<tr>';
      html += `<td>${new Date(entry.timestamp).toLocaleString()}</td><td>${entry.inOut || '-'}</td>`;
      html += `<td>${entry.number || '-'}</td>`;
      html += `<td>${entry.sizeGuzz || ''}</td><td>${entry.personName || ''}</td>`;
      html += `<td><button class="action-btn" onclick="deleteEntry('cleaning', '${entry.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else html += '<p style="color: var(--text-secondary);">No clipping data.</p>';
  html += '</div>';

  // ---- PERSON DETAILS ----
  html += renderMainCategoryHeader('Person Details (Absent)');
  if (allData.persons.length) {
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Reason</th><th></th></tr></thead><tbody>';
    allData.persons.forEach(entry => {
      html += '<tr>';
      html += `<td>${new Date(entry.timestamp).toLocaleString()}</td><td>${entry.inOut || '-'}</td>`;
      html += `<td>${entry.number || '-'}</td>`;
      html += `<td>${entry.name || ''}</td><td>${entry.reason || '-'}</td>`;
      html += `<td><button class="action-btn" onclick="deleteEntry('persons', '${entry.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else html += '<p style="color: var(--text-secondary);">No absent persons recorded.</p>';
  html += '</div>';

  // ---- COMPLAINS SECTION ----
  html += renderMainCategoryHeader('Complains');
  if (allData.complains.length) {
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Complain</th><th></th></tr></thead><tbody>';
    allData.complains.forEach(entry => {
      html += '<tr>';
      html += `<td>${new Date(entry.timestamp).toLocaleString()}</td><td>${entry.inOut || '-'}</td>`;
      html += `<td>${entry.number || '-'}</td>`;
      html += `<td>${entry.name || ''}</td><td>${entry.complain || ''}</td>`;
      html += `<td><button class="action-btn" onclick="deleteEntry('complains', '${entry.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else html += '<p style="color: var(--text-secondary);">No complaints recorded.</p>';
  html += '</div>';

  sectionsContainer.innerHTML = html;
}

function renderMainCategoryHeader(title) {
  return `
    <div class="glass-card category-section" style="margin-bottom: 28px;">
      <h2 style="margin-bottom: 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#gradIcon)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        ${title}
      </h2>
  `;
}

async function deleteEntry(category, id) {
  if (!confirm('Delete this entry?')) return;
  try {
    const res = await fetch('/api/delete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, id }),
    });
    if (res.ok) {
      showToast('✓ Entry deleted');
      loadAllData();
    } else {
      showToast('✗ Delete failed', true);
    }
  } catch (e) {
    showToast('✗ Network error', true);
  }
}

function downloadAll() {
  if (Object.values(allData).every(arr => arr.length === 0)) {
    showToast('No data to download', true);
    return;
  }
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `all_data_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

downloadAllBtn.addEventListener('click', downloadAll);

// Initial load (handled after auth)
// Load will be triggered by auth.js when authenticated and loadAllData is called