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

  // Generate random dataset (regression)
  function generateDataset() {
    const numPoints = Math.floor(Math.random() * 3) + 9; // 9–11
    let pointsArr = [];
    for (let i = 0; i < numPoints; i++) {
      pointsArr.push({
        x: Math.random(),
        y: Math.random(),
        value: Math.round(Math.random() * 100)
      });
    }
    return pointsArr;
  }

  // Draw a single point with value and color by value
  function drawPoint(nx, ny, value, radius, showValue) {
    // Color scale: blue for low, orange for high
    const color = value < 50 ? '#1976d2' : '#ff9800';
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
    // Draw value if present
    if (showValue) {
      ctx.font = `bold ${radius * 1.7}px Inter, Arial`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.95;
      ctx.fillText(value, px, py);
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  }

  // Enhanced render: draw lines to neighbors if classified
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw training points
    points.forEach(pt => {
      drawPoint(pt.x, pt.y, pt.value, 13, true);
    });
    // Draw query point if exists
    if (queryPoint) {
      // Draw lines to neighbors if classified
      if (queryPoint.classified && queryPoint.neighbors) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = queryPoint.value < 50 ? '#1976d2' : '#ff9800';
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
      // Draw query point in gray or classified color, slightly larger, with value if classified
      if (queryPoint.classified) {
        drawPoint(queryPoint.x, queryPoint.y, queryPoint.value, 16, true);
      } else {
        // Neutral gray dot, no value
        const px = Math.round(queryPoint.x * canvas.width) + 0.5;
        const py = Math.round(queryPoint.y * canvas.height) + 0.5;
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, 2 * Math.PI);
        ctx.fillStyle = '#888';
        ctx.shadowColor = '#888';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Initial dataset and render
  function resetAll() {
    points = generateDataset();
    queryPoint = null;
    resultDiv.textContent = '';
    render();
  }

  // Randomize Data button
  randomizeBtn.onclick = function() {
    resetAll();
  };

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

  // KNN regression
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
    // Average value
    const avg = Math.round(neighbors.reduce((sum, n) => sum + n.pt.value, 0) / k);
    queryPoint.classified = true;
    queryPoint.value = avg;
    queryPoint.neighbors = neighbors.map(n => n.pt);
    // Show result
    resultDiv.textContent = `Predicted value: ${avg} (K=${k})`;
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
};
