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
const storedSnapshot=JSON.parse(localStorage.getItem('school-achievements-v2')||'null');
let records = storedSnapshot || [...starterRecords, ...JSON.parse(localStorage.getItem('school-achievements') || '[]')];
let currentSection = 'all';
let editingId = null;
let selectedDocument = null;
let removeExistingDocument = false;

const $ = id => document.getElementById(id);
const controls = {search:$('searchInput'), year:$('yearFilter'), level:$('levelFilter'), region:$('regionFilter'), result:$('resultFilter'), sort:$('sortSelect')};

function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function saveRecords(){ localStorage.setItem('school-achievements-v2',JSON.stringify(records)); }
function initials(name) { const p=name.trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); }
function fillSelect(select, values) { values.filter(Boolean).sort((a,b)=>b.localeCompare(a,'ru')).forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; select.append(o); }); }
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
    && (!controls.result.value||r.result===controls.result.value));
  if(controls.sort.value==='name') list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
  else if(controls.sort.value==='level') list.sort((a,b)=>(levelOrder[b.level]||0)-(levelOrder[a.level]||0));
  else list.sort((a,b)=>b.date.localeCompare(a.date));
  return list;
}
function card(record) {
  const gold=record.category==='vsosh'||record.result==='Победитель';
  const hasImage=record.documentData&&(record.documentType||'').startsWith('image/');
  const leftSide=hasImage
    ? `<button type="button" class="card-document-preview open-document" data-document-id="${record.id}" aria-label="Открыть изображение подтверждающего документа"><img src="${record.documentData}" alt="Документ, подтверждающий достижение: ${escapeHtml(record.name)}"></button>`
    : `<div class="avatar" aria-hidden="true">${escapeHtml(initials(record.name))}</div>`;
  return `<article class="achievement-card ${hasImage?'has-image':''}" data-category="${record.category}">
    ${leftSide}
    <div class="card-content">
      <div class="card-meta"><span class="badge ${gold?'gold':''}">${escapeHtml(categoryLabels[record.category])}</span><span class="badge neutral">${escapeHtml(record.level)}</span><span class="badge ${gold?'gold':''}">${escapeHtml(record.result)}</span></div>
      <h3>${escapeHtml(record.title)}</h3><p class="person">${escapeHtml(record.name)}</p>
      <p class="details"><span>${escapeHtml(record.detail)}</span><span>${escapeHtml(record.subject)}</span><span>${escapeHtml(record.region)}</span></p>
      <div class="card-actions">${record.documentData?`<button type="button" class="document-link open-document" data-document-id="${record.id}" aria-label="Открыть подтверждающий документ">▣ Документ приложен</button>`:''}<button type="button" class="edit-record" data-edit-id="${record.id}">Изменить</button><span class="card-year">${escapeHtml(record.year)}</span></div>
    </div></article>`;
}
function render() {
  const list=filteredRecords();
  $('cards').innerHTML=list.map(card).join('');
  $('emptyState').hidden=list.length>0;
  $('cards').hidden=list.length===0;
  $('sectionTitle').textContent=labels[currentSection];
  $('resultCount').textContent=`Найдено записей: ${list.length}`;
  const active=[controls.year.value,controls.level.value,controls.region.value,controls.result.value,controls.search.value].filter(Boolean).length;
  $('filterCount').textContent=active?`· ${active}`:'';
  $('statTotal').textContent=records.length;
  $('statWinners').textContent=records.filter(r=>r.result==='Победитель').length;
  $('statRegions').textContent=new Set(records.map(r=>r.region)).size;
}
function reset() { controls.search.value=''; controls.year.value=''; controls.level.value=''; controls.region.value=''; controls.result.value=''; render(); }

document.querySelectorAll('.nav-link').forEach(btn=>btn.addEventListener('click',()=>{
  currentSection=btn.dataset.section;
  document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x===btn));
  const menu=$('mobileMenu');
  if(menu.getAttribute('aria-expanded')==='true') menu.focus();
  menu.setAttribute('aria-expanded','false'); document.querySelector('.top-nav').classList.remove('open'); render();
}));
Object.values(controls).forEach(c=>c.addEventListener(c===controls.search?'input':'change',render));
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
function dataUrlToBlob(dataUrl){
  const [header,encoded]=dataUrl.split(',');
  const mime=header.match(/data:([^;]+)/)?.[1]||'application/octet-stream';
  const binary=atob(encoded); const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
function openDocumentViewer(id){
  const record=records.find(r=>r.id===id);
  if(!record?.documentData) return;
  if(activeDocumentUrl) URL.revokeObjectURL(activeDocumentUrl);
  activeDocumentUrl=URL.createObjectURL(dataUrlToBlob(record.documentData));
  const isImage=(record.documentType||'').startsWith('image/');
  $('documentViewerTitle').textContent=record.documentName||'Подтверждающий документ';
  $('documentViewerImage').hidden=!isImage; $('documentViewerPdf').hidden=isImage;
  if(isImage) $('documentViewerImage').src=activeDocumentUrl; else $('documentViewerPdf').src=activeDocumentUrl;
  $('downloadDocument').href=activeDocumentUrl; $('downloadDocument').download=record.documentName||'document';
  documentDialog.showModal();
}
function closeDocumentViewer(){
  documentDialog.close(); $('documentViewerImage').removeAttribute('src'); $('documentViewerPdf').removeAttribute('src');
  if(activeDocumentUrl){URL.revokeObjectURL(activeDocumentUrl); activeDocumentUrl=null;}
}
$('closeDocument').addEventListener('click',closeDocumentViewer);
documentDialog.addEventListener('click',e=>{if(e.target===documentDialog) closeDocumentViewer();});

function openEntryForm(id=null){
  const form=$('entryForm'); form.reset(); editingId=id; selectedDocument=null; removeExistingDocument=false; clearDocumentPreview(); setDocumentError();
  const record=id===null?null:records.find(r=>r.id===id);
  $('formEyebrow').textContent=record?'Исправление записи':'Новая публикация';
  $('formTitle').textContent=record?'Изменить достижение':'Добавить достижение';
  $('formNote').textContent=record?'Исправьте сведения и сохраните изменения.':'Заполните основные сведения. Запись появится в каталоге этого браузера.';
  $('submitEntry').textContent=record?'Сохранить изменения':'Сохранить запись';
  if(record){
    ['category','year','name','title','level','result','region','detail','subject'].forEach(key=>{if(form.elements[key]) form.elements[key].value=record[key]||'';});
    if(record.documentData) showDocumentPreview({name:record.documentName||'Подтверждающий документ',type:record.documentType||'',data:record.documentData});
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
  e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget));
  delete data.document;
  const previous=editingId===null?null:records.find(r=>r.id===editingId);
  const entry={...previous,...data,id:editingId??Date.now(),date:previous?.date||new Date().toISOString().slice(0,10)};
  if(selectedDocument){entry.documentName=selectedDocument.name; entry.documentType=selectedDocument.type; entry.documentData=selectedDocument.data;}
  if(removeExistingDocument){delete entry.documentName; delete entry.documentType; delete entry.documentData;}
  if(editingId===null) records.push(entry); else records=records.map(r=>r.id===editingId?entry:r);
  saveRecords(); e.currentTarget.reset(); dialog.close(); currentSection='all';
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
      execute(input){
        if(!input || typeof input!=='object') throw new Error('Не переданы данные достижения');
        const required=['category','year','name','title','level','result','region'];
        if(required.some(k=>typeof input[k]!=='string'||!input[k].trim())) throw new Error('Заполнены не все обязательные поля');
        const entry={...input,detail:input.detail||'',subject:input.subject||'',id:Date.now(),date:new Date().toISOString().slice(0,10)};
        records.push(entry); saveRecords(); refreshFilterOptions(); render();
        return {id:entry.id,status:'created',name:entry.name,title:entry.title};
      }
    });
  } catch(error) { console.warn('WebMCP недоступен',error); }
}

populateFilters(); render(); registerAchievementTool();
