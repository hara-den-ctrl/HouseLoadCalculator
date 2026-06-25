
const Master = {
  contracts: [
    {label:'30A', amp:30, kva:3},
    {label:'40A', amp:40, kva:4},
    {label:'50A', amp:50, kva:5},
    {label:'60A', amp:60, kva:6},
    {label:'75A', amp:75, kva:7.5},
    {label:'100A', amp:100, kva:10},
    {label:'10kVA', amp:100, kva:10},
    {label:'12kVA', amp:120, kva:12},
    {label:'15kVA', amp:150, kva:15}
  ],
  mccb: [30,40,50,60,75,100,125,150,175,200],
  cables: {8:42,14:61,22:72,38:100,60:155,100:221},
  panels: [8,12,16,20,24,30,36],
  open(){
    document.getElementById('contractMasterText').value = this.contracts.map(x=>`${x.label},${x.amp},${x.kva}`).join('\n');
    document.getElementById('mccbMasterText').value = this.mccb.join(',');
    document.getElementById('cableMasterText').value = Object.entries(this.cables).map(([s,a])=>`${s},${a}`).join('\n');
    document.getElementById('panelMasterText').value = this.panels.join(',');
    document.getElementById('masterModal').style.display='flex';
  },
  close(){ document.getElementById('masterModal').style.display='none'; },
  apply(){
    const contracts = document.getElementById('contractMasterText').value.split(/\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
      const [label,amp,kva]=line.split(',').map(x=>x.trim());
      return {label, amp:Number(amp), kva:Number(kva)};
    }).filter(x=>x.label && x.amp>0);
    if(contracts.length) this.contracts = contracts;
    const m = document.getElementById('mccbMasterText').value.split(/,|\n/).map(x=>Number(x.trim())).filter(x=>x>0).sort((a,b)=>a-b);
    if(m.length) this.mccb = m;
    const c = {};
    document.getElementById('cableMasterText').value.split(/\n/).forEach(line=>{
      const [s,a]=line.split(',').map(x=>x?.trim());
      if(Number(s)>0 && Number(a)>0) c[Number(s)] = Number(a);
    });
    if(Object.keys(c).length) this.cables = c;
    const p = document.getElementById('panelMasterText').value.split(/,|\n/).map(x=>Number(x.trim())).filter(x=>x>0).sort((a,b)=>a-b);
    if(p.length) this.panels = p;
    this.close();
    App.calculate();
    App.toast('マスタを反映しました');
  },
  reset(){
    this.contracts = [
      {label:'30A', amp:30, kva:3},{label:'40A', amp:40, kva:4},{label:'50A', amp:50, kva:5},{label:'60A', amp:60, kva:6},
      {label:'75A', amp:75, kva:7.5},{label:'100A', amp:100, kva:10},{label:'10kVA', amp:100, kva:10},{label:'12kVA', amp:120, kva:12},{label:'15kVA', amp:150, kva:15}
    ];
    this.mccb = [30,40,50,60,75,100,125,150,175,200];
    this.cables = {8:42,14:61,22:72,38:100,60:155,100:221};
    this.panels = [8,12,16,20,24,30,36];
    this.open();
    App.calculate();
  }
};
