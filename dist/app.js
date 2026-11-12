const starterRecords = [
  {id:1, category:'student', name:'Иванова Мария', detail:'8А класс', title:'Открытая математическая олимпиада', subject:'Математика', level:'Региональный', result:'Победитель', region:'Москва', year:'2025–2026', date:'2026-04-18'},
  {id:2, category:'vsosh', name:'Петров Артём', detail:'10Б класс', title:'Всероссийская олимпиада школьников', subject:'Физика · региональный этап', level:'Региональный', result:'Призёр', region:'Московская область', year:'2025–2026', date:'2026-02-12'},
  {id:3, category:'teacher', name:'Соколова Елена Викторовна', detail:'учитель русского языка', title:'Учитель года России', subject:'Педагогическое мастерство', level:'Муниципальный', result:'Победитель', region:'Москва', year:'2025–2026', date:'2026-03-03'},
  {id:4, category:'school', name:'Школьный театр «Премьера»', detail:'творческий коллектив', title:'Фестиваль школьных театров «Живая сцена»', subject:'Театральное искусство', level:'Всероссийский', result:'Лауреат', region:'Санкт-Петербург', year:'2025–2026', date:'2026-01-25'},
  {id:5, category:'student', name:'Смирнов Даниил', detail:'7В класс', title:'Турнир юных биологов', subject:'Биология', level:'Муниципальный', result:'Призёр', region:'Москва', year:'2025–2026', date:'2025-12-10'},
  {id:6, category:'school', name:'Наша школа', detail:'образовательная организация', title:'Благодарность за участие в благотворительной акции «Дети — детям»', subject:'Благодарность школе', level:'Региональный', result:'Благодарность', region:'Москва', year:'2025–2026', date:'2025-11-21'},
  {id:7, category:'vsosh', name:'Орлова Софья', detail:'9А класс', title:'Всероссийская олимпиада школьников', subject:'Литература · муниципальный этап', level:'Муниципальный', result:'Победитель', region:'Москва', year:'2025–2026', date:'2025-11-17'},
  {id:8, category:'teacher', name:'Морозов Андрей Ильич', detail:'учитель информатики', title:'Конкурс методических разработок «Цифровой урок»', subject:'Информатика', level:'Всероссийский', result:'Призёр', region:'Республика Татарстан', year:'2024–2025', date:'2025-05-04'},
  {id:9, category:'student', name:'Кузнецова Полина', detail:'6Б класс', title:'Конкурс исследовательских проектов «Первые шаги»', subject:'Экология', level:'Международный', result:'Победитель', region:'Республика Беларусь', year:'2024–2025', date:'2025-04-16'},
  {id:10, category:'school', name:'Команда школьного музея', detail:'школьная команда', title:'Смотр-конкурс школьных музеев', subject:'Краеведение', level:'Региональный', result:'Победитель', region:'Тверская область', year:'2024–2025', date:'2025-03-09'},
  {id:11, category:'student', name:'Волков Михаил', detail:'11А класс', title:'Инженерный конкурс «Спутник»', subject:'Робототехника', level:'Всероссийский', result:'Призёр', region:'Калужская область', year:'2024–2025', date:'2025-02-20'},
  {id:12, category:'vsosh', name:'Лебедева Анна', detail:'11Б класс', title:'Всероссийская олимпиада школьников', subject:'История · заключительный этап', level:'Всероссийский', result:'Участник', region:'Нижегородская область', year:'2023–2024', date:'2024-04-07'}
];

const labels = {all:'Все достижения', student:'Достижения учеников', vsosh:'Всероссийская олимпиада школьников', teacher:'Достижения учителей', school:'Достижения и благодарности школы'};
const categoryLabels = {student:'Ученик', vsosh:'ВсОШ', teacher:'Учитель', school:'Школа'};
const levelOrder = {'Международный':5,'Всероссийский':4,'Региональный':3,'Муниципальный':2,'Школьный':1};
const shared = document.body.hasAttribute('data-shared-catalog');
let records = shared ? [] : (JSON.parse(localStorage.getItem('school-achievements-v2')||'null') ||
  [...starterRecords, ...JSON.parse(localStorage.getItem('school-achievements') || '[]')]);
let currentSection = 'all';
const pageSize = 12;
let currentPage = 1;
let editingId = null;
let selectedDocument = null;
let removeExistingDocument = false;

const $ = id => document.getElementById(id);
const controls = {search:$('searchInput'), year:$('yearFilter'), level:$('levelFilter'), region:$('regionFilter'), result:$('resultFilter'), department:$('departmentFilter'), sort:$('sortSelect')};

function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
async function refreshSharedRecords(){
  const response = await fetch('/api/records?summary=1');
  if(!response.ok) throw new Error('Не удалось загрузить общую базу.');
  records = await response.json();
  refreshFilterOptions();
  render();
}
async function saveEntry(entry, id=null){
  if(shared){
    const response = await fetch('/api/records', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...entry,id,summary:true})
    });
    if(response.status===409) throw new Error('Запись уже изменили. Закройте форму и откройте запись заново.');
    if(!response.ok) throw new Error('Сервер не сохранил запись. Проверьте поля и размер вложения.');
    entry=await response.json();
  }
  records=id===null ? [...records,entry] : records.map(record=>record.id===id?entry:record);
  if(!shared) localStorage.setItem('school-achievements-v2',JSON.stringify(records));
  return entry;
}
function initials(name) { const p=name.trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); }
function fillSelect(select, values) { values.filter(Boolean).sort((a,b)=>b.localeCompare(a,'ru')).forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; select.append(o); }); }
const departments = [
  ['math', 'Математика и информатика', /математ|информатик|программирован|искусственный интеллект|нейросет|vr-разработ|цифровой экосистем|электронного документооборот|умный город/u],
  ['science', 'Естественно-научные предметы', /биологи|хими|физик|географ|экологи|естествознан|естественно-науч|максвелл|агронтри|агрокосмос|солнечная батарея|закон бернулли|закон паскаля|рост растений|пробиотик|картофель|тропического растения/u],
  ['language', 'Русский язык и литература', /русский язык|литератур|чтец|чтецов|декламаци|пушкинские|чехове|медиажурналистик/u],
  ['foreign', 'Иностранные языки', /иностранн.{0,8} язык|английск|французск|испанск|немецк|лингвистическ/u],
  ['history', 'История и обществознание', /истори|обществознан|краевед|архивист|отечество|топонимик|воинской славы|международные отношения|(?:^|\s)право(?:$|\s)|экономик|предприниматель/u],
  ['arts', 'Искусство, технология и физическая культура', /технологи[яию]\b|технологи[яию](?=$|[\s«])|искусств[оау]|изодиктант|изобразительн|вокал|песни|музык|хоров|рисунок|физической культур|физическая культур|спорт|стрельб|обж|кадет|безопасно.{0,20}дорог|рукотворном дереве|юные таланты московии|техническо.{0,8} творчеств|техническому моделированию|робототехник|технофест|интэра|дежурный по планете/u],
  ['primary', 'Начальные классы', /(?:^|\s)[1-4](?:[а-я«» ]*) класс|начальн.{0,8} школ/u],
];
const technology = /3[дd]|аддитивн|промышленн.{0,8} дизайн|изготовление прототипов|инженерный дизайн|транспортные технологии будущего|техника и техническое творчество/u;
function recordDepartments(record) {
  if(record.department) return [record.department];
  const subject=(record.subject || '').toLocaleLowerCase('ru');
  const title=(record.title || '').toLocaleLowerCase('ru');
  const detail=(record.detail || '').toLocaleLowerCase('ru');
  if(technology.test(title) || technology.test(subject)) return ['arts'];
  if(/^технология/u.test(subject) || /всош по технологии|олимпиада школьников по технологии/u.test(title)) return ['arts'];
  for(const value of [subject,title,detail]){
    if(technology.test(value)) return ['arts'];
    const matches=departments.filter(([, , pattern])=>pattern.test(value)).map(([key])=>key);
    if(matches.length) return matches;
  }
  return ['unassigned'];
}
function populateFilters() {
  fillSelect(controls.year,[...new Set(records.map(r=>r.year))]);
  fillSelect(controls.level,[...new Set(records.map(r=>r.level))]);
  fillSelect(controls.region,[...new Set(records.map(r=>r.region))]);
  fillSelect(controls.result,[...new Set(records.map(r=>r.result))]);
}
function filteredRecords() {
  const q=controls.search.value.trim().toLocaleLowerCase('ru');
  let list=records.filter(r => (currentSection==='all'||r.category===currentSection)
    && (!q || [r.name,r.title,r.subject,r.detail,r.region].some(v=>(v||'').toLocaleLowerCase('ru').includes(q)))
    && (!controls.year.value||r.year===controls.year.value)
    && (!controls.level.value||r.level===controls.level.value)
    && (!controls.region.value||r.region===controls.region.value)
    && (!controls.result.value||r.result===controls.result.value)
    && (!controls.department.value||recordDepartments(r).includes(controls.department.value)));
  if(controls.sort.value==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  else if(controls.sort.value==='level') list.sort((a,b)=>(levelOrder[b.level]||0)-(levelOrder[a.level]||0));
  else list.sort((a,b)=>b.date.localeCompare(a.date));
  return list;
}
function hasDocument(record) { return Boolean(shared ? record.hasDocument : record.documentData); }
function documentUrl(record) { return shared ? `/api/records/${record.id}/document?revision=${record.revision}` : record.documentData; }
function card(record) {
  const gold=record.category==='vsosh'||record.result==='Победитель';
  const hasImage=hasDocument(record)&&(record.documentType||'').startsWith('image/');
  const leftSide=hasImage
    ? `<button type="button" class="card-document-preview open-document" data-document-id="${record.id}" aria-label="Открыть изображение подтверждающего документа"><img loading="lazy" decoding="async" src="${escapeHtml(documentUrl(record))}" alt="Документ, подтверждающий достижение: ${escapeHtml(record.name)}"></button>`
    : `<div class="avatar" aria-hidden="true">${escapeHtml(initials(record.name))}</div>`;
  return `<article class="achievement-card ${hasImage?'has-image':''}" data-category="${record.category}">
    ${leftSide}
    <div class="card-content">
      <div class="card-meta"><span class="badge ${gold?'gold':''}">${escapeHtml(categoryLabels[record.category])}</span><span class="badge neutral">${escapeHtml(record.level)}</span><span class="badge ${gold?'gold':''}">${escapeHtml(record.result)}</span></div>
      <h3>${escapeHtml(record.title)}</h3><p class="person">${escapeHtml(record.name)}</p>
      <p class="details"><span>${escapeHtml(record.detail)}</span><span>${escapeHtml(record.subject)}</span><span>${escapeHtml(record.region)}</span></p>
      <div class="card-actions">${hasDocument(record)?`<button type="button" class="document-link open-document" data-document-id="${record.id}" aria-label="Открыть подтверждающий документ">${hasImage?'Открыть скан':'Открыть PDF'}</button>`:''}<button type="button" class="edit-record" data-edit-id="${record.id}">Изменить</button><span class="card-year">${escapeHtml(record.year)}</span></div>
    </div></article>`;
}
const reportDepartments = new Map([...departments.map(([key,label])=>[key,label]),['unassigned','Требует уточнения']]);
function reportOptions(select, placeholder, options){
  const previous=select.value;
  select.replaceChildren(new Option(placeholder,''));
  for(const [key,label] of options) select.add(new Option(label,key));
  select.value=options.some(([key])=>key===previous)?previous:'';
}
function reportBars(id, groups){
  const largest=Math.max(1,...groups.map(([,count])=>count));
  $(id).innerHTML=groups.length?groups.map(([label,count])=>
    `<li><span>${escapeHtml(label)}</span><strong>${count}</strong><span class="report-track" aria-hidden="true"><span style="width:${count/largest*100}%"></span></span></li>`
  ).join(''):'<li>Нет данных</li>';
}
function renderReport(){
  const year=$('reportYear'), category=$('reportCategory'), department=$('reportDepartment'), check=$('reportCheck');
  const years=[...new Set(records.map(record=>record.year).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  reportOptions(year,'Все годы',years.map(value=>[value,value]));
  reportOptions(category,'Все разделы',Object.entries(categoryLabels));
  reportOptions(department,'Все объединения',[...reportDepartments]);
  const entries=records.map(record=>({record, groups:recordDepartments(record)})).filter(({record,groups})=>
    (!year.value || record.year===year.value) && (!category.value || record.category===category.value) &&
    (!department.value || groups.includes(department.value)) &&
    (check.value!=='missing' || !hasDocument(record)) && (check.value!=='unassigned' || groups.includes('unassigned')));
  const count=entries.length;
  const missing=entries.filter(({record})=>!hasDocument(record)).length;
  const unresolved=entries.filter(({groups})=>groups.includes('unassigned')).length;
  $('reportScope').textContent=[year.value||'Все учебные годы',category.selectedOptions[0].text,department.selectedOptions[0].text,check.selectedOptions[0].text].join(' · ');
  $('reportError').hidden=$('databaseStatus').hidden;
  $('reportMetrics').innerHTML=[
    ['Записей',count],['Победителей',entries.filter(({record})=>record.result==='Победитель').length],
    ['Без вложения',missing],['ШМО требует уточнения',unresolved]
  ].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  const yearCounts=new Map(), departmentCounts=new Map();
  for(const {record,groups} of entries){
    yearCounts.set(record.year,(yearCounts.get(record.year)||0)+1);
    for(const group of groups) departmentCounts.set(group,(departmentCounts.get(group)||0)+1);
  }
  reportBars('reportYears',years.filter(value=>yearCounts.has(value)).map(value=>[value,yearCounts.get(value)]));
  reportBars('reportDepartments',[...reportDepartments].filter(([key])=>departmentCounts.has(key))
    .map(([key,label])=>[label,departmentCounts.get(key)]).sort((a,b)=>b[1]-a[1]));
  $('reportCount').textContent=`Записей: ${count}`;
  entries.sort((a,b)=>a.record.name.localeCompare(b.record.name,'ru') || a.record.id-b.record.id);
  $('reportRows').innerHTML=entries.length?entries.map(({record,groups})=>`<tr>
    <td>${escapeHtml(record.id)}</td><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.title)}<small>${escapeHtml([record.level,record.subject,record.detail].filter(Boolean).join(' · '))}</small></td>
    <td>${escapeHtml(record.year)}</td><td>${escapeHtml(record.result)}</td><td>${escapeHtml(groups.map(key=>reportDepartments.get(key)).filter(Boolean).join(', '))}</td>
    <td>${hasDocument(record)?`<button type="button" class="document-link" data-report-document="${escapeHtml(record.id)}">Открыть</button><span class="report-print-document">Есть</span>`:'Нет'}</td></tr>`).join(''):
    '<tr><td colspan="7">По выбранным фильтрам записей нет.</td></tr>';
}
for(const id of ['reportYear','reportCategory','reportDepartment','reportCheck']) $(id).addEventListener('change',renderReport);
$('printReport').addEventListener('click',()=>window.print());
$('reportRows').addEventListener('click',event=>{
  const button=event.target.closest('[data-report-document]');
  if(button) openDocumentViewer(Number(button.dataset.reportDocument));
});
function render() {
  const reporting=currentSection==='statistics';
  $('catalogIntro').hidden=reporting;
  $('catalogWorkspace').hidden=reporting;
  $('statistics').hidden=!reporting;
  document.body.classList.toggle('report-open',reporting);
  if(reporting){ renderReport(); return; }
  const list=filteredRecords();
  const pageCount=Math.max(1,Math.ceil(list.length/pageSize));
  currentPage=Math.min(currentPage,pageCount);
  const start=(currentPage-1)*pageSize;
  $('cards').innerHTML=list.slice(start,start+pageSize).map(card).join('');
  $('pagination').hidden=pageCount===1;
  $('pagePrevious').disabled=currentPage===1;
  $('pageNext').disabled=currentPage===pageCount;
  $('pageStatus').textContent=`Страница ${currentPage} из ${pageCount}`;
  $('emptyState').hidden=list.length>0;
  $('cards').hidden=list.length===0;
  $('sectionTitle').textContent=labels[currentSection];
  $('resultCount').textContent=`Найдено записей: ${list.length}`;
  const active=[controls.year.value,controls.level.value,controls.region.value,controls.result.value,controls.department.value,controls.search.value].filter(Boolean).length;
  $('filterCount').textContent=active?`· ${active}`:'';
  $('statTotal').textContent=records.length;
  $('statWinners').textContent=records.filter(r=>r.result==='Победитель').length;
  $('statRegions').textContent=new Set(records.map(r=>r.region)).size;
}
function renderFirstPage(){ currentPage=1; render(); }
for(const [id,step] of [['pagePrevious',-1],['pageNext',1]]){
  $(id).addEventListener('click',()=>{
    currentPage+=step;
    render();
    $('sectionTitle').focus();
    $('sectionTitle').scrollIntoView({block:'start'});
  });
}
function reset() { controls.search.value=''; controls.year.value=''; controls.level.value=''; controls.region.value=''; controls.result.value=''; controls.department.value=''; renderFirstPage(); }

document.querySelectorAll('.nav-link').forEach(btn=>btn.addEventListener('click',()=>{
  currentSection=btn.dataset.section;
  document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x===btn));
  const menu=$('mobileMenu');
  if(menu.getAttribute('aria-expanded')==='true') menu.focus();
  menu.setAttribute('aria-expanded','false'); document.querySelector('.top-nav').classList.remove('open'); renderFirstPage();
  if(currentSection==='statistics') $('reportTitle').focus();
}));
Object.values(controls).forEach(c=>c.addEventListener(c===controls.search?'input':'change',renderFirstPage));
$('resetFilters').addEventListener('click',reset); $('emptyReset').addEventListener('click',reset);
$('filterToggle').addEventListener('click',()=>{const open=$('filters').classList.toggle('open'); $('filterToggle').setAttribute('aria-expanded',String(open));});
$('mobileMenu').addEventListener('click',()=>{const nav=document.querySelector('.top-nav'); const open=nav.classList.toggle('open'); $('mobileMenu').setAttribute('aria-expanded',String(open));});

const dialog=$('entryDialog');
$('openForm').addEventListener('click',()=>openEntryForm());
['closeForm','cancelForm'].forEach(id=>$(id).addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});
$('cards').addEventListener('click',e=>{
  const editButton=e.target.closest('.edit-record');
  if(editButton){openEntryForm(Number(editButton.dataset.editId));return;}
  const documentButton=e.target.closest('.open-document');
  if(documentButton) openDocumentViewer(Number(documentButton.dataset.documentId));
});

const documentDialog=$('documentDialog');
let activeDocumentUrl=null;
let documentScale=1;
const viewerImage=$('documentViewerImage');
const viewer=viewerImage.parentElement;
function setDocumentScale(scale){
  documentScale=Math.max(1,Math.min(4,scale));
  viewerImage.style.setProperty('--document-scale', `${documentScale*100}%`);
  $('zoomOut').disabled=documentScale===1;
  $('zoomIn').disabled=documentScale===4;
  if(documentScale===1) viewer.scrollTo(0,0);
}
$('zoomOut').addEventListener('click',()=>setDocumentScale(documentScale-.5));
$('zoomIn').addEventListener('click',()=>setDocumentScale(documentScale+.5));
$('zoomFit').addEventListener('click',()=>setDocumentScale(1));
function dataUrlToBlob(dataUrl){
  const [header,encoded]=dataUrl.split(',');
  const mime=header.match(/data:([^;]+)/)?.[1]||'application/octet-stream';
  const binary=atob(encoded); const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
function openDocumentViewer(id){
  const record=records.find(r=>r.id===id);
  if(!record || !hasDocument(record)) return;
  if(activeDocumentUrl) URL.revokeObjectURL(activeDocumentUrl);
  activeDocumentUrl=shared ? documentUrl(record) : URL.createObjectURL(dataUrlToBlob(record.documentData));
  const isImage=(record.documentType||'').startsWith('image/');
  $('documentViewerTitle').textContent=record.documentName||'Подтверждающий документ';
  $('documentViewerImage').hidden=!isImage; $('documentViewerPdf').hidden=isImage;
  if(isImage) $('documentViewerImage').src=activeDocumentUrl; else $('documentViewerPdf').src=activeDocumentUrl;
  $('downloadDocument').href=activeDocumentUrl; $('downloadDocument').download=record.documentName||'document';
  $('documentZoom').hidden=!isImage;
  documentDialog.showModal();
  setDocumentScale(1);
}
function clearDocumentViewer(){ $('documentViewerImage').removeAttribute('src'); $('documentViewerPdf').removeAttribute('src');
  if(activeDocumentUrl){URL.revokeObjectURL(activeDocumentUrl); activeDocumentUrl=null;}
}
documentDialog.addEventListener('close',clearDocumentViewer);
function closeDocumentViewer(){ documentDialog.close(); }
$('closeDocument').addEventListener('click',closeDocumentViewer);
documentDialog.addEventListener('click',e=>{if(e.target===documentDialog) closeDocumentViewer();});

let originalRecord;
function openEntryForm(id=null){
  const form=$('entryForm'); form.reset(); editingId=id; selectedDocument=null; removeExistingDocument=false; clearDocumentPreview(); setDocumentError();
  const record=id===null?null:records.find(r=>r.id===id);
  originalRecord=record;
  const yearSelect=form.elements.year;
  const now=new Date();
  const firstYear=now.getFullYear()-(now.getMonth()<8?1:0);
  const years=[...new Set([...records.map(item=>item.year), `${firstYear}–${firstYear+1}`])];
  yearSelect.replaceChildren();
  fillSelect(yearSelect,years);
  yearSelect.value=record?.year || `${firstYear}–${firstYear+1}`;
  document.getElementById('saveError').hidden=true;
  $('formEyebrow').textContent=record?'Исправление записи':'Новая публикация';
  $('formTitle').textContent=record?'Изменить достижение':'Добавить достижение';
  $('formNote').textContent=record?'Исправьте сведения и сохраните изменения.':'Заполните основные сведения и сохраните запись.';
  $('submitEntry').textContent=record?'Сохранить изменения':'Сохранить запись';
  if(record){
    ['category','name','title','level','result','region','detail','subject'].forEach(key=>{if(form.elements[key]) form.elements[key].value=record[key]||'';});
    const [department]=recordDepartments(record);
    form.elements.department.value=record.department || (department==='unassigned'?'':department);
    if(hasDocument(record)) showDocumentPreview({name:record.documentName||'Подтверждающий документ',type:record.documentType||'',data:documentUrl(record)});
  }
  dialog.showModal();
}

function clearDocumentPreview(){ $('documentPreview').hidden=true; $('documentThumb').hidden=true; $('documentThumb').removeAttribute('src'); $('documentFileName').textContent=''; }
function showDocumentPreview(file){
  $('documentPreview').hidden=false; $('documentFileName').textContent=file.name;
  const image=(file.type||'').startsWith('image/'); $('documentThumb').hidden=!image;
  if(image) $('documentThumb').src=file.data;
}
function setDocumentError(message=''){
  const error=$('documentError');
  error.hidden=!message;
  error.textContent=message;
  for(const id of ['documentInput','documentDrop']){
    if(message) $(id).setAttribute('aria-invalid','true');
    else $(id).removeAttribute('aria-invalid');
  }
}
function readDocument(file){
  if(!file) return;
  setDocumentError();
  const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
  if(!allowed.includes(file.type)){ setDocumentError('Выберите изображение JPG, PNG, WebP или документ PDF.'); return; }
  if(file.size>2*1024*1024){ setDocumentError('Файл слишком большой. Выберите документ размером до 2 МБ.'); return; }
  const reader=new FileReader();
  reader.onload=()=>{selectedDocument={name:file.name||'Изображение из буфера',type:file.type,data:reader.result}; removeExistingDocument=false; showDocumentPreview(selectedDocument);};
  reader.onerror=()=>setDocumentError('Не удалось прочитать файл. Попробуйте выбрать его ещё раз.');
  reader.readAsDataURL(file);
}
const dropZone=$('documentDrop');
$('documentInput').addEventListener('change',e=>readDocument(e.target.files[0]));
['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault(); dropZone.classList.add('dragging');}));
['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault(); dropZone.classList.remove('dragging');}));
dropZone.addEventListener('drop',e=>readDocument(e.dataTransfer.files[0]));
dialog.addEventListener('paste',e=>{const item=[...e.clipboardData.items].find(x=>x.type.startsWith('image/')); if(item){e.preventDefault(); readDocument(item.getAsFile());}});
$('removeDocument').addEventListener('click',()=>{selectedDocument=null; removeExistingDocument=true; $('documentInput').value=''; clearDocumentPreview(); setDocumentError();});

$('entryForm').addEventListener('submit',async e=>{
  e.preventDefault(); const form=e.currentTarget;
  if(document.getElementById('submitEntry').disabled) return;
  const data=Object.fromEntries(new FormData(form));
  delete data.document;
  const previous=originalRecord;
  const entry={...previous,...data,id:editingId??Date.now(),date:previous?.date||new Date().toISOString().slice(0,10)};
  if(shared) entry.keepDocument=Boolean(previous?.hasDocument && !removeExistingDocument && !selectedDocument);
  if(selectedDocument){entry.documentName=selectedDocument.name; entry.documentType=selectedDocument.type; entry.documentData=selectedDocument.data;}
  if(removeExistingDocument){delete entry.documentName; delete entry.documentType; delete entry.documentData;}
  const submit=document.getElementById('submitEntry');
  const errorBox=document.getElementById('saveError');
  errorBox.hidden=true;
  submit.disabled=true;
  try {
    await saveEntry(entry,editingId);
  } catch(error) {
    errorBox.textContent=error.message;
    errorBox.hidden=false;
    return;
  } finally {
    submit.disabled=false;
  }
  form.reset(); dialog.close(); currentSection='all';
  document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.section==='all'));
  refreshFilterOptions(); render(); $('toast').textContent=editingId===null?'Запись добавлена':'Изменения сохранены'; $('toast').classList.add('show'); setTimeout(()=>$('toast').classList.remove('show'),2200);
});
function refreshFilterOptions(){
  const values=[controls.year,controls.level,controls.region,controls.result].map(el=>el.value);
  [[controls.year,'Все годы'],[controls.level,'Все уровни'],[controls.region,'Все регионы'],[controls.result,'Все результаты']].forEach(([el,label])=>{el.innerHTML=`<option value="">${label}</option>`;});
  populateFilters();
  [controls.year,controls.level,controls.region,controls.result].forEach((el,i)=>{el.value=values[i];});
}

function registerAchievementTool() {
  const context=document.modelContext;
  if(!context?.registerTool) return;
  try {
    context.registerTool({
      name:'create_achievement',
      title:'Добавить достижение',
      description:'Добавляет новую запись в школьный каталог достижений и сразу показывает её на странице.',
      inputSchema:{
        type:'object', additionalProperties:false,
        properties:{
          category:{type:'string',enum:['student','vsosh','teacher','school']},
          year:{type:'string'}, name:{type:'string'}, title:{type:'string'},
          level:{type:'string',enum:['Школьный','Муниципальный','Региональный','Всероссийский','Международный']},
          result:{type:'string'}, region:{type:'string'}, detail:{type:'string'}, subject:{type:'string'}
        },
        required:['category','year','name','title','level','result','region']
      },
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      async execute(input){
        if(!input || typeof input!=='object') throw new Error('Не переданы данные достижения');
        const required=['category','year','name','title','level','result','region'];
        if(required.some(k=>typeof input[k]!=='string'||!input[k].trim())) throw new Error('Заполнены не все обязательные поля');
        const entry={...input,detail:input.detail||'',subject:input.subject||'',id:Date.now(),date:new Date().toISOString().slice(0,10)};
        const saved=await saveEntry(entry); refreshFilterOptions(); render();
        return {id:saved.id,status:'created',name:entry.name,title:entry.title};
      }
    });
  } catch(error) { console.warn('WebMCP недоступен',error); }
}

for(const [key,label] of [...departments,['unassigned','Требует уточнения']]){
  controls.department.add(new Option(label,key));
  $('entryDepartment').add(new Option(label,key));
}
populateFilters(); render(); registerAchievementTool();
if(shared){
  const status=document.getElementById('databaseStatus');
  const refresh=async()=>{
    if(dialog.open || documentDialog.open) return;
    try { await refreshSharedRecords(); status.hidden=true; $('reportError').hidden=true; }
    catch { status.hidden=false; $('reportError').hidden=false; }
  };
  refresh();
  window.addEventListener('focus',refresh);
  setInterval(refresh,15000);
}
