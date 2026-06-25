<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>一般住宅 負荷計算書 Ver.1.0</title>
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-180.svg">
<link rel="stylesheet" href="css/style.css">
<meta name="theme-color" content="#0f766e">
</head>
<body>
<header>
  <h1>一般住宅 負荷計算書 Ver.1.0</h1>
  <p>照明・コンセント・専用負荷から、契約容量・主幹・幹線・参考分電盤を簡易算定します。</p>
</header>

<main>
<details class="notice">
  <summary>出典・注意事項</summary>
  <p>本アプリは一般住宅の初期検討・見積補助用の参考計算ツールです。正式設計・申請では、電力会社申請条件、内線規程、メーカー資料、現場条件、設計者判断を必ず確認してください。分岐回路数・分電盤候補は参考表示です。</p>
</details>

<section class="card">
  <h2>基本情報</h2>
  <div class="grid">
    <div><label>現場名</label><input id="siteName" placeholder="例：○○様邸 新築工事"></div>
    <div><label>建物名</label><input id="buildingName" placeholder="例：○○様邸"></div>
    <div><label>作成者</label><input id="author" placeholder="例：○○電気設計"></div>
    <div><label>会社名</label><input id="company" placeholder="例：株式会社○○電設"></div>
    <div><label>電気方式</label><select id="system"><option value="single3">単相3線式</option><option value="single2">単相2線式</option></select></div>
    <div><label>電圧</label><select id="voltage"><option value="100">100V換算</option><option value="200">200V換算</option></select></div>
    <div><label>需要率</label><div class="unitbox"><input id="demandRate" type="number" value="70" step="1"><span>%</span></div></div>
    <div><label>こう長</label><div class="unitbox"><input id="length" type="number" value="20" step="1"><span>m</span></div></div>
    <div><label>許容電圧降下率</label><div class="unitbox"><input id="allowDrop" type="number" value="2.0" step="0.1"><span>%</span></div></div>
    <div><label>予備回路数</label><div class="unitbox"><input id="spareCircuits" type="number" value="2" step="1"><span>回路</span></div></div>
  </div>
</section>

<section class="card">
  <h2>一般負荷</h2>
  <div class="grid">
    <div><label>照明器具数</label><div class="unitbox"><input id="lightCount" type="number" value="20" step="1"><span>灯</span></div></div>
    <div><label>照明係数</label><div class="unitbox"><input id="lightVa" type="number" value="100" step="10"><span>VA/灯</span></div></div>
    <div><label>コンセント数</label><div class="unitbox"><input id="outletCount" type="number" value="15" step="1"><span>箇所</span></div></div>
    <div><label>コンセント係数</label><div class="unitbox"><input id="outletVa" type="number" value="150" step="10"><span>VA/箇所</span></div></div>
    <div><label>一般回路上限</label><div class="unitbox"><input id="generalCircuitLimit" type="number" value="1500" step="100"><span>VA/回路</span></div></div>
  </div>
  <p class="hint">一般回路数は参考表示です。実際の分岐回路構成は平面図・部屋種別・設備仕様により決定してください。</p>
</section>

<section class="card">
  <h2>専用負荷</h2>
  <div id="loadCards" class="mobileCards"></div>
  <div class="tableWrap desktopTable">
    <table id="loadTable">
      <thead><tr><th>使用</th><th>機器</th><th>台数</th><th>1台容量 VA</th><th>合計 VA</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</section>

<section class="card result">
  <h2>計算結果</h2>
  <div class="summaryGrid">
    <div><span>一般負荷</span><b id="generalLoad">0 VA</b></div>
    <div><span>専用負荷</span><b id="dedicatedLoad">0 VA</b></div>
    <div><span>総負荷</span><b id="totalLoad">0 VA</b></div>
    <div><span>需要率後</span><b id="demandLoad">0 VA</b></div>
    <div><span>必要電流</span><b id="requiredAmp">0 A</b></div>
    <div><span>推奨契約</span><b id="contractRecommend">-</b></div>
    <div><span>推奨主幹</span><b id="mainBreaker">-</b></div>
    <div><span>推奨幹線</span><b id="mainCable">-</b></div>
  </div>

  <h3>参考：分岐回路数・分電盤候補</h3>
  <div class="tableWrap">
    <table id="panelTable"></table>
  </div>

  <h3>電力会社申請用 参考表示</h3>
  <div class="tableWrap">
    <table id="applyTable"></table>
  </div>

  <h3>系統構成イメージ</h3>
  <div id="diagram" class="diagramBox"></div>
</section>

<section class="card actions">
  <button class="primary" onclick="App.calculate()">計算</button>
  <button class="green" onclick="Storage.save()">保存</button>
  <button onclick="Storage.load()">読込</button>
  <button onclick="Storage.exportJson()">JSON保存</button>
  <button onclick="Storage.importJson()">JSON読込</button>
  <button onclick="window.print()">印刷/PDF</button>
  <button class="dark" onclick="Master.open()">マスタ編集</button>
  <button class="warn" onclick="Storage.resetSample()">サンプル復元</button>
</section>

<section class="printOnly printSheet">
  <h1>一般住宅 負荷計算書 Ver.1.0</h1>
  <div class="printInfo">
    <div>現場名：<span id="pSite"></span></div>
    <div>建物名：<span id="pBuilding"></span></div>
    <div>作成日：<span id="pDate"></span></div>
    <div>作成者：<span id="pAuthor"></span></div>
  </div>
  <h2>負荷集計</h2>
  <table id="printSummary"></table>
  <h2>専用負荷一覧</h2>
  <table id="printLoads"></table>
  <h2>契約容量・主幹・幹線・分電盤参考</h2>
  <table id="printApply"></table>
  <h2>系統構成イメージ</h2>
  <div id="printDiagram"></div>
  <p class="printNote">※本計算は参考値です。正式設計では電力会社申請条件、内線規程、メーカー資料、現場条件を確認してください。</p>
</section>
</main>

<div id="toast"></div>

<div class="modalBg" id="masterModal">
  <div class="modal">
    <button class="close" onclick="Master.close()">閉じる</button>
    <h2>マスタ編集</h2>
    <h3>契約容量候補</h3>
    <textarea id="contractMasterText" rows="4"></textarea>
    <h3>MCCB候補</h3>
    <textarea id="mccbMasterText" rows="4"></textarea>
    <h3>ケーブル許容電流</h3>
    <textarea id="cableMasterText" rows="8"></textarea>
    <h3>分電盤候補回路数</h3>
    <textarea id="panelMasterText" rows="4"></textarea>
    <div class="actions">
      <button class="primary" onclick="Master.apply()">反映</button>
      <button class="warn" onclick="Master.reset()">標準へ戻す</button>
    </div>
  </div>
</div>

<script src="js/master.js"></script>
<script src="js/calculation.js"></script>
<script src="js/storage.js"></script>
<script src="js/app.js"></script>
</body>
</html>
