let step = 0, accInit = 5, mem10Val = 42, logTime = 0;
const colHex = {cyan:'#00e5ff', amber:'#ffc200', coral:'#ff4d6d', green:'#00ffaa'};

function getSteps() {
    const a = accInit, m = mem10Val;
    return [
        null,
        { 
            stage: 'STAGE 1 OF 4', color: 'cyan', name: 'Fetch',
            desc: `PC=0 address sent to MAR. Instruction read into MDR/IR. PC increments to 1.`,
            activeComps: {'comp-pc':'cyan','comp-mar':'cyan','comp-mdr':'cyan','comp-ir':'cyan','comp-mem':'cyan'},
            buses: ['bus-pc-mar','bus-mar-mem','bus-mem-mdr','bus-mdr-ir'], col: 'cyan',
            mems: ['mem-cell-0'], regsH: {'ri-pc':'cyan','ri-mar':'cyan','ri-mdr':'cyan','ri-ir':'cyan'},
            svgV: () => ({'pc-val':'1','mar-val':'0x00','mdr-val':'ADD M[10]','ir-val':'ADD M[10]','ir-sub':'OP=ADD ADDR=10','cu-val':'IDLE','acc-val':String(a),'alu-op':'—','alu-result':''}),
            regV: () => ({pc:'1',mar:'0x00',mdr:'ADD M[10]',ir:'ADD M[10]',acc:String(a)}),
            log: 'PC→MAR=0 | MEM[0]→MDR | MDR→IR | PC=1' 
        },
        { 
            stage: 'STAGE 2 OF 4', color: 'amber', name: 'Decode',
            desc: `Control Unit decodes OP=ADD with operand at 0x0A. ACC is implicit operand.`,
            activeComps: {'comp-ir':'amber','comp-cu':'amber'},
            buses: ['bus-ir-cu'], col: 'amber', mems: [], regsH: {'ri-ir':'amber'},
            svgV: () => ({'pc-val':'1','mar-val':'0x00','mdr-val':'ADD M[10]','ir-val':'ADD M[10]','ir-sub':'OP=ADD ADDR=10','cu-val':'DECODING','acc-val':String(a),'alu-op':'—','alu-result':''}),
            regV: () => ({pc:'1',mar:'0x00',mdr:'ADD M[10]',ir:'ADD M[10]',acc:String(a)}),
            log: `CU decoded: OP=ADD | operand=MEM[10] | implicit src=ACC` 
        },
        { 
            stage: 'STAGE 3 OF 4', color: 'coral', name: 'Execute',
            desc: `Memory[10] fetched to MDR. ALU adds MDR value to ACC value.`,
            activeComps: {'comp-mar':'coral','comp-mdr':'coral','comp-acc':'coral','comp-alu':'coral','comp-mem':'coral'},
            buses: ['bus-ir-mar','bus-mar-mem','bus-mem-mdr','bus-mdr-alu','bus-acc-alu'], col: 'coral',
            mems: ['mem-cell-10'], regsH: {'ri-mar':'coral','ri-mdr':'coral','ri-acc':'coral'},
            svgV: () => ({'pc-val':'1','mar-val':'0x0A','mdr-val':String(m),'ir-val':'ADD M[10]','ir-sub':'OP=ADD ADDR=10','cu-val':'EXECUTE','acc-val':String(a),'alu-op':`${a}+${m}`,'alu-result':`=${a+m}`}),
            regV: () => ({pc:'1',mar:'0x0A',mdr:String(m),ir:'ADD M[10]',acc:String(a)}),
            log: `MAR=0x0A | MEM[10]→MDR=${m} | ALU: ${a}+${m}=${a+m}` 
        },
        { 
            stage: 'STAGE 4 OF 4', color: 'green', name: 'Write Back',
            desc: `ALU result ${a+m} written back to Accumulator. Cycle complete.`,
            activeComps: {'comp-alu':'green','comp-acc':'green'},
            buses: ['bus-alu-acc'], col: 'green', mems: [], regsH: {'ri-acc':'green'},
            svgV: () => ({'pc-val':'1','mar-val':'0x0A','mdr-val':String(m),'ir-val':'ADD M[10]','ir-sub':'OP=ADD ADDR=10','cu-val':'DONE','acc-val':String(a+m),'alu-op':`${a}+${m}`,'alu-result':`=${a+m}`}),
            regV: () => ({pc:'1',mar:'0x0A',mdr:String(m),ir:'ADD M[10]',acc:String(a+m)}),
            log: `ALU→ACC: ${a+m} | Cycle complete.` 
        }
    ];
}

function clearAll() {
    ['comp-pc','comp-mar','comp-mdr','comp-ir','comp-cu','comp-acc','comp-alu','comp-mem'].forEach(id => {
        document.getElementById(id)?.classList.remove('act-cyan','act-amber','act-coral','act-green');
    });
    ['bus-pc-mar','bus-mar-mem','bus-mem-mdr','bus-mdr-ir','bus-ir-cu','bus-ir-mar','bus-mdr-alu','bus-acc-alu','bus-alu-acc'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.setAttribute('class', 'bus'); el.setAttribute('marker-end', 'url(#ah-dim)'); }
    });
    ['mem-cell-0','mem-cell-1','mem-cell-10'].forEach(id => document.getElementById(id)?.classList.remove('mcell-active'));
    ['ri-pc','ri-mar','ri-mdr','ri-ir','ri-acc'].forEach(id => document.getElementById(id)?.classList.remove('r-cyan','r-amber','r-coral','r-green'));
    const ring = document.getElementById('acc-ring');
    if(ring) { ring.setAttribute('stroke-width','0'); ring.setAttribute('opacity','0'); }
}

function applyStep(s) {
    if(!s) return;
    Object.entries(s.activeComps).forEach(([id,c]) => document.getElementById(id)?.classList.add(`act-${c}`));
    s.buses.forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.setAttribute('class', `bus bus-act-${s.col}`); el.setAttribute('marker-end', `url(#ah-${s.col})`); }
    });
    s.mems.forEach(id => document.getElementById(id)?.classList.add('mcell-active'));
    Object.entries(s.regsH).forEach(([id,c]) => document.getElementById(id)?.classList.add(`r-${c}`));
    Object.entries(s.svgV()).forEach(([id,v]) => { const el=document.getElementById(id); if(el) el.textContent=v; });
    const r = s.regV();
    document.getElementById('ri-pc-v').textContent = r.pc;
    document.getElementById('ri-mar-v').textContent = r.mar;
    document.getElementById('ri-mdr-v').textContent = r.mdr;
    document.getElementById('ri-ir-v').textContent = r.ir;
    document.getElementById('ri-acc-v').textContent = r.acc;
    if(s.color === 'green') { document.getElementById('acc-ring')?.setAttribute('stroke-width','2.5'); document.getElementById('acc-ring')?.setAttribute('opacity','0.8'); }
    document.getElementById('sdot').className = `stage-dot s-${s.color}`;
    document.getElementById('snum').textContent = s.stage;
    document.getElementById('sname').textContent = s.name;
    document.getElementById('sname').style.color = colHex[s.color];
    document.getElementById('sdesc').innerHTML = s.desc;
    for(let i=0; i<4; i++) {
        const dot = document.getElementById('pd'+i), conn = document.getElementById('pc'+i);
        if(i < step-1) { dot.className = 'prog-dot done'; if(conn) conn.className = 'prog-conn done'; }
        else if(i === step-1) dot.className = 'prog-dot current';
    }
    addLog(s.log);
    if(step >= 4) {
        document.getElementById('next-btn').disabled = true;
        document.getElementById('next-btn').textContent = '✓ COMPLETE';
        for(let i=0; i<4; i++) {
            document.getElementById('pd'+i).className = 'prog-dot done';
            if(document.getElementById('pc'+i)) document.getElementById('pc'+i).className = 'prog-conn done';
        }
    }
}

function addLog(msg) {
    logTime += Math.floor(Math.random()*80+40);
    const p = document.getElementById('log-panel');
    const row = document.createElement('div'); row.className = 'log-row';
    row.innerHTML = `<span class="log-t">T+${String(logTime).padStart(4,'0')}</span><span>${msg}</span>`;
    p.appendChild(row); p.scrollTop = p.scrollHeight;
}

function nextStep() {
    if(step >= 4) return;
    step++; 
    accInit = parseInt(document.getElementById('acc-init').value) || 5;
    mem10Val = parseInt(document.getElementById('mem10-init').value) || 42;
    clearAll(); 
    applyStep(getSteps()[step]);
}

function resetSim() {
    step = 0; logTime = 0;
    accInit = parseInt(document.getElementById('acc-init').value) || 5;
    mem10Val = parseInt(document.getElementById('mem10-init').value) || 42;
    clearAll();
    document.getElementById('acc-val').textContent = String(accInit);
    document.getElementById('mem10-text').textContent = String(mem10Val);
    document.getElementById('ri-acc-v').textContent = String(accInit);
    document.getElementById('next-btn').disabled = false;
    document.getElementById('next-btn').textContent = 'NEXT STEP ›';
    document.getElementById('log-panel').innerHTML = `<div class="log-row"><span class="log-t">T+0000</span><span>Reset complete.</span></div>`;
}

document.getElementById('acc-init').addEventListener('input', function() {
    if(step === 0) { let v = parseInt(this.value)||0; document.getElementById('acc-val').textContent = v; document.getElementById('ri-acc-v').textContent = v; }
});
document.getElementById('mem10-init').addEventListener('input', function() {
    if(step === 0) document.getElementById('mem10-text').textContent = parseInt(this.value)||0;
});