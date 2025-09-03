// ...Step 2 and onward will be implemented here...
// Initial structure for event listeners and setup
window.onload = function() {
  // DOM elements
  const canvas = document.getElementById('scatterplot');
  const ctx = canvas.getContext('2d');
  const kSelect = document.getElementById('k-select');
  const classifyBtn = document.getElementById('classify-btn');
  const randomizeBtn = document.getElementById('randomize-btn');
  const resetQueryBtn = document.getElementById('reset-query-btn');
  const resultDiv = document.getElementById('result');

  // Data state
  let points = [];
  let queryPoint = null;

  // Colors for classes
  const COLORS = {
    0: '#1976d2', // blue
    1: '#ff9800'  // orange
  };

  // Generate random dataset
  function generateDataset() {
    const numPoints = Math.floor(Math.random() * 3) + 9; // 9–11
    let pointsArr = [];
    let classCounts = [0, 0];
    for (let i = 0; i < numPoints; i++) {
      // Alternate class assignment for fair distribution
      let label = i % 2;
      classCounts[label]++;
      pointsArr.push({
        x: Math.random(),
        y: Math.random(),
        label
      });
    }
    // If uneven, adjust last point
    if (Math.abs(classCounts[0] - classCounts[1]) > 1) {
      pointsArr[pointsArr.length - 1].label = classCounts[0] > classCounts[1] ? 1 : 0;
    }
    return pointsArr;
  }

  // Draw all points
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw training points
    points.forEach(pt => {
      drawPoint(pt.x, pt.y, COLORS[pt.label], 7);
    });
    // Draw query point if exists
    if (queryPoint) {
      drawPoint(queryPoint.x, queryPoint.y, '#888', 11);
    }
  }

  // Draw a single point (crisp, centered)
  function drawPoint(nx, ny, color, radius) {
    const px = Math.round(nx * canvas.width) + 0.5;
    const py = Math.round(ny * canvas.height) + 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = color === '#888' ? 0 : 4;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Initial dataset and render
  function resetAll() {
    points = generateDataset();
    queryPoint = null;
    resultDiv.textContent = '';
    render();
  }

  // Randomize Data button
  randomizeBtn.onclick = resetAll;

  // Initial load
  resetAll();

  // Handle canvas clicks for query point
  canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Convert to normalized coordinates
    const nx = Math.max(0, Math.min(1, px / canvas.width));
    const ny = Math.max(0, Math.min(1, py / canvas.height));
    queryPoint = { x: nx, y: ny, classified: false };
    resultDiv.textContent = '';
    render();
  });

  // Reset Query button
  resetQueryBtn.onclick = function() {
    queryPoint = null;
    resultDiv.textContent = '';
    render();
  };

  // KNN classification
  function classifyQuery() {
    if (!queryPoint) return;
    const k = parseInt(kSelect.value);
    // Compute distances
    let distances = points.map(pt => {
      const dx = pt.x - queryPoint.x;
      const dy = pt.y - queryPoint.y;
      return {
        pt,
        dist: Math.sqrt(dx * dx + dy * dy)
      };
    });
    // Sort by distance
    distances.sort((a, b) => a.dist - b.dist);
    // Select K nearest
    const neighbors = distances.slice(0, k);
    // Majority vote
    let votes = { 0: 0, 1: 0 };
    neighbors.forEach(n => votes[n.pt.label]++);
    let winner;
    if (votes[0] > votes[1]) winner = 0;
    else if (votes[1] > votes[0]) winner = 1;
    else winner = neighbors[0].pt.label; // Tie: closest neighbor
    // Update query point color
    queryPoint.classified = true;
    queryPoint.label = winner;
    queryPoint.neighbors = neighbors.map(n => n.pt);
    // Show result
    resultDiv.textContent = `Class: ${winner === 0 ? 'Blue' : 'Orange'} (${votes[winner]}/${k})`;
    render();
  }

  // Classify button
  classifyBtn.onclick = classifyQuery;

  // K selector: reclassify if query exists and classified
  kSelect.onchange = function() {
    if (queryPoint && queryPoint.classified) {
      classifyQuery();
    }
  };

  // Enhanced render: draw lines to neighbors if classified
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw training points
    points.forEach(pt => {
      drawPoint(pt.x, pt.y, COLORS[pt.label], 7);
    });
    // Draw query point if exists
    if (queryPoint) {
      // Draw lines to neighbors if classified
      if (queryPoint.classified && queryPoint.neighbors) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = COLORS[queryPoint.label];
        ctx.lineWidth = 2;
        queryPoint.neighbors.forEach(npt => {
          ctx.beginPath();
          ctx.moveTo(queryPoint.x * canvas.width, queryPoint.y * canvas.height);
          ctx.lineTo(npt.x * canvas.width, npt.y * canvas.height);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.restore();
      }
      // Draw query point in gray or classified color, slightly larger
      const color = queryPoint.classified ? COLORS[queryPoint.label] : '#888';
      drawPoint(queryPoint.x, queryPoint.y, color, 12);
    }
  }
};
