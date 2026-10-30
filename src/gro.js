(() => {
 'use strict';const H=window.Helper,sec=H.section('gro','structure.gro · 坐标与盒子','导入现有 GRO 或粘贴其文本，再编辑表格。只整理已有坐标，不自动添加虚拟位点；总位点数按表格计算。'),f={};
 f.title=H.field(sec.body,{key:'title',label:'结构标题',type:'text',tip:'GRO第一行说明',help:'描述坐标内容，不承载电荷、力场或分子组成参数。'});
 f.precision=H.field(sec.body,{key:'precision',label:'坐标小数位数',type:'select',options:['3','4','5','6','7','8'],default:'3',tip:'坐标单位nm，固定列宽',help:'坐标列宽=小数位数+5。导入时保留可支持精度；复制和保存时不要用Tab替代空格。'});
 f.velocity=H.field(sec.body,{key:'velocity',label:'速度列',type:'select',options:[{value:'no',label:'不含速度'},{value:'yes',label:'包含速度 [nm/ps]'}],default:'no',tip:'是否逐位点输出速度',help:'导入检测到速度时自动保留。若手动关闭，生成时将明确提示移除速度列。'});
 const columns=[['resnr','残基号','number'],['resname','残基名','text'],['atom','位点名','text'],['nr','位点编号','number'],['x','x [nm]','number'],['y','y [nm]','number'],['z','z [nm]','number'],['vx','vx [nm/ps]','number'],['vy','vy [nm/ps]','number'],['vz','vz [nm/ps]','number']].map(([key,label,type])=>({key,label,type,tip:label,help:['resname','atom'].includes(key)?'GRO名称最多5个ASCII字符；位点顺序必须与拓扑对应。':'按现有结构填写；编号是整数，坐标与速度允许负值和零。'}));
 const atoms=H.table(sec.body,{key:'coordinates',title:'逐位点坐标',columns,initialRows:1});
 const count=H.note(sec.body,'总位点数：0');
 f.boxType=H.field(sec.body,{key:'boxType',label:'盒子格式',type:'select',options:[{value:'3',label:'正交盒 · 3个分量'},{value:'9',label:'一般盒 · 9个分量'}],default:'3',tip:'GRO最后一行',help:'3分量为x、y、z盒长；9分量顺序为v1x v2y v3z v1y v1z v2x v2z v3x v3y。全部单位nm，按原文件保留。'});
 f.box=H.field(sec.body,{key:'box',label:'盒子分量',type:'text',tip:'空格分隔，单位nm',help:'填写3或9个数，不从原子坐标自动猜盒子。正交盒的三个边长应为正。'});
 const file=H.el('input',{type:'file',accept:'.gro,text/plain','aria-label':'导入GRO文件'}),paste=H.el('textarea',{rows:'5',class:'paste','aria-label':'粘贴GRO内容',placeholder:'在这里粘贴已有GRO全文'}),load=H.el('button',{type:'button'},'读取粘贴内容'),message=H.el('p',{class:'status'});sec.body.append(H.el('h3',{},'导入或粘贴'),file,paste,load,message);
 const re=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
 function tokens(s,n,label){const v=s.trim().split(/\s+/);if(v.length!==n||v.some(x=>!re.test(x)||!Number.isFinite(Number(x))))throw Error(label+'需要'+n+'个有效数字。');return v;}
 function importText(text){
  const lines=text.replace(/\r\n?/g,'\n').split('\n');while(lines.length&&lines.at(-1).trim()==='')lines.pop();
  if(lines.length<3)throw Error('GRO至少需要标题、位点总数、盒子行。');const n=Number(lines[1].trim());if(!Number.isInteger(n)||n<0||lines.length!==n+3)throw Error('位点总数与实际坐标行数不一致，或包含额外帧；请导入单帧GRO。');
  const rows=[];let precision=null,hasVelocity=null;
  for(let k=0;k<n;k++){const line=lines[k+2],rest=line.slice(20),dots=[...rest.matchAll(/\./g)].map(x=>x.index);if(dots.length<3)throw Error('第'+(k+3)+'行无法识别坐标精度。');const w=dots[1]-dots[0],p=w-5;if(p<3||p>8||dots[2]-dots[1]!==w)throw Error('暂支持3—8位小数的固定宽度GRO；原内容未被修改。');
   const row={resnr:line.slice(0,5).trim(),resname:line.slice(5,10).trim(),atom:line.slice(10,15).trim(),nr:line.slice(15,20).trim()};
   ['x','y','z'].forEach((key,i)=>{row[key]=rest.slice(i*w,(i+1)*w).trim();if(!re.test(row[key]))throw Error('第'+(k+3)+'行坐标不是有效数字。');});const tail=rest.slice(3*w),vel=tail.trim()!=='';
   if(vel){const vw=p+5;['vx','vy','vz'].forEach((key,i)=>{row[key]=tail.slice(i*vw,(i+1)*vw).trim();if(!re.test(row[key]))throw Error('第'+(k+3)+'行速度列格式无法识别，未丢弃数据。');});if(tail.slice(3*vw).trim())throw Error('坐标行含额外数据，未丢弃。');}
   if(precision!==null&&(precision!==p||hasVelocity!==vel))throw Error('每行的精度和速度列必须一致。');precision=p;hasVelocity=vel;rows.push(row);
  }
  const box=lines[n+2].trim().split(/\s+/);if(![3,9].includes(box.length))throw Error('盒子行需要3或9个分量。');tokens(lines[n+2],box.length,'盒子');
  f.title.value=lines[0];f.precision.value=String(precision||3);f.velocity.value=hasVelocity?'yes':'no';f.boxType.value=String(box.length);f.box.value=box.join(' ');atoms.set(rows);update();sec.body.dispatchEvent(new Event('input',{bubbles:true}));message.textContent='已读取 '+n+' 个位点；请核对盒子和位点顺序。';return rows;
 }
 function loadText(t){try{importText(t);message.className='status success';}catch(e){message.textContent=e.message;message.className='status error-summary';}}
 load.onclick=()=>loadText(paste.value);file.onchange=async()=>{if(file.files[0])loadText(await file.files[0].text());};
 function filled(r){return ['resnr','resname','atom','nr','x','y','z','vx','vy','vz'].some(k=>r.values[k]!== '');}
 function update(){const vel=f.velocity.value==='yes';atoms.getRows().forEach(r=>['vx','vy','vz'].forEach(k=>{H.toggle(r.inputs[k],vel);r.inputs[k].closest('td').hidden=!vel;}));atoms.element.querySelectorAll('thead th').forEach((th,i)=>{if(i>=7&&i<=9)th.hidden=!vel;});count.textContent='总位点数：'+atoms.getRows().filter(filled).length;}
 f.velocity.addEventListener('change',()=>{message.textContent=f.velocity.value==='no'?'当前选择不输出速度；已有速度值保留在表格中，改回“包含速度”即可恢复。':'生成时将保留每个位点的三个速度分量。';});
 sec.body.addEventListener('input',update);sec.body.addEventListener('change',update);const oldAdd=atoms.add.bind(atoms);atoms.add=(v)=>{const row=oldAdd(v);if(!atoms.setting)update();return row;};update();
 function fixed(n,w,p,input){const s=Number(n).toFixed(p);if(s.length>w)H.fail(input,'数值超出当前列宽；请增加坐标精度或调整输入。');return s.padStart(w);}
 function generate(){const rows=atoms.getRows().filter(filled),p=Number(f.precision.value),w=p+5,vel=f.velocity.value==='yes';if(!rows.length)H.fail(atoms.getRows()[0]?.inputs.x,'至少填写一个位点。');const seen=new Set(),lines=[H.str(f.title,'结构标题')||'Molecular structure',String(rows.length)];
  for(const r of rows){const {values:v,inputs:i}=r;const rn=H.num(i.resnr,'残基号',{required:true,integer:true,min:0,max:99999}),nr=H.num(i.nr,'位点编号',{required:true,integer:true,min:1,max:99999});if(seen.has(nr))H.fail(i.nr,'位点编号重复。');seen.add(nr);const name=k=>{const t=H.str(i[k],k,true);if(!/^[!-~]{1,5}$/.test(t))H.fail(i[k],'名称需为1—5个ASCII非空白字符。');return t;};let row=String(rn).padStart(5)+name('resname').padEnd(5)+name('atom').padStart(5)+String(nr).padStart(5);for(const k of ['x','y','z'])row+=fixed(H.num(i[k],k,{required:true}),w,p,i[k]);if(vel)for(const k of ['vx','vy','vz'])row+=fixed(H.num(i[k],k,{required:true}),w,p+1,i[k]);lines.push(row);}
  const box=tokens(H.str(f.box,'盒子分量',true),Number(f.boxType.value),'盒子');if(box.slice(0,3).some(x=>Number(x)<=0))H.fail(f.box,'盒子三个主对角分量应为正。');lines.push(box.map(v=>Number(v).toFixed(Math.max(5,p))).join(' '));return lines.join('\n')+'\n';}
 H.groForm={fields:f,atoms,importText,generate};sec.onGenerate(generate);
})();
