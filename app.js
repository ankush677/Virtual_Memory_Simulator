

'use strict';


const sections = ['dashboard','paging','segmentation','fragmentation','comparison','theory'];

function navigate(id) {
  sections.forEach(s => {
    const el = document.getElementById('sec-' + s);
    const link = document.querySelector(`[data-nav="${s}"]`);
    if (el) el.classList.toggle('hidden', s !== id);
    if (link) link.classList.toggle('active', s === id);
  });

  const titles = {
    dashboard: 'Dashboard',
    paging: 'Paging Simulator',
    segmentation: 'Segmentation',
    fragmentation: 'Memory Fragmentation',
    comparison: 'Algorithm Comparison',
    theory: 'Theory & Help',
  };
  const el = document.getElementById('section-title');
  if (el) el.textContent = titles[id] || id;
  window.scrollTo(0, 0);
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}


let pagingState = {
  algorithm: 'FIFO',
  result: null,
  currentStep: -1,
  playing: false,
  playTimer: null,
};

function initPaging() {
  
  document.getElementById('pg-frames').value = '3';
  document.getElementById('pg-ref').value = '7 0 1 2 0 3 0 4 2 3 0 3 2';
  document.getElementById('pg-speed').value = '800';
  selectAlgorithm('FIFO');
}

function selectAlgorithm(alg) {
  pagingState.algorithm = alg;
  document.querySelectorAll('.alg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.alg === alg);
  });
}

function runPagingSimulation() {
  const numFrames = parseInt(document.getElementById('pg-frames').value);
  const refInput  = document.getElementById('pg-ref').value;
  const refString = parseRefString(refInput);

  
  if (isNaN(numFrames) || numFrames < 1 || numFrames > 10) {
    showToast('Frames must be between 1 and 10', 'error');
    return;
  }
  if (refString.length < 1) {
    showToast('Enter a valid page reference string', 'error');
    return;
  }
  if (refString.length > 50) {
    showToast('Reference string too long (max 50)', 'error');
    return;
  }

  stopPlay();

  let result;
  switch (pagingState.algorithm) {
    case 'FIFO':    result = runFIFO(numFrames, refString);    break;
    case 'LRU':     result = runLRU(numFrames, refString);     break;
    case 'Optimal': result = runOptimal(numFrames, refString); break;
  }

  pagingState.result = result;
  pagingState.currentStep = 0;
  pagingState.numFrames = numFrames;

  renderStepTable(result);
  renderPagingStep(0);
  updateStepControls();
  document.getElementById('paging-output').classList.remove('hidden');
  showToast(`${result.algorithm} simulation complete — ${result.faults} faults`, 'success');
}


function renderStepTable(result) {
  const numFrames = result.steps[0]?.frames.length || 3;
  const thead = document.getElementById('step-thead');
  const tbody = document.getElementById('step-tbody');

  
  let th = '<tr><th>#</th><th>Page</th>';
  for (let i = 0; i < numFrames; i++) th += `<th>F${i + 1}</th>`;
  th += '<th>Status</th></tr>';
  thead.innerHTML = th;

  let html = '';
  result.steps.forEach((s, idx) => {
    const rowClass = s.fault ? 'row-fault' : 'row-hit';
    html += `<tr class="${rowClass}" data-step="${idx}">
      <td class="muted">${s.step}</td>
      <td class="page-cell">${s.page}</td>`;
    s.frames.forEach(f => {
      html += `<td class="frame-cell">${f !== null ? f : '—'}</td>`;
    });
    html += `<td><span class="badge ${s.fault ? 'badge-fault' : 'badge-hit'}">${s.fault ? 'FAULT' : 'HIT'}</span></td>`;
    html += '</tr>';
  });
  tbody.innerHTML = html;

  
  document.getElementById('stat-faults').textContent = result.faults;
  document.getElementById('stat-hits').textContent   = result.hits;
  document.getElementById('stat-fault-rate').textContent = result.faultRate + '%';
  document.getElementById('stat-hit-rate').textContent   = result.hitRate   + '%';
  document.getElementById('stat-total').textContent  = result.total;
}


function renderPagingStep(stepIdx) {
  const result = pagingState.result;
  if (!result) return;
  const step = result.steps[stepIdx];
  if (!step) return;

  pagingState.currentStep = stepIdx;

 
  document.querySelectorAll('#step-tbody tr').forEach((r, i) => {
    r.classList.toggle('current-row', i === stepIdx);
  });

  
  const currentRow = document.querySelector('#step-tbody tr.current-row');
  if (currentRow) currentRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

 
  const container = document.getElementById('frame-boxes');
  let html = '';
  step.frames.forEach((f, i) => {
    const isEmpty   = f === null;
    const isNew     = step.fault && step.insertIdx === i;
    const highlight = isNew ? (step.fault ? 'frame-fault' : 'frame-hit') : (f !== null ? 'frame-filled' : '');
    html += `
      <div class="frame-box ${highlight}">
        <div class="frame-label">F${i + 1}</div>
        <div class="frame-value">${isEmpty ? '—' : f}</div>
        ${isNew ? '<div class="frame-tag">' + (step.fault ? '↑NEW' : 'HIT') + '</div>' : ''}
      </div>`;
  });
  container.innerHTML = html;

  
  const infoEl = document.getElementById('step-info');
  if (step.fault) {
    infoEl.innerHTML = `<span class="text-fault">● FAULT</span>  Page <b>${step.page}</b> not in frames.
${step.evicted !== null ? `Evicted page <b>${step.evicted}</b>.` : 'Empty frame used.'}
Loaded page <b>${step.page}</b> → Frame ${step.insertIdx + 1}.`;
  } else {
    infoEl.innerHTML = `<span class="text-hit">● HIT</span>  Page <b>${step.page}</b> found in frames. No change.`;
  }

  const progress = ((stepIdx + 1) / result.steps.length) * 100;
  document.getElementById('step-progress').style.width = progress + '%';
  document.getElementById('step-counter').textContent = `Step ${stepIdx + 1} / ${result.steps.length}`;

  updateStepControls();
}

function updateStepControls() {
  const r = pagingState.result;
  if (!r) return;
  const s = pagingState.currentStep;
  document.getElementById('btn-prev').disabled = s <= 0;
  document.getElementById('btn-next').disabled = s >= r.steps.length - 1;
}

function stepNext()  { if (pagingState.currentStep < pagingState.result.steps.length - 1) renderPagingStep(pagingState.currentStep + 1); }
function stepPrev()  { if (pagingState.currentStep > 0) renderPagingStep(pagingState.currentStep - 1); }
function stepFirst() { renderPagingStep(0); }
function stepLast()  { renderPagingStep(pagingState.result.steps.length - 1); }

function startPlay() {
  if (!pagingState.result) return;
  if (pagingState.currentStep >= pagingState.result.steps.length - 1) renderPagingStep(0);
  pagingState.playing = true;
  document.getElementById('btn-play').classList.add('hidden');
  document.getElementById('btn-pause').classList.remove('hidden');
  playTick();
}

function stopPlay() {
  pagingState.playing = false;
  clearTimeout(pagingState.playTimer);
  document.getElementById('btn-play')?.classList.remove('hidden');
  document.getElementById('btn-pause')?.classList.add('hidden');
}

function playTick() {
  if (!pagingState.playing) return;
  if (pagingState.currentStep >= pagingState.result.steps.length - 1) {
    stopPlay();
    return;
  }
  stepNext();
  const speed = parseInt(document.getElementById('pg-speed').value) || 800;
  pagingState.playTimer = setTimeout(playTick, speed);
}

function resetPaging() {
  stopPlay();
  pagingState.result = null;
  pagingState.currentStep = -1;
  document.getElementById('paging-output').classList.add('hidden');
}

// ─────────────────────────────────────────────
//  Segmentation Simulator
// ─────────────────────────────────────────────
function initSegmentation() {
  document.getElementById('seg-memory').value = '512';
  renderSegRows();
}

function renderSegRows() {
  const container = document.getElementById('seg-rows');
  const count = parseInt(document.getElementById('seg-count').value) || 3;
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
    <div class="seg-row">
      <span class="seg-num">SEG ${i}</span>
      <input type="text" class="form-input seg-name" placeholder="Name (e.g. Stack)" value="${['Code','Stack','Heap','Data','BSS'][i] || 'Seg'+i}">
      <input type="number" class="form-input seg-size" placeholder="Size (KB)" value="${[64,32,128,48,16][i] || 32}" min="1">
    </div>`;
  }
  container.innerHTML = html;
}

function runSegmentation() {
  const totalMemory = parseInt(document.getElementById('seg-memory').value);
  if (isNaN(totalMemory) || totalMemory < 1) {
    showToast('Enter valid total memory size', 'error');
    return;
  }
  const names = [...document.querySelectorAll('.seg-name')].map(e => e.value || 'Seg');
  const sizes = [...document.querySelectorAll('.seg-size')].map(e => parseInt(e.value) || 0);
  const segments = names.map((n, i) => ({ name: n, size: sizes[i] }));

  const result = simulateSegmentation(totalMemory, segments);
  renderSegOutput(result);
  document.getElementById('seg-output').classList.remove('hidden');
}

function renderSegOutput(result) {
  // Table
  let html = '';
  result.segments.forEach(s => {
    if (s.error) {
      html += `<tr class="row-fault">
        <td>${s.name}</td><td>${s.size}</td><td>—</td><td>—</td>
        <td><span class="badge badge-fault">SEG FAULT</span><br><small class="muted">${s.error}</small></td>
      </tr>`;
    } else {
      html += `<tr class="row-hit">
        <td>${s.name}</td><td>${s.size}</td><td>${s.base}</td><td>${s.end}</td>
        <td><span class="badge badge-hit">OK</span></td>
      </tr>`;
    }
  });
  document.getElementById('seg-table-body').innerHTML = html;

  
  document.getElementById('seg-used').textContent  = result.totalUsed + ' KB';
  document.getElementById('seg-free').textContent  = result.totalFree + ' KB';
  document.getElementById('seg-util').textContent  = result.utilizationPct + '%';

  
  const strip = document.getElementById('seg-visual');
  let stripHtml = '';
  result.segments.forEach(s => {
    const pct = ((s.size / result.totalMemory) * 100).toFixed(1);
    if (s.error) {
      stripHtml += `<div class="mem-block mem-fault" style="width:${pct}%" title="${s.name}: FAULT">
        <span>${s.name}</span></div>`;
    } else {
      stripHtml += `<div class="mem-block mem-alloc" style="width:${pct}%" title="${s.name}: ${s.base}–${s.end}">
        <span>${s.name}</span></div>`;
    }
  });
  const freePct = ((result.totalFree / result.totalMemory) * 100).toFixed(1);
  if (parseFloat(freePct) > 0) {
    stripHtml += `<div class="mem-block mem-free" style="width:${freePct}%" title="Free: ${result.totalFree} KB">
      <span>FREE</span></div>`;
  }
  strip.innerHTML = stripHtml;
}


function initFragmentation() {
  document.getElementById('frag-total').value    = '16';
  document.getElementById('frag-blocksize').value = '16';
  renderFragRows();
}

function renderFragRows() {
  const container = document.getElementById('frag-rows');
  const count = parseInt(document.getElementById('frag-count').value) || 4;
  let html = '';
  const defaults = [
    { name: 'Process A', size: 14 },
    { name: 'Process B', size: 28 },
    { name: 'Process C', size: 10 },
    { name: 'Process D', size: 30 },
    { name: 'Process E', size: 20 },
  ];
  for (let i = 0; i < count; i++) {
    const d = defaults[i] || { name: `Process ${String.fromCharCode(65+i)}`, size: 20 };
    html += `
    <div class="seg-row">
      <span class="seg-num">${String.fromCharCode(65+i)}</span>
      <input type="text" class="form-input frag-name" placeholder="Process name" value="${d.name}">
      <input type="number" class="form-input frag-size" placeholder="Size (KB)" value="${d.size}" min="1">
    </div>`;
  }
  container.innerHTML = html;
}

function runFragmentation() {
  const totalBlocks = parseInt(document.getElementById('frag-total').value);
  const blockSize   = parseInt(document.getElementById('frag-blocksize').value);
  if (isNaN(totalBlocks) || isNaN(blockSize) || totalBlocks < 1 || blockSize < 1) {
    showToast('Enter valid block configuration', 'error');
    return;
  }
  const names = [...document.querySelectorAll('.frag-name')].map(e => e.value || 'Process');
  const sizes = [...document.querySelectorAll('.frag-size')].map(e => parseInt(e.value) || 0);
  const allocations = names.map((n, i) => ({ name: n, size: sizes[i] }));

  const result = simulateFragmentation(totalBlocks, blockSize, allocations);
  renderFragOutput(result);
  document.getElementById('frag-output').classList.remove('hidden');
}

function renderFragOutput(result) {
 
  document.getElementById('frag-total-size').textContent  = result.totalSize + ' KB';
  document.getElementById('frag-used-val').textContent    = result.totalRequested + ' KB';
  document.getElementById('frag-wasted-val').textContent  = result.totalWasted + ' KB';
  document.getElementById('frag-free-val').textContent    = result.externalFree + ' KB';
  document.getElementById('frag-int-pct').textContent     = result.internalPct + '%';
  document.getElementById('frag-ext-pct').textContent     = result.externalPct + '%';

 
  let html = '';
  result.partitions.forEach(p => {
    html += `<tr>
      <td>${p.name}</td>
      <td>${p.requested} KB</td>
      <td>${p.allocated} KB</td>
      <td class="text-fault">${p.wasted} KB</td>
      <td>${p.blocks}</td>
    </tr>`;
  });
  document.getElementById('frag-table-body').innerHTML = html;

  renderFragVisual(result);

  
  renderFragChart(result.partitions);
  renderMemoryPieChart(result.totalRequested, result.externalFree, result.totalWasted);
}

function renderFragVisual(result) {
  const container = document.getElementById('frag-visual');
  let html = '<div class="frag-grid">';
  let blockIdx = 0;

  result.partitions.forEach((p, pi) => {
    const colors = ['#00d4ff','#00ff88','#ff9f43','#a29bfe','#fd79a8','#fdcb6e'];
    const col = colors[pi % colors.length];
    for (let b = 0; b < p.blocks; b++) {
      const isWasted = b === p.blocks - 1 && p.wasted > 0;
      html += `<div class="frag-block ${isWasted ? 'frag-wasted' : 'frag-used'}"
        style="${isWasted ? '' : `background:${col}33;border-color:${col}`}"
        title="${p.name}${isWasted ? ' (wasted: ' + p.wasted + 'KB)' : ''}">
        <span class="frag-block-label">${isWasted ? '✗' : (p.name[0] || '?')}</span>
      </div>`;
      blockIdx++;
    }
  });

  const allocatedBlocks = result.partitions.reduce((s, p) => s + p.blocks, 0);
  const freeBlocks = result.totalBlocks - allocatedBlocks;
  for (let i = 0; i < Math.max(0, freeBlocks); i++) {
    html += `<div class="frag-block frag-free" title="Free block">
      <span class="frag-block-label">○</span></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}


function runComparison() {
  const numFrames = parseInt(document.getElementById('cmp-frames').value);
  const refInput  = document.getElementById('cmp-ref').value;
  const refString = parseRefString(refInput);

  if (isNaN(numFrames) || numFrames < 1 || numFrames > 10) {
    showToast('Frames must be 1–10', 'error');
    return;
  }
  if (refString.length < 1) {
    showToast('Enter a valid reference string', 'error');
    return;
  }

  const results = runComparison_algo(numFrames, refString);
  renderComparisonOutput(results);
  document.getElementById('cmp-output').classList.remove('hidden');
}


function runComparison_algo(numFrames, refString) {
  return [
    runFIFO(numFrames, refString),
    runLRU(numFrames, refString),
    runOptimal(numFrames, refString),
  ];
}

function renderComparisonOutput(results) {
 
  const minFaults = Math.min(...results.map(r => r.faults));

  let html = '';
  results.forEach(r => {
    const best = r.faults === minFaults;
    html += `<tr class="${best ? 'row-best' : ''}">
      <td><b>${r.algorithm}</b>${best ? ' <span class="badge badge-hit">BEST</span>' : ''}</td>
      <td class="text-fault">${r.faults}</td>
      <td class="text-hit">${r.hits}</td>
      <td>${r.faultRate}%</td>
      <td>${r.hitRate}%</td>
    </tr>`;
  });
  document.getElementById('cmp-table-body').innerHTML = html;

  const best = results.find(r => r.faults === minFaults);
  document.getElementById('cmp-best-name').textContent  = best.algorithm;
  document.getElementById('cmp-best-faults').textContent = best.faults;
  document.getElementById('cmp-best-rate').textContent   = best.hitRate + '%';

  renderComparisonChart(results);
  renderFaultTrendChart(results);
}


function initDashboard() {
  // Quick demo stats with default inputs
  const refString = parseRefString('7 0 1 2 0 3 0 4 2 3 0 3 2');
  const results = runComparison_algo(3, refString);
  document.getElementById('dash-total-pages').textContent = refString.length;
  document.getElementById('dash-fifo-faults').textContent  = results[0].faults;
  document.getElementById('dash-lru-faults').textContent   = results[1].faults;
  document.getElementById('dash-opt-faults').textContent   = results[2].faults;
}


function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}


function exportResults() {
  const r = pagingState.result;
  if (!r) { showToast('Run a simulation first', 'error'); return; }

  let csv = 'Step,Page,';
  const numFrames = r.steps[0].frames.length;
  for (let i = 0; i < numFrames; i++) csv += `Frame${i+1},`;
  csv += 'Status\n';

  r.steps.forEach(s => {
    csv += `${s.step},${s.page},`;
    s.frames.forEach(f => csv += `${f !== null ? f : ''},`);
    csv += `${s.fault ? 'FAULT' : 'HIT'}\n`;
  });
  csv += `\nTotal Faults,${r.faults}\nTotal Hits,${r.hits}\nFault Rate,${r.faultRate}%\nHit Rate,${r.hitRate}%\n`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `vmms_${r.algorithm}_results.csv`;
  a.click();
  showToast('Results exported as CSV', 'success');
}


document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
  initDashboard();
  initPaging();
  initSegmentation();
  initFragmentation();

 
  document.getElementById('cmp-frames').value = '3';
  document.getElementById('cmp-ref').value    = '7 0 1 2 0 3 0 4 2 3 0 3 2';

  
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.nav);
    });
  });

  
  document.getElementById('seg-count')?.addEventListener('change', renderSegRows);
  document.getElementById('frag-count')?.addEventListener('change', renderFragRows);
});
