
const App = {
  loads: [
    {use:true, name:'エアコン', count:3, va:1000},
    {use:true, name:'IHクッキングヒーター', count:1, va:3000},
    {use:true, name:'エコキュート', count:1, va:1500},
    {use:true, name:'電子レンジ', count:1, va:1500},
    {use:false, name:'食洗機', count:0, va:1200},
    {use:false, name:'浴室乾燥機', count:0, va:1200},
    {use:false, name:'EV充電器', count:0, va:6000},
    {use:false, name:'蓄電池', count:0, va:5000},
    {use:false, name:'太陽光PCS', count:0, va:5000},
    {use:false, name:'その他', count:0, va:1000}
  ],
  contracts: [
    {label:'30A', amp:30, kva:3},{label:'40A', amp:40, kva:4},{label:'50A', amp:50, kva:5},
    {label:'60A', amp:60, kva:6},{label:'75A', amp:75, kva:7.5},{label:'100A', amp:100, kva:10},
    {label:'10kVA', amp:100, kva:10},{label:'12kVA', amp:120, kva:12},{label:'15kVA', amp:150, kva:15}
  ],
  mccb: [30,40,50,60,75,100,125,150,175,200],
  cables: {8:42,14:61,22:72,38:100,60:155,100:221},
  panels: [8,12,16,20,24,30,36],

  init(){
    this.renderLoads();
    document.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{this.calculate();this.saveDraft();}));
    this.load(false);
    this.registerSW();
    this.calculate();
  },
  n(id){ return Number(document.getElementById(id).value) || 0; },
  fmt(v,d=1){ return (Number.isFinite(v)?v:0).toFixed(d); },
  toast(t){ const el=document.getElementById('toast'); el.textContent=t; el.style.display='block'; setTimeout(()=>el.style.display='none',1800); },

  renderLoads(){
    const tbody=document.querySelector('#loadTable tbody');
    tbody.innerHTML=this.loads.map((x,i)=>`
      <tr class="${x.use?'':'inactive'}">
        <td><input type="checkbox" ${x.use?'checked':''} onchange="App.loads[${i}].use=this.checked;App.renderLoads();App.calculate();App.saveDraft()"></td>
        <td><input value="${x.name}" onchange="App.loads[${i}].name=this.value;App.calculate();App.saveDraft()"></td>
        <td><input type="number" value="${x.count}" onchange="App.loads[${i}].count=Number(this.value)||0;App.calculate();App.saveDraft()"></td>
        <td><input type="number" value="${x.va}" onchange="App.loads[${i}].va=Number(this.value)||0;App.calculate();App.saveDraft()"></td>
        <td>${x.use ? (x.count*x.va).toLocaleString() : '-'}</td>
      </tr>`).join('');
    document.getElementById('loadCards').innerHTML=this.loads.map((x,i)=>`
      <div class="mCard ${x.use?'':'inactive'}">
        <div class="mHead"><input type="checkbox" ${x.use?'checked':''} onchange="App.loads[${i}].use=this.checked;App.renderLoads();App.calculate();App.saveDraft()"> ${x.name}</div>
        <div class="mGrid">
          <div><label>機器名</label><input value="${x.name}" onchange="App.loads[${i}].name=this.value;App.calculate();App.saveDraft()"></div>
          <div><label>台数</label><input type="number" value="${x.count}" onchange="App.loads[${i}].count=Number(this.value)||0;App.calculate();App.saveDraft()"></div>
          <div><label>1台容量VA</label><input type="number" value="${x.va}" onchange="App.loads[${i}].va=Number(this.value)||0;App.calculate();App.saveDraft()"></div>
          <div><label>合計VA</label><input readonly value="${x.use ? (x.count*x.va).toLocaleString() : '-'}"></div>
        </div>
      </div>`).join('');
  },

  generalLoad(){ return this.n('lightCount')*this.n('lightVa') + this.n('outletCount')*this.n('outletVa'); },
  dedicatedLoad(){ return this.loads.filter(x=>x.use).reduce((a,x)=>a+x.count*x.va,0); },
  demandLoad(){ return (this.generalLoad()+this.dedicatedLoad())*this.n('demandRate')/100; },
  current(){ return this.demandLoad() / (this.n('voltage') || 100); },
  selectContract(){ const a=this.current(); return this.contracts.find(x=>x.amp>=a) || this.contracts[this.contracts.length-1]; },
  selectMccb(){ const a=this.current(); return this.mccb.find(x=>x>=a) || this.mccb[this.mccb.length-1]; },
  dropPct(amp,len,size){ const v=this.n('voltage')||100; const e=17.8*(len||1)*amp/(1000*size); return e/v*100; },
  selectCable(){
    const amp=this.current(), len=this.n('length'), allow=this.n('allowDrop');
    const sizes=Object.keys(this.cables).map(Number).sort((a,b)=>a-b);
    for(const s of sizes){
      const d=this.dropPct(amp,len,s);
      if(this.cables[s]>=amp && d<=allow) return {size:s, amp:this.cables[s], drop:d, ok:true};
    }
    const s=sizes[sizes.length-1];
    return {size:s, amp:this.cables[s], drop:this.dropPct(amp,len,s), ok:false};
  },
  circuitInfo(){
    const gen=this.generalLoad(), limit=Math.max(1,this.n('generalCircuitLimit'));
    const generalCircuits=Math.ceil(gen/limit);
    const dedicatedCircuits=this.loads.filter(x=>x.use&&x.count>0).reduce((a,x)=>a+x.count,0);
    const spare=this.n('spareCircuits');
    const total=generalCircuits+dedicatedCircuits+spare;
    const panel=this.panels.find(x=>x>=total) || this.panels[this.panels.length-1];
    return {generalCircuits,dedicatedCircuits,spare,total,panel};
  },

  calculate(){
    const general=this.generalLoad(), dedicated=this.dedicatedLoad(), total=general+dedicated, demand=this.demandLoad(), amp=this.current();
    const contract=this.selectContract(), breaker=this.selectMccb(), cable=this.selectCable(), ci=this.circuitInfo();
    generalLoad.textContent=general.toLocaleString()+' VA';
    dedicatedLoad.textContent=dedicated.toLocaleString()+' VA';
    totalLoad.textContent=total.toLocaleString()+' VA';
    demandLoad.textContent=Math.round(demand).toLocaleString()+' VA';
    requiredAmp.textContent=this.fmt(amp,1)+' A';
    contractRecommend.textContent=contract.label;
    mainBreaker.textContent=breaker+' A';
    mainCable.textContent=`CV ${cable.size}sq（${this.fmt(cable.drop,2)}%）`;

    panelTable.innerHTML=`<tr><th>一般回路数</th><th>専用回路数</th><th>予備回路</th><th>合計回路</th><th>参考分電盤</th><th>備考</th></tr>
      <tr><td>${ci.generalCircuits}</td><td>${ci.dedicatedCircuits}</td><td>${ci.spare}</td><td>${ci.total}</td><td>${ci.panel}回路以上</td><td class="left">参考値。実際は部屋数・設備・平面図により決定</td></tr>`;
    applyTable.innerHTML=`<tr><th>項目</th><th>値</th></tr>
      <tr><td>総負荷</td><td>${total.toLocaleString()} VA</td></tr>
      <tr><td>需要率後容量</td><td>${Math.round(demand).toLocaleString()} VA</td></tr>
      <tr><td>必要電流</td><td>${this.fmt(amp,1)} A</td></tr>
      <tr><td>推奨契約</td><td>${contract.label}</td></tr>
      <tr><td>推奨主幹</td><td>${breaker} A</td></tr>
      <tr><td>推奨幹線</td><td>CV ${cable.size}sq / 許容 ${cable.amp}A / 電圧降下 ${this.fmt(cable.drop,2)}%</td></tr>`;
    this.diagram();
    this.printRender();
  },

  diagram(){
    const active=this.loads.filter(x=>x.use&&x.count>0).slice(0,8);
    const boxes=active.map((l,i)=>{const bx=300+i*95;return `<g><rect x="${bx}" y="190" width="85" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="${bx+42}" y="215" text-anchor="middle" class="s">${l.name}</text><text x="${bx+42}" y="238" text-anchor="middle" class="s">${(l.count*l.va).toLocaleString()}VA</text></g>`}).join('');
    const svg=`<svg viewBox="0 0 1100 300" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><style>.t{font:13px sans-serif;font-weight:700}.s{font:11px sans-serif}.line{stroke:#111;stroke-width:2}</style></defs>
      <rect x="30" y="35" width="100" height="55" rx="8" fill="#fff" stroke="#111"/><text x="80" y="67" text-anchor="middle" class="t">受電点</text>
      <line x1="130" y1="62" x2="220" y2="62" class="line"/>
      <rect x="220" y="35" width="120" height="55" rx="8" fill="#fff" stroke="#111"/><text x="280" y="67" text-anchor="middle" class="t">分電盤</text>
      <line x1="280" y1="90" x2="280" y2="160" class="line"/><line x1="80" y1="160" x2="1030" y2="160" class="line"/>
      <g><rect x="40" y="190" width="110" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="95" y="215" text-anchor="middle" class="t">照明</text><text x="95" y="238" text-anchor="middle" class="s">${(this.n('lightCount')*this.n('lightVa')).toLocaleString()}VA</text></g>
      <g><rect x="170" y="190" width="110" height="70" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="225" y="215" text-anchor="middle" class="t">コンセント</text><text x="225" y="238" text-anchor="middle" class="s">${(this.n('outletCount')*this.n('outletVa')).toLocaleString()}VA</text></g>
      ${boxes}</svg>`;
    diagram.innerHTML=svg;
    printDiagram.innerHTML=svg;
  },

  printRender(){
    pSite.textContent=siteName.value; pBuilding.textContent=buildingName.value; pDate.textContent=new Date().toLocaleDateString('ja-JP'); pAuthor.textContent=author.value;
    printSummary.innerHTML=`<tr><th>一般負荷</th><th>専用負荷</th><th>総負荷</th><th>需要率後</th><th>必要電流</th><th>推奨契約</th><th>主幹</th><th>幹線</th></tr><tr><td>${generalLoad.textContent}</td><td>${dedicatedLoad.textContent}</td><td>${totalLoad.textContent}</td><td>${demandLoad.textContent}</td><td>${requiredAmp.textContent}</td><td>${contractRecommend.textContent}</td><td>${mainBreaker.textContent}</td><td>${mainCable.textContent}</td></tr>`;
    printLoads.innerHTML='<tr><th>機器</th><th>台数</th><th>1台容量</th><th>合計</th></tr>'+this.loads.filter(x=>x.use).map(x=>`<tr><td>${x.name}</td><td>${x.count}</td><td>${x.va}</td><td>${(x.count*x.va).toLocaleString()} VA</td></tr>`).join('');
    printApply.innerHTML=applyTable.innerHTML;
  },

  state(){
    const common={};
    ['siteName','buildingName','author','company','system','voltage','demandRate','length','allowDrop','spareCircuits','lightCount','lightVa','outletCount','outletVa','generalCircuitLimit'].forEach(id=>common[id]=document.getElementById(id).value);
    return {common,loads:this.loads,contracts:this.contracts,mccb:this.mccb,cables:this.cables,panels:this.panels};
  },
  setState(s){
    if(s.common) Object.entries(s.common).forEach(([k,v])=>{ if(document.getElementById(k)) document.getElementById(k).value=v; });
    if(s.loads) this.loads=s.loads;
    if(s.contracts) this.contracts=s.contracts;
    if(s.mccb) this.mccb=s.mccb;
    if(s.cables) this.cables=s.cables;
    if(s.panels) this.panels=s.panels;
    this.renderLoads(); this.calculate();
  },
  save(){ localStorage.setItem('houseLoadCalculatorV12',JSON.stringify(this.state())); this.toast('保存しました'); },
  saveDraft(){ localStorage.setItem('houseLoadCalculatorDraftV12',JSON.stringify(this.state())); },
  load(show=true){ const s=localStorage.getItem('houseLoadCalculatorV12')||localStorage.getItem('houseLoadCalculatorDraftV12'); if(!s)return; try{this.setState(JSON.parse(s)); if(show)this.toast('読み込みました');}catch(e){this.toast('読み込み失敗');} },
  exportJson(){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(this.state(),null,2)],{type:'application/json'})); a.download='HouseLoadCalculator_Project.json'; a.click(); },
  importJson(){ const input=document.createElement('input'); input.type='file'; input.accept='.json'; input.onchange=()=>{const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{this.setState(JSON.parse(r.result));this.toast('JSON読込完了');}catch(e){this.toast('JSON読込失敗');}}; r.readAsText(f)}; input.click(); },
  resetSample(){ localStorage.removeItem('houseLoadCalculatorV12'); localStorage.removeItem('houseLoadCalculatorDraftV12'); location.reload(); },

  openMaster(){
    contractMasterText.value=this.contracts.map(x=>`${x.label},${x.amp},${x.kva}`).join('\n');
    mccbMasterText.value=this.mccb.join(',');
    cableMasterText.value=Object.entries(this.cables).map(([s,a])=>`${s},${a}`).join('\n');
    panelMasterText.value=this.panels.join(',');
    masterModal.style.display='flex';
  },
  closeMaster(){ masterModal.style.display='none'; },
  applyMaster(){
    const cs=contractMasterText.value.split(/\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const [label,amp,kva]=line.split(',').map(x=>x.trim());return{label,amp:Number(amp),kva:Number(kva)}}).filter(x=>x.label&&x.amp>0);
    if(cs.length)this.contracts=cs;
    const ms=mccbMasterText.value.split(/,|\n/).map(x=>Number(x.trim())).filter(x=>x>0).sort((a,b)=>a-b); if(ms.length)this.mccb=ms;
    const cb={}; cableMasterText.value.split(/\n/).forEach(line=>{const [s,a]=line.split(',').map(x=>x?.trim()); if(Number(s)>0&&Number(a)>0)cb[Number(s)]=Number(a)}); if(Object.keys(cb).length)this.cables=cb;
    const ps=panelMasterText.value.split(/,|\n/).map(x=>Number(x.trim())).filter(x=>x>0).sort((a,b)=>a-b); if(ps.length)this.panels=ps;
    this.closeMaster(); this.calculate(); this.toast('マスタを反映しました');
  },
  resetMaster(){ this.contracts=[{label:'30A',amp:30,kva:3},{label:'40A',amp:40,kva:4},{label:'50A',amp:50,kva:5},{label:'60A',amp:60,kva:6},{label:'75A',amp:75,kva:7.5},{label:'100A',amp:100,kva:10},{label:'10kVA',amp:100,kva:10},{label:'12kVA',amp:120,kva:12},{label:'15kVA',amp:150,kva:15}]; this.mccb=[30,40,50,60,75,100,125,150,175,200]; this.cables={8:42,14:61,22:72,38:100,60:155,100:221}; this.panels=[8,12,16,20,24,30,36]; this.openMaster(); this.calculate(); },
  registerSW(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.register('service-worker.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{const nw=reg.installing; if(!nw)return; nw.addEventListener('statechange',()=>{ if(nw.state==='installed'&&navigator.serviceWorker.controller){ if(confirm('新しいバージョンがあります。更新しますか？')) location.reload(); } });});
    }).catch(()=>{});
  }
};
document.addEventListener('DOMContentLoaded',()=>App.init());
