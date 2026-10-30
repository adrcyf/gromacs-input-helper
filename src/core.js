(() => {
 'use strict';
 const H=window.Helper={sections:{}}; let serial=0;
 H.clearImported=id=>{const s=H.sections[id];if(!s)return;s.output.value='';s.output.hidden=true;s.output.nextElementSibling.hidden=true;s.element.querySelectorAll('.error').forEach(e=>e.remove());s.element.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));s.element.querySelector('.status').textContent='已导入，请核对后生成。';s.body.dispatchEvent(new Event('input',{bubbles:true}));};
 H.setImported=(input,value,warnings,label)=>{value=value==null?'':String(value);if(input.tagName==='SELECT'&&![...input.options].some(o=>o.value===value)){input.append(H.el('option',{value},value?'导入值：'+value+'（请核对）':'未提供'));if(value)warnings.push(label+'：保留未列入选项的值 '+value);}if(input.type==='number'&&value&&!Number.isFinite(Number(value))){warnings.push(label+'：'+value+' 不是可识别数值，已留空');value='';}input.value=value;};
 H.el=(tag,attrs={},text)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')e.className=v;else if(k.startsWith('on')&&typeof v==='function')e.addEventListener(k.slice(2),v);else if(v!==undefined&&v!==null)e.setAttribute(k,v);}if(text!==undefined)e.textContent=text;return e;};
 H.note=(p,text)=>{const n=H.el('p',{class:'note'},text);p.append(n);return n;};
 H.fail=(input,msg)=>{if(input){input.setAttribute('aria-invalid','true');const m=H.el('span',{class:'error'},msg);input.after(m);}const err=new Error(msg);err.input=input;throw err;};
 H.str=(input,label,required=false)=>{const v=input.value.trim();if(required&&!v)H.fail(input,'请填写'+label+'。');return v;};
 H.num=(input,label,opt={})=>{const s=H.str(input,label,!!opt.required);if(!s)return null;const n=Number(s);if(!Number.isFinite(n))H.fail(input,label+'需要有效数值。');if(opt.integer&&!Number.isInteger(n))H.fail(input,label+'需要整数。');if(opt.min!==undefined&&n<opt.min)H.fail(input,label+'不能小于 '+opt.min+'。');if(opt.max!==undefined&&n>opt.max)H.fail(input,label+'不能大于 '+opt.max+'。');return n;};
 H.toggle=(input,on)=>{input.closest('.field').hidden=!on;input.disabled=!on;};
 H.field=(parent,s)=>{
  const box=H.el('div',{class:'field'}),id='field-'+(++serial),label=H.el('label',{for:id},s.label+(s.unit?' ['+s.unit+']':'')+(s.required?' *':''));
  const input=H.el(s.type==='select'?'select':'input',{id,'data-key':s.key,autocomplete:'off'});
  if(s.type==='select'){for(const v of s.options||[]){const o=typeof v==='string'?{value:v,label:v}:v;input.append(H.el('option',{value:o.value},o.label));}}
  else{input.type=s.type||'text';if(input.type==='number')input.step='any';}
  if(Object.hasOwn(s,'default'))input.value=s.default;
  if(s.placeholder)input.placeholder=s.placeholder;
  input.dataset.initial=input.value;input.dataset.required=s.required?'true':'false';
  const tip=H.el('button',{class:'info',type:'button',title:s.tip||s.label,'aria-label':s.label+'：查看解释','aria-expanded':'false'},'ⓘ');
  const detail=H.el('div',{class:'help',id:id+'-help',hidden:''},s.help||s.tip||'请按所选模型或研究条件填写；空白可选项不输出。');
  tip.setAttribute('aria-controls',detail.id);tip.onclick=()=>{detail.hidden=!detail.hidden;tip.setAttribute('aria-expanded',String(!detail.hidden));};
  const header=H.el('div',{class:'field-label'});header.append(label,tip);box.append(header,input);if(parent.tagName!=='TD')box.append(H.el('small',{class:'parameter-name'},s.key));box.append(detail);parent.append(box);return input;
 };
 H.table=(parent,s)=>{
  const group=H.el('div',{class:'table-group','data-table':s.key});if(s.title)group.append(H.el('h4',{},s.title));
  const wrap=H.el('div',{class:'table-scroll'}),table=H.el('table'),head=H.el('tr');
  for(const c of s.columns)head.append(H.el('th',{},c.label+(c.unit?' ['+c.unit+']':'')));head.append(H.el('th',{},'操作'));
  const thead=H.el('thead'),tbody=H.el('tbody');thead.append(head);table.append(thead,tbody);wrap.append(table);group.append(wrap);
  const controller={element:group,columns:s.columns,add(values={}){const tr=H.el('tr'),inputs={};let touched=false;for(const c of s.columns){const td=H.el('td');const f=H.field(td,{...c,required:false});if(values[c.key]!==undefined)f.value=values[c.key];f.addEventListener('input',()=>{touched=true;});f.addEventListener('change',()=>{touched=true;});inputs[c.key]=f;tr.append(td);}const cell=H.el('td'),del=H.el('button',{type:'button',class:'small'},'删除');del.onclick=()=>{tr.remove();group.dispatchEvent(new Event('input',{bubbles:true}));};cell.append(del);tr.append(cell);tr._row={inputs,get touched(){return touched;}};tbody.append(tr);return tr;},set(rows){this.setting=true;try{tbody.replaceChildren();for(const row of rows)this.add(row);}finally{this.setting=false;}group.dispatchEvent(new Event('input',{bubbles:true}));},getRows(){return [...tbody.rows].map(tr=>{const r=tr._row,values={};for(const [k,f]of Object.entries(r.inputs))values[k]=f.value.trim();return {values,inputs:r.inputs,touched:r.touched,dataFilled:Object.values(r.inputs).some(f=>f.tagName!=='SELECT'&&f.value.trim()!==''&&f.value!==f.dataset.initial)};});}};
  const add=H.el('button',{type:'button',class:'small'},'＋ 添加一行');add.onclick=()=>controller.add();group.append(add);parent.append(group);for(let i=0;i<(s.initialRows??1);i++)controller.add();return controller;
 };
 H.section=(id,title,lead)=>{
  const section=H.el('section',{id,'data-section':id}),header=H.el('div',{class:'section-heading'});header.append(H.el('h2',{},title),H.el('a',{href:'#directory',class:'return'},'↑ 返回目录'));section.append(header);H.note(section,lead);
  const body=H.el('div',{class:'fields'});section.append(body);
  const actions=H.el('div',{class:'actions'}),gen=H.el('button',{type:'button',class:'primary'},'生成内容'),commentLabel=H.el('label',{class:'check'}),comments=H.el('input',{type:'checkbox'});comments.checked=true;commentLabel.append(comments,document.createTextNode('输出中文注释'));actions.append(gen,commentLabel);if(id==='gro')commentLabel.hidden=true;section.append(actions);
  const status=H.el('p',{class:'status','aria-live':'polite'},'填写后点击生成；空白可选项会省略。'),output=H.el('textarea',{class:'output',readonly:'',rows:'12',wrap:'off','aria-label':title+'生成结果',spellcheck:'false',hidden:''}),tools=H.el('div',{class:'actions',hidden:''}),copy=H.el('button',{type:'button'},'复制内容'),wrap=H.el('button',{type:'button'},'自动换行');copy.disabled=true;
  tools.append(copy,wrap,H.el('a',{href:'#directory'},'↑ 返回目录'));section.append(status,output,tools);document.getElementById('sections').append(section);
  document.getElementById('file-nav').append(H.el('a',{href:'#'+id},title));
  let generator;
  const api={body,output,element:section,onGenerate(fn){generator=fn;},generate(){section.querySelectorAll('.error').forEach(e=>e.remove());section.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));try{output.value=generator(comments.checked);output.hidden=false;tools.hidden=false;copy.disabled=false;status.textContent='已生成，可复制后保存为对应文件。';status.className='status success';return output.value;}catch(e){output.value='';output.hidden=true;tools.hidden=true;copy.disabled=true;status.textContent=e.message;status.className='status error-summary';if(e.input){e.input.scrollIntoView({block:'center'});e.input.focus({preventScroll:true});}return null;}}};
  gen.onclick=()=>api.generate();
  const stale=()=>{if(output.value){copy.disabled=true;status.textContent='内容已修改，请重新生成。';status.className='status';}};body.addEventListener('input',stale);body.addEventListener('change',stale);comments.addEventListener('change',stale);
  copy.onclick=async()=>{const text=output.value;if(copy.disabled)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{output.focus();output.select();if(!document.execCommand('copy'))throw Error();}status.textContent='已复制。';}catch{output.focus();output.select();status.textContent='内容已选中，请按 Ctrl+C 复制。';}};
  wrap.onclick=()=>{output.wrap=output.wrap==='off'?'soft':'off';wrap.textContent=output.wrap==='off'?'自动换行':'保持原行宽';};H.sections[id]=api;return api;
 };
 // Explicitly start each page load empty; do not use persistent browser storage.
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
})();
