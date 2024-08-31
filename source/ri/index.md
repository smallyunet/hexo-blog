---
title: 我的定投
date: 2024-08-28 15:18:10
type: home
---

### 第 1 个周期

|指标|状态|
|:---:|:---:|
|投资依据|《[我的加密货币定投策略（一）](/2024/08/28/我的加密货币定投策略（一）/)》|
|投资标的|[smallyu's RI - Cycle 1](https://coinmarketcap.com/watchlist/66d339a5c316be09d04b7b16/)|
|开始时间|2024 年 08 月 28 日|
|预期结束时间|2025 年 08 月 28 日|
|实际结束时间|--|
|已持续|<div id="days-elapsed">0天</div>|
|还剩|<div id="days-remaining">0天</div>|
|当前进度|<div id="progress-text">0.000000%</div>|
|当前收益率|<span id="yield">Loading...</span> <span style="font-size:80%">（<a href="https://github.com/smallyunet/ri-yield" target="_blank">Source</a>）</span>|

<br>
<div id="progress-bar-container" style="width: 100%; background-color: #e0e0e0; border-radius: 8px; margin-top: 10px;">
  <div id="progress-bar" style="width: 0%; height: 8px; background: linear-gradient(to right, #00f2fe, #4facfe); border-radius: 8px;"></div>
</div>

<script>
  const startDate = new Date('2024-08-28T00:00:00');
  const endDate = new Date('2025-08-28T00:00:00');
  const totalTime = endDate - startDate;
  const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
  function updateProgress() {
    const currentDate = new Date();
    const elapsedTime = currentDate - startDate;
    let progress = (elapsedTime / totalTime) * 100;
    if (progress > 100) {
      progress = 100;
    }
    const progressText = progress.toFixed(6);
    document.getElementById('progress-text').innerHTML = `${progressText}%`;
    document.getElementById('progress-bar').style.width = progress + '%';

    const daysElapsed = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;
    document.getElementById('days-elapsed').innerHTML = `${daysElapsed}天`;
    document.getElementById('days-remaining').innerHTML = `${daysRemaining}天`;
    if (progress < 100) {
      requestAnimationFrame(updateProgress);
    }
  }
  updateProgress();
</script>

<script>
  // Function to get the previous day's date in YYYYMMDD format
  function getPreviousDayDateStr() {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');  // Months are 0-based, so add 1
      const day = String(yesterday.getDate()).padStart(2, '0');

      return `${year}${month}${day}`;
  }

  // Function to fetch yield data from the dynamically constructed URL and update the HTML element
  async function fetchYieldRate() {
      try {
          // Construct the URL for the previous day's JSON file
          const dateStr = getPreviousDayDateStr();
          const url = `https://smallyunet.github.io/ri-yield/${dateStr}.yield.json`;
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
          }
          const data = await response.json();

          const yieldRate = data.yield_rate-1;
          document.getElementById('yield').textContent = (yieldRate * 100).toFixed(2) + '%';
          if (yieldRate > 0) {
            document.getElementById('yield').style = "color:green"
          } else {
            document.getElementById('yield').style = "color:red"
          }
      } catch (error) {
          console.error('Error fetching yield data:', error);
          document.getElementById('yield').textContent = 'Nil';
      }
  }

  // Call the function to fetch and display the yield rate when the page loads
  fetchYieldRate();
</script>