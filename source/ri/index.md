---
title: 我的定投
date: 2024-08-28 15:18:10
---

### 第 1 个周期

|指标|状态|
|:--:|:--:|
|投资依据|《[我的加密货币定投策略（一）](/2024/08/28/我的加密货币定投策略（一）/)》|
|开始时间|2024 年 08 月 28 日|
|结束时间|2025 年 08 月 28 日|
|已持续|<div id="days-elapsed">0天</div>|
|还剩|<div id="days-remaining">0天</div>|
|当前进度|<div id="progress-text">0.000000%</div>|

<br>
<div id="progress-bar-container" style="width: 100%; background-color: #e0e0e0; border-radius: 8px; margin-top: 10px;">
  <div id="progress-bar" style="width: 0%; height: 8px; background: linear-gradient(to right, #00f2fe, #4facfe); border-radius: 8px;"></div>
</div>

<script>
  const startDate = new Date('2024-08-28T00:00:00');
  const endDate = new Date('2025-08-28T00:00:00');
  const totalTime = endDate - startDate;
  const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24)); // 总天数
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