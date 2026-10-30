(function (H) {
  'use strict';
  H.topForms = H.topForms || {};
  const details = {
    comb:'混合规则决定同类参数的表示和异类相互作用的混合方式。规则 1 使用 C6/C12，规则 2 和 3 使用 sigma/epsilon；必须与力场定义一致，切换不会转换数值。',
    pairs:'控制是否根据普通 LJ 参数生成缺失的 1-4 LJ 参数，并不自动生成 pairs 位点清单；遵循力场设置。',
    fudgeLJ:'1-4 LJ 相互作用的缩放因子，无量纲；依照所用力场填写，0 是有效值。', fudgeQQ:'1-4 静电相互作用的缩放因子，无量纲；依照所用力场填写，0 是有效值。',
    include:'自定义原子类型文件的相对路径或力场可解析路径；包含在全局 defaults 后、分子定义前。',
    bonded:'可选的成键类型名；按力场定义填写。', atomic:'原子序数，按模型类型填写；虚拟位点请核对模型的原子序数。', mass:'质量，单位 u；虚拟位点质量可以为 0，须遵循模型的质量分配。',
    charge:'电荷，单位 e，可为负数或零。原子类型表中是默认值；分子 atoms 表中是该位点实际使用的电荷，可覆盖类型默认值。',
    ptype:'A 表示普通原子，V 表示虚拟位点；依据模型选择。', v:'LJ 的第一参数：规则 1 是 C6，规则 2/3 是 sigma；按对应单位和模型填写非负值。', w:'LJ 的第二参数：规则 1 是 C12，规则 2/3 是 epsilon；按对应单位和模型填写非负值。',
    name:'填写模型中的名称，分子类型名需与体系 molecules 表匹配；类型名和文件名称不是元素符号。', type:'填写已定义的原子类型名，与力场 atomtypes 精确匹配。', nr:'分子内原子编号从 1 开始且按行连续；须与坐标中的顺序一致。',
    resnr:'该位点所属残基的正整数编号。', residue:'该位点所属残基名称，需与模型和坐标对应。', atom:'该位点的原子名称，需与坐标顺序及模型对应。', cgnr:'电荷组编号；按模型或力场规定填写正整数。',
    nrexcl:'按成键连接自动排除分子内非键相互作用的邻接层数；不是原子数，须与力场、显式 exclusions 和 pairs 配合。',
    filename:'保存分子定义时使用的建议文件名；总拓扑中的 include 路径需与实际文件名一致。',
    i:'分子内已定义的原子编号；应与 atoms 的编号一致。', j:'分子内已定义的原子编号；在角 i-j-k 中，j 是顶点。', k:'分子内已定义的第三个原子编号；角 i-j-k 的顶点是 j。', l:'分子内已定义的第四个原子编号。', s:'虚拟位点本身的原子编号，必须已经出现在 atoms 中。',
    b0:'谐和键平衡长度，单位 nm，按模型参数填写。', kb:'谐和键力常数，单位 kJ/(mol nm²)，按函数 1 的定义填写。', theta:'谐和角平衡角度，单位度。', ktheta:'谐和角力常数，单位 kJ/(mol rad²)，按模型填写。',
    phase:'周期二面角的相位，单位度。', kp:'周期二面角函数 1 的系数，单位 kJ/mol，可按模型为负。', multiplicity:'周期二面角的正整数周期数。',
    c0:'RB 函数 3 的 C0 系数，单位 kJ/mol。',c1:'RB 函数 3 的 C1 系数，单位 kJ/mol。',c2:'RB 函数 3 的 C2 系数，单位 kJ/mol。',c3:'RB 函数 3 的 C3 系数，单位 kJ/mol。',c4:'RB 函数 3 的 C4 系数，单位 kJ/mol。',c5:'RB 函数 3 的 C5 系数，单位 kJ/mol。',
    distance:'约束目标距离，单位 nm；避免无依据地与同一连接的弹性势重复。', others:'输入一个或多个已定义的原子编号，以空格分隔；这些位点与首编号的非键相互作用被排除。',
    kx:'x 方向位置限制力常数，单位 kJ/(mol nm²)，使用时还需参考坐标。',ky:'y 方向位置限制力常数，单位 kJ/(mol nm²)，使用时还需参考坐标。',kz:'z 方向位置限制力常数，单位 kJ/(mol nm²)，使用时还需参考坐标。',
    doh:'SETTLE 水模型的 O–H 距离，单位 nm；氧编号后必须紧接两个氢位点。', dhh:'SETTLE 水模型的 H–H 距离，单位 nm；仅用于适用的刚性三位点水模型。', a:'两构造点线性虚拟位点系数 a：r_s=(1-a)r_i+a r_j；质量和排除仍需遵循完整模型。',
    route:'选择自定义或已安装标准力场；只能包含一份 defaults，标准力场路径通常为模型名.ff/forcefield.itp。', ff:'力场主文件的 include 路径；标准力场使用实际安装的模型名.ff/forcefield.itp，自定义时可使用 forcefield.itp。',
    types:'可选的额外原子类型文件；放在力场之后、分子定义之前。自定义力场若已包含该文件，不要重复添加。', system:'单行体系描述；建议使用简短英文。', path:'需要包含的分子定义或其他文件的实际路径；顺序须满足依赖关系。', count:'该分子类型在体系中的分子数，非原子数；可以为 0，排列顺序须与坐标一致。'
  };
  const meta = (key,label) => ({tip:(details[key]||label).split('。')[0],help:details[key] || ('填写'+label+'；应与所选模型及其参数来源一致。')});
  const field = (p, key, label, type = 'text', extra = {}) => H.field(p, Object.assign({key, label, type}, meta(key,label), extra));
  const col = (key, label, type = 'text', extra = {}) => Object.assign({key, label, type}, meta(key,label), extra);
  const comment = (enabled, text) => enabled ? '; ' + text + '\n' : '';
  function clean(input, label, required = true) {
    const v = H.str(input, label, required);
    if (v && /[\r\n;#]/.test(v)) H.fail(input, label + '不能包含换行、分号或 #');
    return v;
  }
  function token(input, label) {
    const v = clean(input, label);
    if (v && /\s/.test(v)) H.fail(input, label + '不能包含空格');
    return v;
  }
  function path(input, label, required = true) {
    const v = clean(input, label, required);
    if (v && /["<>]/.test(v)) H.fail(input, label + '不能包含引号或尖括号');
    return v;
  }
  function rows(table) { return table.getRows().filter(r => Object.entries(r.values).some(([key,v]) => { const input=r.inputs[key]; return v !== '' && !(input && input.tagName === 'SELECT' && v === input.options[0]?.value); })); }
  function val(r, key, label, opt = {}) { return H.num(r.inputs[key], label, Object.assign({required:true}, opt)); }
  function tok(r, key, label) { return token(r.inputs[key], label); }
  const idx = (r, k) => val(r, k, '原子编号 ' + k, {integer:true,min:1});
  const float = (r, k, label, extra) => val(r, k, label || k, extra || {});
  const indexCols = ks => ks.map(k => col(k, k + ' 原子编号', 'number'));
  const numCol = (key, label, unit) => col(key, label, 'number', {unit});

  const ff = H.section('forcefield', '自定义力场规则', 'LJ 12-6 的全局规则；整个体系只能有一份 defaults。');
  const f = {};
  f.comb = field(ff.body,'comb','混合规则','select',{options:[{value:'1',label:'1：C6 / C12'},{value:'2',label:'2：σ 算术、ε 几何'},{value:'3',label:'3：σ 和 ε 几何'}],default:'2'});
  f.pairs = field(ff.body,'pairs','生成缺失的 1-4 LJ 参数','select',{options:['no','yes'],default:'no'});
  f.lj = field(ff.body,'fudgeLJ','1-4 LJ 缩放因子','number',{required:true});
  f.qq = field(ff.body,'fudgeQQ','1-4 静电缩放因子','number',{required:true});
  f.include = field(ff.body,'include','原子类型文件','text',{default:'atomtypes.itp',required:true});
  function generateFF(c) {
    const comb=H.str(f.comb,'混合规则',true), pairs=H.str(f.pairs,'生成缺失的 1-4 LJ 参数',true);
    const lj=H.num(f.lj,'fudgeLJ',{required:true,min:0}), qq=H.num(f.qq,'fudgeQQ',{required:true,min:0});
    return comment(c,'LJ 12-6；规则和缩放因子须与模型一致。')+'[ defaults ]\n1 '+comb+' '+pairs+' '+lj+' '+qq+'\n\n#include "'+path(f.include,'原子类型文件')+'"\n';
  }
  ff.onGenerate(generateFF); H.topForms.forcefield={fields:f,generate:generateFF};

  const at = H.section('atomtypes','原子类型','按所选力场填写；切换混合规则不会转换已有数值。');
  const a = {};
  a.comb = field(at.body,'comb','对应的混合规则','select',{options:[{value:'1',label:'1：C6 / C12'},{value:'2',label:'2：σ / ε'},{value:'3',label:'3：σ / ε'}],default:'2'});
  const atTable=H.table(at.body,{key:'atomtypes',title:'原子类型',columns:[col('name','类型名'),col('bonded','成键类型名（可选）'),numCol('atomic','原子序数（可选）'),numCol('mass','质量','u'),numCol('charge','默认电荷','e'),col('ptype','粒子类型','select',{options:['','A','V']}),numCol('v','V'),numCol('w','W')],initialRows:1});
  const meaning=H.el('p',{},''); at.body.appendChild(meaning);
  function updateMeaning(){
    const rule=a.comb.value, rule1=rule==='1', known=['1','2','3'].includes(rule), labels=!known?['V','W']:rule1?['C6','C12']:['σ','ε'], units=!known?['单位待确认','单位待确认']:rule1?['kJ mol⁻¹ nm⁶','kJ mol⁻¹ nm¹²']:['nm','kJ/mol'];
    meaning.textContent=!known?'尚未提供混合规则，请按力场确认。':rule1?'V = C6（kJ mol⁻¹ nm⁶），W = C12（kJ mol⁻¹ nm¹²）。':'V = σ（nm），W = ε（kJ/mol）。';
    ['v','w'].forEach((key,i)=>{ const spec=atTable.columns.find(c=>c.key===key); spec.label=labels[i]; spec.unit=units[i]; const th=atTable.element.querySelectorAll('thead th')[atTable.columns.indexOf(spec)]; if(th) th.textContent=labels[i]+' ['+units[i]+']'; atTable.element.querySelectorAll('[data-key="'+key+'"]').forEach(input=>{const label=input.closest('.field').querySelector('label'); if(label) label.textContent=labels[i]+' ['+units[i]+']';}); });
  }
  f.comb.addEventListener('change',()=>{a.comb.value=f.comb.value;updateMeaning();at.body.dispatchEvent(new Event('input',{bubbles:true}));});
  a.comb.addEventListener('change',()=>{f.comb.value=a.comb.value;updateMeaning();ff.body.dispatchEvent(new Event('input',{bubbles:true}));}); updateMeaning();
  function generateAT(c) {
    if (!a.comb.value) H.fail(a.comb,'请先选择与力场一致的混合规则。');
    const seen=new Set(), data=rows(atTable); if(!data.length) H.fail(a.comb,'请至少填写一行原子类型');
    const lines=data.map(r=>{const name=tok(r,'name','类型名'); if(seen.has(name)) H.fail(r.inputs.name,'类型名重复');seen.add(name); const p=tok(r,'ptype','粒子类型'); const bonded=clean(r.inputs.bonded,'成键类型名',false); if(bonded && /\s/.test(bonded)) H.fail(r.inputs.bonded,'成键类型名不能包含空格'); const atomic=val(r,'atomic','原子序数',{required:false,integer:true,min:0}); return [name,...(bonded?[bonded]:[]),...(atomic===null?[]:[atomic]),float(r,'mass','质量',{min:0}),float(r,'charge','默认电荷'),p,float(r,'v','V',{min:0}),float(r,'w','W',{min:0})].join(' ');});
    return comment(c,a.comb.value==='1'?'V/W 为 C6/C12。':'V/W 为 sigma/epsilon。')+'[ atomtypes ]\n'+comment(c,'类型名 [成键类型名] [原子序数] 质量[u] 默认电荷[e] 粒子类型 V W')+lines.join('\n')+'\n';
  }
  at.onGenerate(generateAT); H.topForms.atomtypes={fields:a,tables:{atomtypes:atTable},generate:generateAT};

  const mol=H.section('molecule','分子定义','填写实际原子和模型需要的常见相互作用；仅支持列出的函数。');
  const m={}; m.filename=field(mol.body,'filename','建议文件名','text',{default:'molecule.itp'}); m.name=field(mol.body,'name','分子类型名','text',{required:true}); m.nrexcl=field(mol.body,'nrexcl','nrexcl','number',{required:true});
  const atoms=H.table(mol.body,{key:'atoms',title:'原子 / 位点',columns:[numCol('nr','编号'),col('type','类型'),numCol('resnr','残基号'),col('residue','残基名'),col('atom','原子名'),numCol('cgnr','电荷组号'),numCol('charge','电荷','e'),numCol('mass','质量','u')],initialRows:1});
  const blocks={};
  function block(key,title,columns,func) {
    const box=H.el('div',{},''); mol.body.appendChild(box);
    const label=H.el('label',{},''); const enabled=H.el('input',{type:'checkbox'},''); label.appendChild(enabled); label.appendChild(document.createTextNode(' 启用 '+title)); box.appendChild(label);
    const table=H.table(box,{key,title,columns,initialRows:1});
    table.element.hidden=true; enabled.addEventListener('change',()=>{table.element.hidden=!enabled.checked;});
    blocks[key]={enabled,table,func};
  }
  block('bonds','谐和键（函数 1）',[...indexCols(['i','j']),numCol('b0','平衡键长','nm'),numCol('kb','力常数','kJ/(mol nm²)')],1);
  block('angles','谐和角（函数 1）',[...indexCols(['i','j','k']),numCol('theta','平衡角','度'),numCol('ktheta','力常数','kJ/(mol rad²)')],1);
  block('dihedrals1','周期二面角（函数 1）',[...indexCols(['i','j','k','l']),numCol('phase','相位','度'),numCol('kp','系数','kJ/mol'),numCol('multiplicity','周期数')],1);
  block('dihedrals3','RB 二面角（函数 3）',[...indexCols(['i','j','k','l']),...['c0','c1','c2','c3','c4','c5'].map(k=>numCol(k,k.toUpperCase(),'kJ/mol'))],3);
  block('constraints','距离约束（函数 1）',[...indexCols(['i','j']),numCol('distance','距离','nm')],1);
  block('pairs','特殊原子对（函数 1）',indexCols(['i','j']),1);
  block('exclusions','排除（一个编号对多个编号）',[...indexCols(['i']),col('others','其他原子编号（空格分隔）')],null);
  block('position_restraints','位置限制（函数 1）',[...indexCols(['i']),...['kx','ky','kz'].map(k=>numCol(k,k,'kJ/(mol nm²)'))],1);
  block('settles','刚性三位点水 SETTLE（函数 1）',[...indexCols(['i']),numCol('doh','O–H 距离','nm'),numCol('dhh','H–H 距离','nm')],1);
  block('virtual_sites2','双构造点虚拟位点（函数 1）',[...indexCols(['s','i','j']),numCol('a','系数 a')],1);
  H.note(mol.body,'SETTLE 要求氧之后紧接两个氢；虚拟位点还须按模型处理质量和排除。位置限制需要参考坐标。');
  function generateMol(c) {
    const name=token(m.name,'分子类型名'), n=H.num(m.nrexcl,'nrexcl',{required:true,integer:true,min:0});
    const data=rows(atoms), ids=new Set(); if(!data.length) H.fail(m.name,'请至少填写一个原子');
    const atomLines=data.map((r,index)=>{const id=idx(r,'nr'); if(id!==index+1) H.fail(r.inputs.nr,'原子编号必须按行从 1 连续排列'); if(ids.has(id)) H.fail(r.inputs.nr,'原子编号重复'); ids.add(id); return [id,tok(r,'type','类型'),val(r,'resnr','残基号',{integer:true,min:1}),tok(r,'residue','残基名'),tok(r,'atom','原子名'),val(r,'cgnr','电荷组号',{integer:true,min:1}),float(r,'charge','电荷'),float(r,'mass','质量',{min:0})].join(' ');});
    const check=(r,k)=>{const x=idx(r,k);if(!ids.has(x)) H.fail(r.inputs[k],'原子编号 '+x+' 未在 atoms 中定义');return x;};
    let out=comment(c,'分子内原子编号及参数须与模型和坐标一致。')+'[ moleculetype ]\n'+comment(c,'分子类型名 nrexcl')+name+' '+n+'\n\n[ atoms ]\n'+comment(c,'编号 类型 残基号 残基名 原子名 电荷组号 电荷[e] 质量[u]')+atomLines.join('\n')+'\n';
    const specs={bonds:[['i','j'],['b0','kb']],angles:[['i','j','k'],['theta','ktheta']],dihedrals1:[['i','j','k','l'],['phase','kp','multiplicity']],dihedrals3:[['i','j','k','l'],['c0','c1','c2','c3','c4','c5']],constraints:[['i','j'],['distance']],pairs:[['i','j'],[]],position_restraints:[['i'],['kx','ky','kz']],settles:[['i'],['doh','dhh']],virtual_sites2:[['s','i','j'],['a']]};
    for(const [key,b] of Object.entries(blocks)) {
      if(!b.enabled.checked) continue; const rs=rows(b.table); if(!rs.length) continue;
      const lines=rs.map(r=>{
        if(key==='exclusions') {const i=check(r,'i'), raw=clean(r.inputs.others,'其他原子编号'); const parts=raw.split(/\s+/); if(!parts.every(x=>/^\d+$/.test(x)&&Number(x)>0&&ids.has(Number(x)))) H.fail(r.inputs.others,'请输入已定义的正整数原子编号，以空格分隔'); return [i,...parts].join(' ');}
        const [indices,params]=specs[key]; const ii=indices.map(k=>check(r,k));
        if(key==='settles' && (!ids.has(ii[0]+1)||!ids.has(ii[0]+2))) H.fail(r.inputs.i,'SETTLE 氧编号后须有两个连续氢编号');
        const pp=params.map(k=>float(r,k,k,k==='multiplicity'?{integer:true,min:1}:['b0','kb','ktheta','distance','kx','ky','kz','doh','dhh'].includes(k)?{min:0}:{}));
        return [...ii,b.func,...pp].join(' ');
      });
      const header=key.startsWith('dihedrals')?'dihedrals':key; out+='\n[ '+header+' ]\n'+comment(c, b.table.columns.map(x=>x.label+(x.unit?' ['+x.unit+']':'')).join(' ')+(b.func===null?'；首编号与后续编号之间排除非键作用':'；函数编号位于原子编号之后'))+lines.join('\n')+'\n';
    }
    return out;
  }
  mol.onGenerate(generateMol); H.topForms.molecule={fields:m,tables:{atoms},blocks,generate:generateMol};

  const top=H.section('topol','体系总拓扑','按顺序包含力场、额外全局类型和分子定义；分子顺序与坐标一致。');
  const t={}; t.route=field(top.body,'route','力场来源','select',{options:[{value:'custom',label:'自定义力场'},{value:'installed',label:'已安装标准力场'}],default:'custom'});
  t.ff=field(top.body,'ff','力场 include 路径','text',{default:'forcefield.itp',required:true}); t.types=field(top.body,'types','额外原子类型文件（可留空）');
  t.system=field(top.body,'system','体系描述','text',{required:true});
  const routeNote=H.note(top.body,'自定义力场默认使用 forcefield.itp；已安装力场填写模型名.ff/forcefield.itp。');
  t.route.addEventListener('change',()=>{const current=t.ff.value.trim(); if(t.route.value==='installed'){if(current==='forcefield.itp') t.ff.value=''; t.ff.placeholder='模型名.ff/forcefield.itp'; routeNote.textContent='已安装力场：填写实际的模型名.ff/forcefield.itp；不要重复包含自定义 defaults。';}else{if(!current) t.ff.value='forcefield.itp'; t.ff.placeholder='forcefield.itp'; routeNote.textContent='自定义力场：使用实际路径，默认 forcefield.itp。';}});
  const includes=H.table(top.body,{key:'includes',title:'分子及其他 include 文件',columns:[col('path','文件路径')],initialRows:1});
  const molecules=H.table(top.body,{key:'molecules',title:'体系分子数',columns:[col('name','分子类型名'),numCol('count','分子数')],initialRows:1});
  function generateTop(c){
    const fp=path(t.ff,'力场路径'), extra=path(t.types,'额外类型文件',false), system=clean(t.system,'体系描述');
    const inc=rows(includes).map(r=>path(r.inputs.path,'include 路径')); const mr=rows(molecules); if(!mr.length) H.fail(t.system,'请至少填写一行分子数量');
    const ml=mr.map(r=>[tok(r,'name','分子类型名'),val(r,'count','分子数',{integer:true,min:0})].join(' '));
    return comment(c,'力场只能提供一份 defaults；额外类型须先于分子定义。')+'#include "'+fp+'"\n'+(extra?'#include "'+extra+'"\n':'')+inc.map(p=>'#include "'+p+'"\n').join('')+'\n[ system ]\n'+comment(c,'体系描述')+system+'\n\n[ molecules ]\n'+comment(c,'分子类型名 分子数（按坐标顺序）')+ml.join('\n')+'\n';
  }
  top.onGenerate(generateTop); H.topForms.topol={fields:t,tables:{includes,molecules},generate:generateTop};
})(window.Helper);
