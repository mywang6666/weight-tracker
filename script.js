const STORAGE_KEY = "fat-loss-weight-records";
const KG_TO_JIN = 2;

const form = document.getElementById("weightForm");
const recordDateInput = document.getElementById("recordDate");
const timeOneInput = document.getElementById("timeOne");
const timeTwoInput = document.getElementById("timeTwo");
const weightOneInput = document.getElementById("weightOne");
const weightTwoInput = document.getElementById("weightTwo");
const noteInput = document.getElementById("recordNote");
const clearFormBtn = document.getElementById("clearFormBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const recordsBody = document.getElementById("recordsBody");
const latestWeightEl = document.getElementById("latestWeight");
const lowestWeightEl = document.getElementById("lowestWeight");
const recordCountEl = document.getElementById("recordCount");
const chart = document.getElementById("weightChart");
const chartViewport = document.getElementById("chartViewport");
const chartEmpty = document.getElementById("chartEmpty");

let records = loadRecords();

initializeDefaults();
render();
window.addEventListener("resize", () => renderChart(sortRecords(records)));

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = recordDateInput.value;
  const note = noteInput.value.trim();
  const draftMeasurements = [
    { time: timeOneInput.value, kg: weightOneInput.value },
    { time: timeTwoInput.value, kg: weightTwoInput.value }
  ];

  const newRecords = draftMeasurements
    .filter((item) => item.kg !== "")
    .map((item, index) => ({
      id: buildRecordId(index),
      date,
      time: item.time || defaultTime(index),
      kg: Number(item.kg),
      note
    }))
    .filter((item) => Number.isFinite(item.kg) && item.kg > 0);

  if (!date || newRecords.length === 0) {
    window.alert("请至少填写日期和一次有效体重。");
    return;
  }

  records = [...records, ...newRecords];
  persistRecords();
  clearForm(true);
  render();
});

clearFormBtn.addEventListener("click", () => {
  clearForm(false);
});

clearAllBtn.addEventListener("click", () => {
  if (records.length === 0) {
    return;
  }

  const confirmed = window.confirm("确定要清空全部体重记录吗？");
  if (!confirmed) {
    return;
  }

  records = [];
  persistRecords();
  render();
});

recordsBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-record-id]");
  if (!deleteButton) {
    return;
  }

  const { recordId } = deleteButton.dataset;
  records = records.filter((item) => item.id !== recordId);
  persistRecords();
  render();
});

function initializeDefaults() {
  const today = new Date();
  recordDateInput.value = toDateInputValue(today);

  if (!timeOneInput.value) {
    timeOneInput.value = "07:00";
  }

  if (!timeTwoInput.value) {
    timeTwoInput.value = "23:00";
  }
}

function clearForm(resetDate) {
  if (resetDate) {
    recordDateInput.value = toDateInputValue(new Date());
  }

  timeOneInput.value = "07:00";
  timeTwoInput.value = "23:00";
  weightOneInput.value = "";
  weightTwoInput.value = "";
  noteInput.value = "";
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item, index) => ({
        id: item.id || buildRecordId(index),
        date: item.date || toDateInputValue(new Date()),
        time: item.time || defaultTime(index % 2),
        kg: Number(item.kg),
        note: item.note || ""
      }))
      .filter((item) => Number.isFinite(item.kg) && item.kg > 0);
  } catch (error) {
    console.error("Failed to load records:", error);
    return [];
  }
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function render() {
  const sortedRecords = sortRecords(records);
  renderStats(sortedRecords);
  renderTable(sortedRecords);
  renderChart(sortedRecords);
}

function renderStats(sortedRecords) {
  recordCountEl.textContent = String(sortedRecords.length);

  if (sortedRecords.length === 0) {
    latestWeightEl.textContent = "--";
    lowestWeightEl.textContent = "--";
    return;
  }

  const latest = sortedRecords[sortedRecords.length - 1];
  const lowest = sortedRecords.reduce((result, item) => (item.kg < result.kg ? item : result), sortedRecords[0]);

  latestWeightEl.textContent = `${latest.kg.toFixed(2)} kg / ${toJin(latest.kg).toFixed(2)} 斤`;
  lowestWeightEl.textContent = `${lowest.kg.toFixed(2)} kg / ${toJin(lowest.kg).toFixed(2)} 斤`;
}

function renderTable(sortedRecords) {
  if (sortedRecords.length === 0) {
    recordsBody.innerHTML = '<div class="empty-row">还没有体重记录。</div>';
    return;
  }

  const groupedRecords = groupRecordsByDate(sortedRecords);

  recordsBody.innerHTML = groupedRecords
    .map((group, groupIndex) => {
      const first = group.items[0];
      const last = group.items[group.items.length - 1];
      const averageKg = group.items.reduce((sum, item) => sum + item.kg, 0) / group.items.length;

      return `
        <details class="record-group" ${groupIndex < 2 ? "open" : ""}>
          <summary class="record-summary">
            <div class="record-date">
              <span class="record-arrow">›</span>
              <span>${group.date}</span>
            </div>
            <span class="record-meta">${group.items.length} 次记录</span>
            <span class="record-meta">范围 ${first.time} - ${last.time}</span>
            <span class="record-summary-strong">均值 ${toJin(averageKg).toFixed(2)} 斤</span>
          </summary>
          <div class="record-content">
            <div class="record-items">
              ${group.items
                .map(
                  (record) => `
                    <article class="record-item">
                      <div>
                        <div class="item-label">时间</div>
                        <div class="item-value">${record.time}</div>
                      </div>
                      <div>
                        <div class="item-label">公斤</div>
                        <div class="item-value">${record.kg.toFixed(2)}</div>
                      </div>
                      <div>
                        <div class="item-label">斤</div>
                        <div class="item-value">${toJin(record.kg).toFixed(2)}</div>
                      </div>
                      <div class="item-note">${escapeHtml(record.note || "无备注")}</div>
                      <button type="button" class="delete-btn" data-record-id="${record.id}">删除</button>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>
        </details>
      `;
    })
    .join("");
}

function renderChart(sortedRecords) {
  if (sortedRecords.length === 0) {
    chart.innerHTML = "";
    chart.setAttribute("viewBox", "0 0 960 500");
    chartEmpty.hidden = false;
    return;
  }

  chartEmpty.hidden = true;

  const { width, height, margin, tickInterval, pointLabelInterval, axisFontSize, pointFontSize, dotRadius } = getChartMetrics(sortedRecords.length);
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const jinValues = sortedRecords.map((item) => toJin(item.kg));
  const minValue = Math.min(...jinValues);
  const maxValue = Math.max(...jinValues);
  const padding = Math.max((maxValue - minValue) * 0.2, 1);
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;
  const yTicks = buildTicks(yMin, yMax, sortedRecords.length > 24 ? 4 : 5);

  const xStep = sortedRecords.length === 1 ? 0 : plotWidth / (sortedRecords.length - 1);
  const points = sortedRecords.map((record, index) => {
    const x = sortedRecords.length === 1 ? margin.left + plotWidth / 2 : margin.left + index * xStep;
    const y = margin.top + plotHeight - ((toJin(record.kg) - yMin) / (yMax - yMin || 1)) * plotHeight;
    return { x, y, record };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - margin.bottom).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - margin.bottom).toFixed(2)} Z`;

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);

  chart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="transparent"></rect>
    ${yTicks
      .map((tick) => {
        const y = margin.top + plotHeight - ((tick - yMin) / (yMax - yMin || 1)) * plotHeight;
        return `
          <line class="grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>
          <text class="axis-text" x="${margin.left - 10}" y="${y + 4}" text-anchor="end" style="font-size:${axisFontSize}px">${tick.toFixed(2)}</text>
        `;
      })
      .join("")}
    <line class="axis-line" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
    <line class="axis-line" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>
    <path class="trend-area" d="${areaPath}"></path>
    <path class="trend-line" d="${linePath}"></path>
    ${points
      .map((point, index) => {
        const isLatest = index === points.length - 1;
        const showAxisLabel = shouldShowXAxisLabel(index, sortedRecords.length, tickInterval);
        const showPointLabel = shouldShowPointLabel(index, sortedRecords.length, pointLabelInterval);
        return `
          <circle class="point-dot ${isLatest ? "latest" : ""}" cx="${point.x}" cy="${point.y}" r="${isLatest ? dotRadius + 1 : dotRadius}"></circle>
          ${showPointLabel ? `<text class="point-label" x="${point.x}" y="${point.y - 12}" text-anchor="middle" style="font-size:${pointFontSize}px">${toJin(point.record.kg).toFixed(2)}</text>` : ""}
          ${showAxisLabel ? createXAxisLabel(point.record, point.x, height - margin.bottom + 22, axisFontSize) : ""}
        `;
      })
      .join("")}
  `;
}

function sortRecords(list) {
  return [...list].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
    const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
    return timeA - timeB;
  });
}

function buildTicks(min, max, count) {
  if (max <= min) {
    return [min];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => Number((min + step * index).toFixed(2)));
}

function getChartMetrics(total) {
  const viewportWidth = Math.max(chartViewport.clientWidth || 0, 920);
  const width = Math.max(960, viewportWidth);
  const height = 500;
  const margin = {
    top: total > 20 ? 24 : 30,
    right: 32,
    bottom: total > 36 ? 80 : 92,
    left: total > 24 ? 68 : 76
  };

  const plotWidth = width - margin.left - margin.right;
  const minLabelSpacing = total <= 12 ? 90 : total <= 24 ? 72 : total <= 40 ? 58 : 48;
  const tickInterval = Math.max(1, Math.ceil((total * minLabelSpacing) / Math.max(plotWidth, 1)));
  const pointLabelInterval = total <= 10 ? 1 : total <= 18 ? 2 : total <= 30 ? 3 : total <= 48 ? 4 : 6;

  return {
    width,
    height,
    margin,
    tickInterval,
    pointLabelInterval,
    axisFontSize: total <= 10 ? 12 : total <= 24 ? 11 : total <= 40 ? 10 : 9,
    pointFontSize: total <= 10 ? 11 : total <= 24 ? 10 : 9,
    dotRadius: total <= 16 ? 5.5 : total <= 36 ? 4.8 : 4.2
  };
}

function shouldShowXAxisLabel(index, total, tickInterval) {
  if (index === 0 || index === total - 1) {
    return true;
  }

  return index % tickInterval === 0;
}

function shouldShowPointLabel(index, total, pointLabelInterval) {
  if (index === total - 1) {
    return true;
  }

  return index % pointLabelInterval === 0;
}

function createXAxisLabel(record, x, y, fontSize) {
  const dayText = record.date.slice(5).replace("-", "/");
  return `
    <text class="axis-text" x="${x}" y="${y}" text-anchor="middle" style="font-size:${fontSize}px">
      <tspan x="${x}" dy="0">${dayText}</tspan>
      <tspan x="${x}" dy="1.2em">${record.time}</tspan>
    </text>
  `;
}

function groupRecordsByDate(sortedRecords) {
  const groups = new Map();

  sortedRecords.forEach((record) => {
    if (!groups.has(record.date)) {
      groups.set(record.date, []);
    }
    groups.get(record.date).push(record);
  });

  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => a.time.localeCompare(b.time))
    }));
}

function toJin(kg) {
  return kg * KG_TO_JIN;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultTime(index) {
  return index === 0 ? "07:00" : "23:00";
}

function buildRecordId(index) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `record-${Date.now()}-${index}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
