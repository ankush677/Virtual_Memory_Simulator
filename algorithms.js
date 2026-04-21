

'use strict';

function parseRefString(input) {
  return input
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => !isNaN(n) && n >= 0);
}

function runFIFO(numFrames, refString) {
  const frames = new Array(numFrames).fill(null);
  const steps = [];
  let pointer = 0; // next slot to replace
  let faults = 0;
  let hits = 0;

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const framesBefore = [...frames];
    let fault = false;
    let evicted = null;
    let insertIdx = null;

    if (frames.includes(page)) {
      
      hits++;
    } else {
      
      faults++;
      fault = true;
      evicted = frames[pointer] !== null ? frames[pointer] : null;
      insertIdx = pointer;
      frames[pointer] = page;
      pointer = (pointer + 1) % numFrames;
    }

    steps.push({
      step: i + 1,
      page,
      frames: [...frames],
      framesBefore,
      fault,
      hit: !fault,
      evicted,
      insertIdx,
      totalFaults: faults,
      totalHits: hits,
    });
  }

  return buildResult('FIFO', steps, faults, hits, refString.length);
}

function runLRU(numFrames, refString) {
  const frames = [];
  const steps = [];
  let faults = 0;
  let hits = 0;

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const framesBefore = padFrames([...frames], numFrames);
    let fault = false;
    let evicted = null;
    let insertIdx = null;

    const idx = frames.indexOf(page);
    if (idx !== -1) {
      
      hits++;
      frames.splice(idx, 1);
      frames.push(page);
    } else {
      
      faults++;
      fault = true;
      if (frames.length === numFrames) {
        evicted = frames.shift();
      }
      frames.push(page);
      insertIdx = frames.length - 1;
    }

    const paddedFrames = padFrames([...frames], numFrames);
    steps.push({
      step: i + 1,
      page,
      frames: paddedFrames,
      framesBefore,
      fault,
      hit: !fault,
      evicted,
      insertIdx,
      totalFaults: faults,
      totalHits: hits,
    });
  }

  return buildResult('LRU', steps, faults, hits, refString.length);
}


function runOptimal(numFrames, refString) {
  const frames = [];
  const steps = [];
  let faults = 0;
  let hits = 0;

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    const framesBefore = padFrames([...frames], numFrames);
    let fault = false;
    let evicted = null;
    let insertIdx = null;

    if (frames.includes(page)) {
      hits++;
    } else {
      faults++;
      fault = true;

      if (frames.length < numFrames) {
        frames.push(page);
        insertIdx = frames.length - 1;
      } else {
        
        let farthestIdx = -1;
        let farthestDist = -1;

        frames.forEach((f, fi) => {
          const nextUse = refString.indexOf(f, i + 1);
          const dist = nextUse === -1 ? Infinity : nextUse;
          if (dist > farthestDist) {
            farthestDist = dist;
            farthestIdx = fi;
          }
        });

        evicted = frames[farthestIdx];
        frames[farthestIdx] = page;
        insertIdx = farthestIdx;
      }
    }

    const paddedFrames = padFrames([...frames], numFrames);
    steps.push({
      step: i + 1,
      page,
      frames: paddedFrames,
      framesBefore,
      fault,
      hit: !fault,
      evicted,
      insertIdx,
      totalFaults: faults,
      totalHits: hits,
    });
  }

  return buildResult('Optimal', steps, faults, hits, refString.length);
}


function padFrames(arr, length) {
  const result = [...arr];
  while (result.length < length) result.push(null);
  return result;
}

function buildResult(name, steps, faults, hits, total) {
  return {
    algorithm: name,
    steps,
    faults,
    hits,
    total,
    faultRate: ((faults / total) * 100).toFixed(1),
    hitRate: ((hits / total) * 100).toFixed(1),
  };
}


function runComparison(numFrames, refString) {
  return [
    runFIFO(numFrames, refString),
    runLRU(numFrames, refString),
    runOptimal(numFrames, refString),
  ];
}


function simulateSegmentation(totalMemory, segments) {
 
  let pointer = 0;
  const result = [];
  let totalUsed = 0;

  for (const seg of segments) {
    if (seg.size <= 0) {
      result.push({ ...seg, base: null, error: 'Invalid size (≤0)' });
      continue;
    }
    if (pointer + seg.size > totalMemory) {
      result.push({ ...seg, base: null, error: 'Segmentation Fault — Out of memory' });
      continue;
    }
    result.push({ ...seg, base: pointer, end: pointer + seg.size - 1, error: null });
    pointer += seg.size;
    totalUsed += seg.size;
  }

  return {
    segments: result,
    totalMemory,
    totalUsed,
    totalFree: totalMemory - totalUsed,
    utilizationPct: ((totalUsed / totalMemory) * 100).toFixed(1),
  };
}


function simulateFragmentation(totalBlocks, blockSize, allocations) {
  
  const partitions = [];
  let externalFree = 0;

  for (const alloc of allocations) {
    const blocksNeeded = Math.ceil(alloc.size / blockSize);
    const allocated = blocksNeeded * blockSize;
    const wasted = allocated - alloc.size;
    partitions.push({
      name: alloc.name,
      requested: alloc.size,
      allocated,
      wasted,
      blocks: blocksNeeded,
    });
  }

  const totalAllocated = partitions.reduce((s, p) => s + p.allocated, 0);
  const totalWasted = partitions.reduce((s, p) => s + p.wasted, 0);
  const totalRequested = partitions.reduce((s, p) => s + p.requested, 0);
  const totalSize = totalBlocks * blockSize;
  externalFree = totalSize - totalAllocated;

  return {
    partitions,
    blockSize,
    totalBlocks,
    totalSize,
    totalRequested,
    totalAllocated,
    totalWasted,   
    externalFree,  
    internalPct: ((totalWasted / totalSize) * 100).toFixed(1),
    externalPct: ((externalFree / totalSize) * 100).toFixed(1),
    usedPct: ((totalRequested / totalSize) * 100).toFixed(1),
  };
}
