
const App = {
  init(){
    this.renderLoads();
    document.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{this.calculate();Storage.saveDraft();}));
    Storage.load(false);
    this.registerSW();
    this.calculate();
  },
  toast(t){
    const el=document.getElementById('toast');
    el.textContent=t; el.style.display='block';
    setTimeout(()=>el.style.display='none',1800);
  },
  renderLoads(){
    const tbody=document.querySelector('#loadTable tbody');
    tbody.innerHTML = Calc.loads.map((x,i)=>`
      <tr class="${x.use?'':'inactive'}">
        <td><input type="checkbox" ${x.use?'checked':''} onchange="Calc.loads[${i}].use=this.checked;App.renderLoads();App.calculate();Storage.saveDraft()"></td>
        <td><input value="${x.name}" onchange="Calc.loads[${i}].name=this.value;App.calculate();Storage.saveDraft()"></td>
        <td><input type="number" value="${x.count}" onchange="Calc.loads[${i}].count=Number(this.value)||0;App.calculate();Storage.saveDraft()"></td>
        <td><input type="number" value="${x.va}" onchange="Calc.loads[${i}].va=Number(this.value)||0;App.calculate();Storage.saveDraft()"></td>
        <td>${x.use ? (x.count*x.va).toLocaleString() : '-'}</td>
      </tr>`).join('');
    document.getElementById('loadCards').innerHTML = Calc.loads.map((x,i)=>`
      <div class="mCard ${x.use?'':'inactive'}">
        <div class="mHead"><input type="checkbox" ${x.use?'checked':''} onchange="Calc.loads[${i}].use=this.checked;App.renderLoads();App.calculate();Storage.saveDraft()"> ${x.name}</div>
        <div class="mGrid">
          <div><label>機器名</label><input value="${x.name}" onchange="Calc.loads[${i}].name=this.value;App.calculate();Storage.saveDraft()"></div>
          <div><label>台数</label><input type="number" value="${x.count}" onchange="Calc.loads[${i}].count=Number(this.value)||0;App.calculate();Storage.saveDraft()"></div>
          <div><label>1台容量VA</label><input type="number" value="${x.va}" onchange="Calc.loads[${i}].va=Number(this.value)||0;App.calculate();Storage.saveDraft()"></div>
          <div><label>合計VA</label><input readonly value="${x.use ? (x.count*x.va).toLocaleString() : '-'}"></div>
        </div>
      </div>`).join('');
  },
  calculate(){
    const general=Calc.generalLoad(), dedicated=Calc.dedicatedLoad(), total=general+dedicated, demand=Calc.demandLoad(), amp=Calc.current();
    const contract=Calc.selectContract(), breaker=Calc.selectMccb(), cable=Calc.selectCable(), ci=Calc.circuitInfo();
    generalLoad.textContent=general.toLocaleString()+' VA';
    dedicatedLoad.textContent=dedicated.toLocaleString()+' VA';
    totalLoad.textContent=total.toLocaleString()+' VA';
    demandLoad.textContent=Math.round(demand).toLocaleString()+' VA';
    requiredAmp.textContent=amp.toFixed(1)+' A';
    contractRecommend.textContent=contract.label;
    mainBreaker.textContent=breaker+' A';
    mainCable.textContent=`CV ${cable.size}sq（${cable.drop.toFixed(2)}%）`;

    panelTable.innerHTML = `
      <tr><th>一般回路数</th><th>専用回路数</th><th>予備回路</th><th>合計回路</th><th>参考分電盤</th><th>備考</th></tr>
      <tr><td>${ci.generalCircuits}</td><td>${ci.dedicatedCircuits}</td><td>${ci.spare}</td><td>${ci.total}</td><td>${ci.panel}回路以上</td><td class="left">参考値。実際は部屋数・設備・平面図により決定</td></tr>`;
    applyTable.innerHTML = `
      <tr><th>項目</th><th>値</th></tr>
      <tr><td>総負荷</td><td>${total.toLocaleString()} VA</td></tr>
      <tr><td>需要率後容量</td><td>${Math.round(demand).toLocaleString()} VA</td></tr>
      <tr><td>必要電流</td><td>${amp.toFixed(1)} A</td></tr>
      <tr><td>推奨契約</td><td>${contract.label}</td></tr>
      <tr><td>推奨主幹</td><td>${breaker} A</td></tr>
      <tr><td>推奨幹線</td><td>CV ${cable.size}sq / 許容 ${cable.amp}A / 電圧降下 ${cable.drop.toFixed(2)}%</td></tr>`;
    this.diagram();
    this.printRender();
  },
  diagram(){
    const activeLoads=Calc.loads.filter(x=>x.use && x.count>0).slice(0,8);
    let x=150;
    let boxes = activeLoads.map((l,i)=>{
      const bx=40+i*130;
      return `<g><rect x="${bx}" y="190" width="110" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="${bx+55}" y="215" text-anchor="middle" class="t">${l.name}</text><text x="${bx+55}" y="238" text-anchor="middle" class="s">${(l.count*l.va).toLocaleString()}VA</text></g>`;
    }).join('');
    const svg=`<svg viewBox="0 0 1100 300" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><style>.t{font:13px sans-serif;font-weight:700}.s{font:11px sans-serif}.line{stroke:#111;stroke-width:2}</style></defs>
      <rect x="30" y="35" width="100" height="55" rx="8" fill="#fff" stroke="#111"/><text x="80" y="67" text-anchor="middle" class="t">受電点</text>
      <line x1="130" y1="62" x2="220" y2="62" class="line"/>
      <rect x="220" y="35" width="120" height="55" rx="8" fill="#fff" stroke="#111"/><text x="280" y="67" text-anchor="middle" class="t">分電盤</text>
      <line x1="280" y1="90" x2="280" y2="160" class="line"/><line x1="80" y1="160" x2="1030" y2="160" class="line"/>
      <g><rect x="40" y="190" width="110" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="95" y="215" text-anchor="middle" class="t">照明</text><text x="95" y="238" text-anchor="middle" class="s">${(Calc.n('lightCount')*Calc.n('lightVa')).toLocaleString()}VA</text></g>
      <g><rect x="170" y="190" width="110" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="225" y="215" text-anchor="middle" class="t">コンセント</text><text x="225" y="238" text-anchor="middle" class="s">${(Calc.n('outletCount')*Calc.n('outletVa')).toLocaleString()}VA</text></g>
      ${activeLoads.map((l,i)=>{const bx=300+i*95;return `<g><rect x="${bx}" y="190" width="85" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="${bx+42}" y="215" text-anchor="middle" class="s">${l.name}</text><text x="${bx+42}" y="238" text-anchor="middle" class="s">${(l.count*l.va).toLocaleString()}VA</text></g>`}).join('')}
    </svg>`;
    diagram.innerHTML=svg; printDiagram.innerHTML=svg;
  },
  printRender(){
    pSite.textContent=siteName.value; pBuilding.textContent=buildingName.value; pDate.textContent=new Date().toLocaleDateString('ja-JP'); pAuthor.textContent=author.value;
    printSummary.innerHTML=`<tr><th>一般負荷</th><th>専用負荷</th><th>総負荷</th><th>需要率後</th><th>必要電流</th><th>推奨契約</th><th>主幹</th><th>幹線</th></tr><tr><td>${generalLoad.textContent}</td><td>${dedicatedLoad.textContent}</td><td>${totalLoad.textContent}</td><td>${demandLoad.textContent}</td><td>${requiredAmp.textContent}</td><td>${contractRecommend.textContent}</td><td>${mainBreaker.textContent}</td><td>${mainCable.textContent}</td></tr>`;
    printLoads.innerHTML='<tr><th>機器</th><th>台数</th><th>1台容量</th><th>合計</th></tr>'+Calc.loads.filter(x=>x.use).map(x=>`<tr><td>${x.name}</td><td>${x.count}</td><td>${x.va}</td><td>${(x.count*x.va).toLocaleString()} VA</td></tr>`).join('');
    printApply.innerHTML=applyTable.innerHTML;
  },
  registerSW(){
    if(!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('service-worker.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing;
        if(!nw) return;
        nw.addEventListener('statechange',()=>{
          if(nw.state==='installed' && navigator.serviceWorker.controller){
            if(confirm('新しいバージョンがあります。更新しますか？')) location.reload();
          }
        });
      });
    }).catch(()=>{});
  }
};
document.addEventListener('DOMContentLoaded',()=>App.init());
