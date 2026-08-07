const $ = (id) => document.getElementById(id);
const COLORS=['#17263a','#2563eb','#0891b2','#059669','#84cc16','#eab308','#f97316','#ef4444','#db2777','#9333ea','#4f46e5','#0f766e','#65a30d','#ca8a04','#c2410c','#be123c','#7e22ce','#1d4ed8','#047857','#a16207','#b91c1c','#6d28d9','#0369a1'];
const LINEAR_IDS=['cellW','cellH','maxDepth','baseWidth','baseHeight','stockLength'];
const WATCH_IDS=['unit','type','prime','repeatX','repeatY','cellW','cellH','maxDepth','baseThickness','baseWidth','baseHeight','stockLength','kerf','reserve','soundSpeed','autoFit'];
let showCm=false,deferredPrompt=null,currentPlanText='',currentData=null,lastUnit='cm',fitTimer=null;
const num=(id)=>Number($(id).value)||0;
const fmt=(n,d=2)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:0}).format(n);
const toCm=(value,unit)=>unit==='m'?value*100:value;
const fromCm=(cm,unit)=>unit==='m'?cm/100:cm;
const unitDigits=(unit)=>unit==='m'?3:2;
const displayMeasure=(cm,unit=currentUnit())=>`${fmt(fromCm(cm,unit),unitDigits(unit))} ${unit}`;
const currentUnit=()=> $('unit').value;

function quadratic1D(N){return Array.from({length:N},(_,i)=>(i*i)%N)}
function quadratic2D(N){return Array.from({length:N},(_,y)=>Array.from({length:N},(_,x)=>(x*x+y*y)%N))}
function repeatMatrix(base,cols,rows){const h=base.length,w=base[0].length;return Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>base[y%h][x%w]))}
function groupedCounts(matrix,N){const c=Array(N).fill(0);matrix.flat().forEach(v=>c[v]++);return c}
function levelDepth(level,N,maxDepthCm){return level===0?0:(level/(N-1))*maxDepthCm}
function ceilReserve(q,pct){return q===0?0:Math.ceil(q*(1+pct/100))}
function groupLengths(lengths){const map=new Map();for(const len of lengths){const key=len.toFixed(6);map.set(key,(map.get(key)||0)+1)}return [...map.entries()].map(([key,qty])=>({len:Number(key),qty})).sort((a,b)=>b.len-a.len)}
function binPack(lengths,stockCm,kerfCm){
  const sorted=[...lengths].sort((a,b)=>b-a),bars=[];
  for(const len of sorted){
    let placed=false;
    for(const bar of bars){const cost=len+kerfCm;if(bar.used+cost<=stockCm+1e-9){bar.pieces.push(len);bar.used+=cost;placed=true;break}}
    if(!placed)bars.push({pieces:[len],used:len+kerfCm});
  }
  return bars;
}
function changeUnit(next){
  if(next===lastUnit)return;
  LINEAR_IDS.forEach(id=>{const cm=toCm(num(id),lastUnit);$(id).value=fromCm(cm,next).toFixed(next==='m'?3:2).replace(/0+$/,'').replace(/\.$/,'')});
  lastUnit=next;
}
function calc(){
  const unit=currentUnit();changeUnit(unit);
  document.querySelectorAll('.unit-label').forEach(el=>el.textContent=`(${unit})`);
  const type=$('type').value,N=num('prime'),auto=$('autoFit').checked;
  const cw=toCm(num('cellW'),unit),ch=toCm(num('cellH'),unit),depth=toCm(num('maxDepth'),unit);
  const baseWidth=toCm(num('baseWidth'),unit),baseHeight=toCm(num('baseHeight'),unit),stock=toCm(num('stockLength'),unit);
  const baseMm=num('baseThickness'),kerfCm=num('kerf')/10,reserve=num('reserve'),sound=num('soundSpeed');

  /* Guard: evita divisão por zero e NaN em toda a cadeia de cálculo */
  const CRITICAL=['cellW','cellH','maxDepth','baseWidth','baseHeight','stockLength','soundSpeed'];
  const hasInvalid=CRITICAL.some(id=>!(num(id)>0));
  if(hasInvalid){
    $('technicalNote').innerHTML='<strong style="color:#ef4444">Atenção:</strong> preencha todos os campos obrigatórios com valores maiores que zero.';
    return;
  }
  $('repeatYLabel').style.display=type==='skyline'?'flex':'none';$('repeatX').disabled=auto;$('repeatY').disabled=auto;
  const pattern=type==='skyline'?quadratic2D(N):[quadratic1D(N)];
  let cols,rows,rx,ry;
  if(auto){
    cols=Math.max(1,Math.floor(baseWidth/cw));rows=type==='skyline'?Math.max(1,Math.floor(baseHeight/ch)):1;
    rx=cols/N;ry=rows/N;$('repeatX').value=String(Number(rx.toFixed(1)));$('repeatY').value=String(Number(ry.toFixed(1)));
  }else{
    rx=Math.max(1,Math.round(num('repeatX')));ry=type==='skyline'?Math.max(1,Math.round(num('repeatY'))):1;
    cols=N*rx;rows=type==='skyline'?N*ry:1;
  }
  const matrix=repeatMatrix(pattern,cols,rows),counts=groupedCounts(matrix,N);
  const gridWidth=cols*cw,gridHeight=type==='skyline'?rows*ch:ch,marginX=(baseWidth-gridWidth)/2,marginY=(baseHeight-gridHeight)/2;
  const allLengths=[],suggestedCounts=[];
  for(let level=0;level<N;level++){
    const qty=counts[level],suggested=level===0?0:ceilReserve(qty,reserve);suggestedCounts[level]=suggested;
    if(level>0)for(let i=0;i<suggested;i++)allLengths.push(levelDepth(level,N,depth));
  }
  const totalExact=counts.reduce((sum,q,l)=>sum+(l?q*levelDepth(l,N,depth):0),0),totalSuggested=allLengths.reduce((a,b)=>a+b,0);
  const bars=binPack(allLengths,stock,kerfCm);
  const volume=(cw/100)*(ch/100)*(totalSuggested/100)+(baseWidth/100)*(baseHeight/100)*(baseMm/1000),weight=volume*550;
  const fLow=((N-1)*sound)/(2*N*(depth/100)),fHigh=sound/(2*(cw/100));
  const useful=counts.reduce((a,b)=>a+b,0)-counts[0],suggestedTotal=suggestedCounts.reduce((a,b)=>a+b,0);
  currentData={unit,type,N,auto,cw,ch,depth,baseWidth,baseHeight,baseMm,stock,kerfCm,reserve,sound,cols,rows,rx,ry,matrix,counts,suggestedCounts,gridWidth,gridHeight,marginX,marginY,totalExact,totalSuggested,bars,weight,fLow,fHigh,useful,suggestedTotal};
  renderScreen(currentData);buildPrintDocument(currentData);queueFitPrintSheets();
}
function renderScreen(d){
  $('panelSize').textContent=`${displayMeasure(d.baseWidth)} × ${displayMeasure(d.baseHeight)}`;
  $('panelSizeNote').textContent=`Grade ${d.cols} × ${d.rows}, ocupando ${displayMeasure(d.gridWidth)} × ${displayMeasure(d.gridHeight)}. Bordas: ${displayMeasure(d.marginX)} e ${displayMeasure(d.marginY)}.`;
  $('pieceCount').textContent=`${d.useful} blocos`;$('pieceCountNote').textContent=`${d.counts[0]} posições vazias; cortar ${d.suggestedTotal} peças com margem.`;
  $('woodTotal').textContent=displayMeasure(d.totalSuggested);$('woodTotalNote').textContent=`Projeto exato: ${displayMeasure(d.totalExact)}; margem de ${d.reserve}%.`;
  $('stockCount').textContent=`${d.bars.length} ${d.bars.length===1?'barrote':'barrotes'}`;$('stockCountNote').textContent=`de ${displayMeasure(d.stock)} cada, considerando serra de ${fmt(d.kerfCm*10,1)} mm.`;
  $('freqRange').textContent=`${Math.round(d.fLow)}–${Math.round(d.fHigh)} Hz`;$('weight').textContent=`≈ ${fmt(d.weight,1)} kg`;
  $('technicalNote').innerHTML=d.auto?`<strong>Modo automático:</strong> a base comporta ${d.cols} colunas × ${d.rows} linhas com blocos de ${displayMeasure(d.cw)} × ${displayMeasure(d.ch)}. Todos os resultados foram recalculados para preencher essa área.`:`<strong>Modo manual:</strong> ${Math.round(d.rx)} repetição(ões) horizontal(is) e ${Math.round(d.ry)} vertical(is) produzem uma grade de ${d.cols} × ${d.rows}.`;
  const moduleW=d.N*d.cw,moduleH=d.N*d.ch;
  $('repeatHelp').innerHTML=`<p>As repetições são baseadas no <strong>módulo básico N${d.N}</strong>. Com blocos de ${displayMeasure(d.cw)} × ${displayMeasure(d.ch)}, uma repetição mede <strong>${displayMeasure(moduleW)}</strong> na horizontal e <strong>${displayMeasure(moduleH)}</strong> na vertical.</p><p>Exemplo: 2 repetições horizontais = ${displayMeasure(moduleW*2)} de largura. Escolha a quantidade que caiba na base. No modo automático, o app faz isso sozinho.</p>`;
  const profile=d.N<=5?'mais simples e compacto':d.N<=7?'equilíbrio entre variedade e facilidade':d.N<=13?'mais detalhado e trabalhoso':'muito detalhado e exigente';
  $('sequenceHelp').innerHTML=`<p><strong>N${d.N}</strong> cria um módulo de ${d.N} × ${d.N} posições e ${d.N-1} intervalos possíveis de profundidade. Neste projeto, a diferença entre níveis é aproximadamente ${displayMeasure(d.depth/(d.N-1))}.</p><p>Perfil: <strong>${profile}</strong>. N maior não é automaticamente melhor: aumenta o tamanho e a quantidade de medidas. Para um primeiro Skyline de barrote, N5 é o mais fácil; N7 oferece mais variedade; N11 ou maior exige mais precisão.</p>`;
  renderLegend(d);renderMap(d);renderCutList(d);renderMaterials(d);renderPlan(d);
}
function renderLegend(d){$('legend').innerHTML=Array.from({length:d.N},(_,l)=>`<div class="legend-item"><i class="swatch" style="background:${l?COLORS[l%COLORS.length]:'#17263a'}"></i><b>${l}</b> — ${l===0?(d.type==='skyline'?'vazio':displayMeasure(0)):displayMeasure(levelDepth(l,d.N,d.depth))}</div>`).join('')}
function renderMap(d){const size=d.cols>35?18:d.cols>24?22:d.cols>16?28:42;$('map').style.gridTemplateColumns=`repeat(${d.cols},${size}px)`;$('map').innerHTML=d.matrix.flat().map(l=>`<div class="cell ${l===0?'zero':''}" role="img" aria-label="Nível ${l}: ${l===0?(d.type==='skyline'?'vazio':displayMeasure(0)):displayMeasure(levelDepth(l,d.N,d.depth))}" style="background:${l?COLORS[l%COLORS.length]:'#17263a'};width:${size}px;height:${size}px" title="Nível ${l}: ${displayMeasure(levelDepth(l,d.N,d.depth))}">${showCm?fmt(fromCm(levelDepth(l,d.N,d.depth),d.unit),unitDigits(d.unit)):l}</div>`).join('')}
function renderCutList(d){$('cutList').innerHTML=d.counts.map((q,l)=>`<tr><td>${l}</td><td>${l===0?(d.type==='skyline'?'Vazio':displayMeasure(0)):displayMeasure(levelDepth(l,d.N,d.depth))}</td><td>${q}</td><td>${l===0?'—':d.suggestedCounts[l]}</td></tr>`).join('')}
function materialRows(d){return [['Base',`${displayMeasure(d.baseWidth)} × ${displayMeasure(d.baseHeight)}, ${fmt(d.baseMm,0)} mm`],['Grade calculada',`${d.cols} × ${d.rows} posições`],['Área ocupada pelos blocos',`${displayMeasure(d.gridWidth)} × ${displayMeasure(d.gridHeight)}`],['Madeira',`${displayMeasure(d.cw)} × ${displayMeasure(d.ch)} reais`],['Barrotes',`${d.bars.length} × ${displayMeasure(d.stock)}`],['Blocos a cortar',`${d.suggestedTotal} unidades`],['Cola','PVA para madeira, cobrindo toda a face'],['Fixação','Suporte dimensionado acima do peso calculado'],['Acabamento','Lixa + seladora/verniz ou tinta fina']]}
function renderMaterials(d){$('materials').innerHTML=materialRows(d).map(([a,b])=>`<li><span>${a}</span><strong>${b}</strong></li>`).join('')}
function barSummary(bar,d){return groupLengths(bar.pieces).map(x=>`${x.qty} × ${displayMeasure(x.len)}`).join(' · ')}
function renderPlan(d){
  currentPlanText=d.bars.map((b,i)=>`BARROTE ${i+1}\n${b.pieces.length} peças extraídas\nResumo: ${barSummary(b,d)}\nUsado: ${displayMeasure(b.used)}\nSobra: ${displayMeasure(Math.max(0,d.stock-b.used))}`).join('\n\n');
  $('cutPlan').innerHTML=d.bars.map((b,i)=>`<div class="bar"><div class="bar-title"><strong>Barrote ${i+1}</strong><span>Usado ${displayMeasure(b.used)} · sobra ${displayMeasure(Math.max(0,d.stock-b.used))}</span></div><div class="bar-count">${b.pieces.length} peças extraídas</div><div class="bar-summary">Resumo: ${barSummary(b,d)}</div><div class="bar-pieces">${b.pieces.map(x=>`<span class="piece-chip">${displayMeasure(x)}</span>`).join('')}</div></div>`).join('')
}
function printHeader(title,index,total){return `<div class="print-brand"><div><strong>SANZONY AUDIO TOOLS</strong><small>Difusor Lab — projeto para construção</small></div><div class="print-page-tag">Folha ${index} de ${total}</div></div>${title}`}
function printTitle(n,title,subtitle=''){return `<div class="print-title"><span class="print-title-badge">${n}</span><h2>${title}</h2></div>${subtitle?`<p class="print-subtitle">${subtitle}</p>`:''}`}
function sheet(content,label=''){return `<section class="print-sheet" data-label="${label}"><div class="print-fit">${content}</div><div class="print-footer"><span>Difusor Lab</span><span>Gerado em ${new Date().toLocaleDateString('pt-BR')}</span></div></section>`}
function buildPrintDocument(d){
  const pages=[];
  const total=1+1+1+1+d.bars.length+1;
  let page=1;
  const summaryMetrics=[['Base',`${displayMeasure(d.baseWidth)} × ${displayMeasure(d.baseHeight)}`,`Grade ${d.cols} × ${d.rows}`],['Blocos',`${d.useful}`,`${d.counts[0]} posições vazias`],['Madeira',displayMeasure(d.totalSuggested),`Exato: ${displayMeasure(d.totalExact)}`],['Comprar',`${d.bars.length} barrotes`,`${displayMeasure(d.stock)} cada`],['Faixa estimada',`${Math.round(d.fLow)}–${Math.round(d.fHigh)} Hz`,'Estimativa teórica'],['Peso',`≈ ${fmt(d.weight,1)} kg`,'Densidade média de 550 kg/m³']];
  const summary=`${printHeader('',page++,total)}${printTitle('1','Resumo do projeto','Uma folha com as informações principais antes do corte.')}<div class="print-metrics">${summaryMetrics.map(([a,b,c])=>`<div class="print-metric"><span>${a}</span><strong>${b}</strong><small>${c}</small></div>`).join('')}</div><table class="print-project-table"><tr><td>Tipo</td><td>${d.type==='skyline'?'Skyline 2D com blocos':'QRD 1D com poços'}</td></tr><tr><td>Sequência</td><td>N${d.N}</td></tr><tr><td>Face da madeira</td><td>${displayMeasure(d.cw)} × ${displayMeasure(d.ch)}</td></tr><tr><td>Profundidade máxima</td><td>${displayMeasure(d.depth)}</td></tr><tr><td>Base</td><td>${displayMeasure(d.baseWidth)} × ${displayMeasure(d.baseHeight)} × ${fmt(d.baseMm,0)} mm</td></tr><tr><td>Serra</td><td>${fmt(d.kerfCm*10,1)} mm por corte</td></tr><tr><td>Margem</td><td>${d.reserve}%</td></tr></table>`;
  pages.push(sheet(summary,'Resumo'));
  const maxCellW=650,maxCellH=760,gap=1;const cell=Math.max(3,Math.min(22,Math.floor((maxCellW-gap*(d.cols-1))/d.cols),Math.floor((maxCellH-gap*(d.rows-1))/d.rows)));
  const map=`${printHeader('',page++,total)}${printTitle('2','Mapa de montagem',`Grade ${d.cols} × ${d.rows}. “0” significa posição vazia.`)}<div class="print-map-legend">${Array.from({length:d.N},(_,l)=>`<span class="print-legend-item">${l} — ${l===0?'vazio':displayMeasure(levelDepth(l,d.N,d.depth))}</span>`).join('')}</div><div class="print-map-frame"><div class="print-map-grid" style="grid-template-columns:repeat(${d.cols},${cell}px)">${d.matrix.flat().map(l=>`<span class="print-map-cell ${l===0?'zero':''}" style="width:${cell}px;height:${cell}px;background:${l?COLORS[l%COLORS.length]:'#17263a'}">${l}</span>`).join('')}</div></div>`;
  pages.push(sheet(map,'Mapa'));
  const parts=`${printHeader('',page++,total)}${printTitle('3','Lista de peças','Quantidades exatas e quantidades com margem de segurança.')}<table class="print-table"><thead><tr><th>Nível</th><th>Comprimento</th><th>Exato</th><th>Com margem</th></tr></thead><tbody>${d.counts.map((q,l)=>`<tr><td>${l}</td><td>${l===0?'Vazio':displayMeasure(levelDepth(l,d.N,d.depth))}</td><td>${q}</td><td>${l===0?'—':d.suggestedCounts[l]}</td></tr>`).join('')}</tbody></table>`;
  pages.push(sheet(parts,'Peças'));
  const materials=`${printHeader('',page++,total)}${printTitle('4','Lista de materiais','Resumo para compra e preparação da montagem.')}<ul class="print-materials">${materialRows(d).map(([a,b])=>`<li><span>${a}</span><strong>${b}</strong></li>`).join('')}</ul>`;
  pages.push(sheet(materials,'Materiais'));
  d.bars.forEach((bar,i)=>{
    const content=`${printHeader('',page++,total)}${printTitle('5',`Plano de corte — Barrote ${i+1}`,`Esta folha contém somente o Barrote ${i+1}, evitando qualquer divisão entre páginas.`)}<div class="print-bar-card"><div class="print-bar-head"><div><h3>Barrote ${i+1}</h3><div class="print-bar-count">${bar.pieces.length} peças extraídas</div></div><div class="print-bar-used">Usado ${displayMeasure(bar.used)}<br>Sobra ${displayMeasure(Math.max(0,d.stock-bar.used))}</div></div><div class="print-bar-summary"><strong>Resumo das peças:</strong> ${barSummary(bar,d)}</div><div class="print-bar-ruler">${bar.pieces.map(x=>`<span class="print-piece">${displayMeasure(x)}</span>`).join('')}</div></div>`;
    pages.push(sheet(content,`Barrote ${i+1}`));
  });
  const assembly=`${printHeader('',page++,total)}${printTitle('6','Montagem resumida','Confira esta sequência antes de iniciar a colagem.')}<ol class="print-steps">${[...$('assemblySteps').children].map(li=>`<li>${li.textContent}</li>`).join('')}</ol><table class="print-project-table"><tr><td>Base</td><td>${displayMeasure(d.baseWidth)} × ${displayMeasure(d.baseHeight)}</td></tr><tr><td>Grade</td><td>${d.cols} × ${d.rows}</td></tr><tr><td>Blocos a cortar</td><td>${d.suggestedTotal}</td></tr><tr><td>Barrotes</td><td>${d.bars.length} de ${displayMeasure(d.stock)}</td></tr><tr><td>Peso aproximado</td><td>${fmt(d.weight,1)} kg</td></tr></table>`;
  pages.push(sheet(assembly,'Montagem'));
  $('printExport').innerHTML=pages.join('');
}
function fitPrintSheets(){
  document.querySelectorAll('.print-sheet').forEach(sheetEl=>{
    const fit=sheetEl.querySelector('.print-fit');fit.style.transform='none';
    const style=getComputedStyle(sheetEl),availableW=sheetEl.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),availableH=sheetEl.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-20;
    const scale=Math.min(1,availableW/Math.max(1,fit.scrollWidth),availableH/Math.max(1,fit.scrollHeight));
    fit.style.transform=`scale(${Math.max(.35,scale)})`;
  });
}
function queueFitPrintSheets(){clearTimeout(fitTimer);fitTimer=setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(fitPrintSheets)),30)}
async function exportPdf(){buildPrintDocument(currentData);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));fitPrintSheets();window.print()}
WATCH_IDS.forEach(id=>$(id).addEventListener('input',calc));
$('unit').addEventListener('change',calc);
$('presetBtn').addEventListener('click',()=>{$('unit').value='cm';lastUnit='cm';$('autoFit').checked=true;$('type').value='skyline';$('prime').value='5';$('cellW').value='4.5';$('cellH').value='4.5';$('maxDepth').value='10';$('baseThickness').value='9';$('baseWidth').value='46';$('baseHeight').value='46';$('stockLength').value='300';$('kerf').value='3';$('reserve').value='10';calc()});
$('toggleValues').addEventListener('click',()=>{showCm=!showCm;$('toggleValues').textContent=showCm?'Mostrar níveis':'Mostrar medidas';renderMap(currentData)});
$('printBtn').addEventListener('click',exportPdf);$('copyPlan').addEventListener('click',async()=>{await navigator.clipboard.writeText(currentPlanText);$('copyPlan').textContent='Copiado!';setTimeout(()=>$('copyPlan').textContent='Copiar plano',1400)});
window.addEventListener('beforeprint',()=>{buildPrintDocument(currentData);fitPrintSheets()});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;if(choice.outcome==='accepted'){$('installBtn').textContent='App instalado ✓';setTimeout(()=>{$('installBtn').hidden=true},2000);}else{$('installBtn').hidden=true;}});

/* ── Service Worker: registro + detecção de atualização ─────────────── */
let _toastShown = false;
function showUpdateToast() {
  if (_toastShown) return;
  _toastShown = true;
  const toast = $('updateToast');
  if (toast) toast.hidden = false;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');

      /* Detecta quando um novo SW é encontrado durante a sessão atual */
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          /* 'installed' + controller ativo = há versão anterior rodando */
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast();
          }
        });
      });
    } catch (err) {
      console.warn('[SW] Falha no registro:', err);
    }
  });

  /* Detecta quando o SW já ativou e avisou via postMessage (abas preexistentes) */
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED') showUpdateToast();
  });
}

$('reloadBtn').addEventListener('click', () => window.location.reload());
$('dismissToast').addEventListener('click', () => {
  $('updateToast').hidden = true;
  _toastShown = false; /* permite reexibir se vier outra atualização */
});

window.addEventListener('resize', () => { renderMap(currentData); queueFitPrintSheets(); });
calc();

