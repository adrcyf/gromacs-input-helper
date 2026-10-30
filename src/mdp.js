(() => {
  'use strict';
  const H = window.Helper;
  H.mdpForms = H.mdpForms || {};
  const definitions = [
    ['include','拓扑搜索目录','text','预处理包含目录','例如 -I../parameters；只记录参数，不自动读取外部文件。'],
    ['define','预处理宏','text','启用拓扑中的宏','例如 -DPOSRES；须与已有拓扑条件一致，不能凭空生成位置限制。'],
    ['integrator','积分算法','select','积分或最小化方法','steep 为最速下降；cg 为共轭梯度；l-bfgs 为低内存拟牛顿法。cg 和 l-bfgs 不适合含约束的模型，实际支持以 grompp 检查为准。md 为 leap-frog 积分；md-vv 为速度 Verlet 积分。'],
    ['dt','时间步','number','积分时间步','单位 ps；依据力场、最快运动和约束选择。'],
    ['nsteps','步数','number','最大迭代或模拟步数','最小化为最大迭代次数；动力学时长为 nsteps × dt。'],
    ['emtol','最大力阈值','number','最小化收敛阈值','单位 kJ mol⁻¹ nm⁻¹；按体系和后续需求选择。'],
    ['emstep','最小化步长','number','最速下降初始步长','单位 nm；依据结构与稳定性选择。'],
    ['nstcgsteep','CG 中最速下降间隔','number','CG 中穿插最速下降的步数间隔','仅用于 cg；单位步。'],
    ['nbfgscorr','L-BFGS 修正历史数','number','保留的修正步数','仅用于 l-bfgs，依据问题及算法设置。'],
    ['ld-seed','随机动力学种子','number','随机动力学随机数种子','用于 SD/BD 等随机方法；-1 表示自动生成。'],
    ['bd-fric','布朗动力学摩擦系数','number','BD 摩擦系数','单位 u/ps；0 时使用质量与 tau_t 决定摩擦。'],
    ['tcoupl','温度耦合','select','选择恒温方法','按采样目标选择；V-rescale 的 tau_t 不等同于简单温度松弛常数。'],
    ['tc-grps','温度耦合组','text','空格分隔组名','组须存在于索引中，并与每组温度参数一一对应。'],
    ['tau_t','温度耦合时间','text','每组一个正数','单位 ps；按组顺序填写，支持科学计数法。'],
    ['ref_t','参考温度','text','每组一个正数','单位 K；按组顺序和研究条件填写。'],
    ['nstenergy','能量输出间隔','number','能量文件输出步数','单位 步；0 关闭输出，按分析需求选择。'],
    ['nstlog','日志输出间隔','number','日志记录步数','单位 步；0 关闭输出。'],
    ['nstcalcenergy','能量计算间隔','number','计算能量的步数间隔','单位 步；结合输出频率和性能选择。'],
    ['nstxout','坐标输出间隔','number','完整精度坐标输出','单位 步；0 关闭输出。'],
    ['nstvout','速度输出间隔','number','速度输出','单位 步；0 关闭输出。'],
    ['nstfout','力输出间隔','number','力输出','单位 步；0 关闭输出。'],
    ['nstxout-compressed','压缩坐标间隔','number','压缩轨迹输出','单位 步；0 关闭输出，时间间隔为步数乘 dt。'],
    ['compressed-x-precision','压缩坐标精度','number','轨迹精度因子','单位 nm⁻¹；根据分析所需空间精度选择。'],
    ['comm-mode','质心运动去除','select','质心运动处理','选择是否去除线性或角动量，核对体系物理条件。'],
    ['nstcomm','质心去除间隔','number','去除质心运动的间隔','单位 步；依据积分稳定性选择。'],
    ['cutoff-scheme','邻居列表方案','select','短程邻居搜索方案','Verlet 是常见方案；结合 GROMACS 版本及力场。'],
    ['nstlist','邻居列表更新间隔','number','列表更新步数','单位 步；依据精度、时间步和性能选择。'],
    ['rlist','邻居列表距离','number','邻居搜索半径','单位 nm；Verlet 下可能由缓冲容差自动调整。'],
    ['ns-type','邻居搜索方法','select','group 方案的邻居搜索方法','grid 为网格搜索；simple 为逐原子搜索。结合边界条件及版本核对。'],
    ['verlet-buffer-tolerance','Verlet 缓冲容差','number','自动计算缓冲区的容差','单位 kJ/(mol ps)；-1 表示关闭自动缓冲计算，改用 rlist。'],
    ['coulombtype','静电方法','select','静电作用计算方法','按力场、周期性和体系选择；PME 使用长程网格。'],
    ['rcoulomb','静电截断距离','number','静电实空间截断','单位 nm；依据力场及精度选择。'],
    ['coulomb-modifier','静电截断修正','select','静电势的截断修正','Potential-shift-Verlet 按邻居列表方案选择；按模型要求设置。'],
    ['rcoulomb-switch','静电切换起点','number','静电切换的起始距离','单位 nm；仅与相应 Shift/Switch 方法配套使用。'],
    ['fourierspacing','PME 网格间距','number','目标傅里叶网格间距','单位 nm；平衡精度与计算成本。'],
    ['pme_order','PME 插值阶数','number','网格插值阶数','无量纲整数；依据目标精度和版本设置。'],
    ['ewald_rtol','Ewald 误差容差','number','实空间相对误差','无量纲；依据目标精度选择。'],
    ['epsilon_rf','反应场介电常数','number','反应场相对介电常数','无量纲；依据所用模型填写，0 表示无穷大。'],
    ['epsilon-r','相对介电常数','number','静电作用的相对介电常数','无量纲；0 表示无穷大，不自动根据溶剂名称推定。'],
    ['ewald-rtol-lj','LJ-PME 误差容差','number','LJ-PME 实空间误差容差','仅用于 vdwtype=PME，无量纲。'],
    ['lj-pme-comb-rule','LJ-PME 混合规则','select','LJ-PME 倒空间混合规则','Geometric 或 Lorentz-Berthelot；需与力场及算法设置配套。'],
    ['vdwtype','范德华方法','select','范德华作用计算方法','本工具提供常见 Cut-off；核对力场规定。'],
    ['vdw-modifier','范德华修正','select','截断附近的势或力修正','必须与力场定义一致；切换方法需要设置起始距离。'],
    ['rvdw-switch','切换起始距离','number','范德华切换区起点','单位 nm；应小于 rvdw，按力场规定填写。'],
    ['rvdw','范德华截断距离','number','范德华作用截断','单位 nm；依据力场规定填写。'],
    ['DispCorr','色散修正','select','长程色散修正','依据力场和体系是否适用选取。'],
    ['pbc','周期边界','select','边界条件','xyz 为三维周期；no 为无周期；xy 仅沿 x、y 周期。不同边界需配套邻居搜索、静电和压力设置。'],
    ['constraint-algorithm','约束算法','select','LINCS 或 SHAKE','依据拓扑、约束网络和积分方案选择。'],
    ['constraints','生成约束','select','由键生成的约束','依据力场及时间步选择；显式约束和 SETTLE 仍可生效。'],
    ['lincs-order','LINCS 阶数','number','LINCS 展开阶数','无量纲整数；依据约束网络与稳定性选择。'],
    ['lincs-iter','LINCS 修正迭代','number','LINCS 迭代次数','无量纲整数；依据约束精度选择。'],
    ['shake-tol','SHAKE 容差','number','SHAKE 相对容差','无量纲；根据约束精度和稳定性选择。'],
    ['pcoupl','压力耦合','select','压力控制方法','按阶段与系综选择；Parrinello-Rahman 可能在未平衡体系产生较大振荡。'],
    ['pcoupltype','压力耦合类型','select','盒子缩放的对称性','各向同性需 1 个，半各向同性需 2 个，各向异性需 6 个分量。'],
    ['tau_p','压力耦合时间','number','压力耦合时间常数','单位 ps；按方法和稳定性选择。'],
    ['ref_p','参考压力','text','按耦合类型填写分量','单位 bar；各向异性顺序为 xx yy zz xy xz yz。'],
    ['compressibility','压缩率','text','按耦合类型填写分量','单位 bar⁻¹；各向异性顺序为 xx yy zz xy xz yz，非对角项可为零。'],
    ['gen_vel','生成速度','select','是否生成初速度','首次初始化可生成；续接通常读取已有速度。'],
    ['gen_temp','初速度温度','number','速度分布温度','单位 K；按初始状态选择。'],
    ['gen_seed','速度随机种子','number','随机数种子','整数；-1 表示自动生成，固定种子便于复现。'],
    ['continuation','续接约束状态','select','是否按续接状态初始化','续接时通常结合上一阶段 checkpoint；此选项不自动续跑。']
  ];
  const selects = {
    tcoupl:['V-rescale','no','Berendsen','Nose-Hoover','Andersen','Andersen-massive'], 'comm-mode':['Linear','None','Angular','Linear-acceleration-correction'], 'cutoff-scheme':['Verlet','group'], 'ns-type':['grid','simple'], coulombtype:['PME','Cut-off','Reaction-field','Reaction-field-zero','Ewald','P3M-AD','Shift','Switch','Encad-Shift','User','PME-Switch','PME-User','PME-User-Switch'], 'coulomb-modifier':['Potential-shift-Verlet','Potential-shift','None'], vdwtype:['Cut-off','PME','Shift','Switch','Encad-Shift','User'], 'vdw-modifier':['Potential-shift','None','Force-switch','Potential-switch','Potential-shift-Verlet'], 'lj-pme-comb-rule':['Geometric','Lorentz-Berthelot'], DispCorr:['no','EnerPres','Ener'], pbc:['xyz','no','xy'], 'constraint-algorithm':['lincs','shake'], constraints:['none','h-bonds','all-bonds','h-angles','all-angles'], pcoupl:['no','Berendsen','Parrinello-Rahman','MTTK'], pcoupltype:['isotropic','semiisotropic','anisotropic','surface-tension'], gen_vel:['yes','no'], continuation:['no','yes']
  };
  const freq = new Set(['nstenergy','nstlog','nstcalcenergy','nstxout','nstvout','nstfout','nstxout-compressed','nstcomm','nstlist']);
  const integers = new Set([...freq,'nsteps','pme_order','lincs-order','lincs-iter','gen_seed','ld-seed','nstcgsteep','nbfgscorr']);
  const titles = {em:'能量最小化',nvt:'NVT 平衡',npt:'NPT 平衡',production:'生产采样'};
  const common = ['include','define','cutoff-scheme','nstlist','ns-type','rlist','verlet-buffer-tolerance','coulombtype','coulomb-modifier','rcoulomb','rcoulomb-switch','fourierspacing','pme_order','ewald_rtol','epsilon-r','epsilon_rf','vdwtype','vdw-modifier','rvdw-switch','rvdw','ewald-rtol-lj','lj-pme-comb-rule','DispCorr','pbc','constraint-algorithm','constraints','lincs-order','lincs-iter','shake-tol'];
  const md = ['integrator','dt','nsteps','tcoupl','tc-grps','tau_t','ref_t','nstenergy','nstlog','nstcalcenergy','nstxout','nstvout','nstfout','nstxout-compressed','compressed-x-precision','comm-mode','nstcomm'];
  const ending = ['pcoupl','pcoupltype','tau_p','ref_p','compressibility','gen_vel','gen_temp','gen_seed','continuation'];
  for (const id of Object.keys(titles)) {
    const isEM = id === 'em';
    const section = H.section(id,titles[id],'经典固定拓扑模型的常用设置；方法可选或自填，更多参数可在末尾逐行添加。数值请依据体系、力场和模拟目标填写。');
    const keys = isEM ? ['integrator','nsteps','emtol','emstep','nstcgsteep','nbfgscorr',...common] : [...md,'ld-seed','bd-fric',...common,...ending];
    const fields = {}, meta = {};
    keys.forEach(key => {
      const d = definitions.find(x => x[0] === key);
      let options = selects[key], def = '';
      if (key === 'integrator') { options = isEM ? ['steep','cg','l-bfgs'] : ['md','md-vv','md-vv-avek','sd','bd']; def = options[0]; }
      else if (options) { def = options[0]; }
      if (key === 'tc-grps') def = 'System';
      if (key === 'pcoupl' && id === 'npt') def = 'Parrinello-Rahman';
      if (key === 'gen_vel' && id !== 'nvt') def = 'no';
      if (key === 'continuation' && id !== 'nvt') def = 'yes';
      const units = {dt:'ps',emtol:'kJ mol⁻¹ nm⁻¹',emstep:'nm',tau_t:'ps',ref_t:'K',tau_p:'ps',ref_p:'bar',compressibility:'bar⁻¹',gen_temp:'K',rlist:'nm',rcoulomb:'nm',rvdw:'nm','rvdw-switch':'nm',fourierspacing:'nm'};
      fields[key] = H.field(section.body,{key,label:d[1],type:d[2],options,editable:d[2]==='select',default:def,required:['nsteps','dt','emtol'].includes(key),unit:units[key],tip:d[3],help:d[4],placeholder:d[2]==='text' && key!=='tc-grps'?'按字段说明填写':''});
      meta[key]=d;
    });
    H.note(section.body,'留空的可选参数不会写入 MDP，GROMACS 将采用其版本对应的默认值；留空不表示物理作用为零或关闭。');
    H.note(section.body,'下拉框列出 2018.8 的常见方法；“填写其他值”可保留其他方法名。选择方法不等于组合有效，User 势、特殊边界和其他算法仍需配套文件及 grompp 检查。');
    const extra=H.table(section.body,{key:'extra',title:'更多 MDP 参数（可选，按参数名逐行填写）',columns:[{key:'key',label:'参数名',tip:'填写文档中的参数名',help:'例如 nsttcouple；本表不自动验证额外参数的物理含义或版本支持。已有专用字段请在上方修改，避免重复。'},{key:'value',label:'参数值',tip:'数值、方法名或空格分隔的值',help:'按 GROMACS 2018.8 文档填写。0 和负数会原样保留；空白行不输出。'}],initialRows:1});
    function update() {
      const toggle=(key,visible)=>{if(fields[key]) H.toggle(fields[key],visible);};
      const value=key=>(fields[key]?.value||'').toLowerCase();
      if (!isEM) {
        const stochastic=['sd','bd'].includes(value('integrator'));
        const tc=stochastic || (!!fields.tcoupl.value && value('tcoupl') !== 'no'); ['tc-grps','tau_t','ref_t'].forEach(k=>toggle(k,tc)); toggle('tcoupl',!stochastic); toggle('ld-seed',stochastic); toggle('bd-fric',value('integrator')==='bd');
        const pc=!!fields.pcoupl.value && fields.pcoupl.value.toLowerCase() !== 'no'; ['pcoupltype','tau_p','ref_p','compressibility'].forEach(k=>toggle(k,pc));
        const gv=value('gen_vel') === 'yes'; ['gen_temp','gen_seed'].forEach(k=>toggle(k,gv));
      }
      const pme=/^(pme|p3m|ewald)/.test(value('coulombtype')) || value('vdwtype')==='pme'; ['fourierspacing','pme_order','ewald_rtol'].forEach(k=>toggle(k,pme));
      ['ewald-rtol-lj','lj-pme-comb-rule'].forEach(k=>toggle(k,value('vdwtype')==='pme'));
      toggle('ns-type',value('cutoff-scheme')==='group'); toggle('verlet-buffer-tolerance',value('cutoff-scheme')==='verlet');
      toggle('epsilon_rf',/^reaction-field/.test(value('coulombtype')));
      toggle('rcoulomb-switch',/shift|switch/.test(value('coulombtype')));
      toggle('rvdw-switch',['force-switch','potential-switch'].includes(value('vdw-modifier'))||['shift','switch'].includes(value('vdwtype')));
      const lin=value('constraint-algorithm') === 'lincs'; ['lincs-order','lincs-iter'].forEach(k=>toggle(k,lin)); toggle('shake-tol',value('constraint-algorithm') === 'shake');
      toggle('emstep',isEM && value('integrator') === 'steep');
      toggle('nstcgsteep',isEM && value('integrator')==='cg'); toggle('nbfgscorr',isEM && value('integrator')==='l-bfgs');
    }
    Object.values(fields).forEach(f=>f.addEventListener('change',update)); update();
    function list(key,count,kind) {
      const input=fields[key], label=meta[key][1], s=H.str(input,label,true), parts=s.split(/\s+/);
      if(count !== undefined && parts.length!==count) H.fail(input,`${label}需要 ${count} 个值。`);
      const re=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
      if(parts.some(v=>!re.test(v)||!Number.isFinite(Number(v))||(kind==='positive' && Number(v)<=0)||(kind==='nonnegative' && Number(v)<0))) H.fail(input,`${label}必须是有效的${kind==='positive'?'正数':kind==='nonnegative'?'非负数':'数字'}列表。`);
      return parts.join(' ');
    }
    function generate(comments) {
      update();
      const vals = {};
      for (const key of keys) {
        const f=fields[key]; if(f.disabled) continue;
        if (['tau_t','ref_t','ref_p','compressibility'].includes(key)) continue;
        if (meta[key][2] === 'number') {
          const required=['nsteps','dt','emtol','tau_p','gen_temp','rvdw-switch'].includes(key);
          const n=H.num(f,meta[key][1],{required,integer:integers.has(key),min:['gen_seed','ld-seed','nsteps','verlet-buffer-tolerance'].includes(key)?-1:key==='pme_order'?2:['lincs-order','nbfgscorr'].includes(key)?1:(freq.has(key)||['nstcgsteep','lincs-iter','epsilon_rf','epsilon-r','rlist','rcoulomb','rvdw','rvdw-switch','rcoulomb-switch','bd-fric'].includes(key)?0:Number.MIN_VALUE)});
          if(n!==null) vals[key]=f.value.trim();
        } else { const v=H.str(f,meta[key][1],key === 'integrator'); if(/[\r\n;<>]/.test(v)) H.fail(f,'请勿输入换行、分号或占位符。'); if(v) vals[key]=v; }
      }
      if (fields['constraint-algorithm'].value.toLowerCase() === 'lincs' && ['h-angles','all-angles'].includes(fields.constraints.value.toLowerCase())) H.fail(fields.constraints,'角约束不能使用 LINCS；请选择 SHAKE 或改为键约束。');
      if(!isEM && (['sd','bd'].includes(fields.integrator.value.toLowerCase()) || (fields.tcoupl.value && fields.tcoupl.value.toLowerCase() !== 'no'))) {
        const groups=H.str(fields['tc-grps'],meta['tc-grps'][1],true).split(/\s+/); if(groups.some(x=>!x)) H.fail(fields['tc-grps'],'请填写温度耦合组。');
        vals.tau_t=list('tau_t',groups.length,'any'); vals.ref_t=list('ref_t',groups.length,'nonnegative');
      }
      if(!isEM && fields.pcoupl.value && fields.pcoupl.value.toLowerCase() !== 'no') {
        const type=H.str(fields.pcoupltype,meta.pcoupltype[1],true).toLowerCase(); const count={isotropic:1,semiisotropic:2,anisotropic:6,'surface-tension':2}[type];
        vals.ref_p=list('ref_p',count,'any'); vals.compressibility=list('compressibility',count,'nonnegative');
      }
      if(vals['rvdw-switch']!==undefined && vals.rvdw!==undefined && Number(vals['rvdw-switch'])>=Number(vals.rvdw)) H.fail(fields['rvdw-switch'],'切换起始距离必须小于范德华截断距离。');
      const canon=s=>s.toLowerCase().replace(/[-_]/g,''), used=new Set(keys.map(canon)), lines=[];
      for(const r of extra.getRows()){
        if(!r.values.key && !r.values.value)continue;
        const key=H.str(r.inputs.key,'额外参数名',true), value=H.str(r.inputs.value,'额外参数值',true);
        if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key))H.fail(r.inputs.key,'请填写一个参数名，例如 nsttcouple。');
        if(/[\r\n;]/.test(value))H.fail(r.inputs.value,'参数值请写在同一行，注释放在文件外说明。');
        if(used.has(canon(key)))H.fail(r.inputs.key,'参数重复；已有专用字段请在上方修改。');
        used.add(canon(key));lines.push(key+' = '+value+(comments?' ; 额外参数；按 2018.8 文档核对。':''));
      }
      return [...keys.filter(k=>Object.prototype.hasOwnProperty.call(vals,k)).map(k=>`${k} = ${vals[k]}${comments?' ; '+meta[k][3]+'。'+meta[k][4]:''}`),...lines].join('\n')+'\n';
    }
    H.mdpForms[id]={fields,tables:{extra},generate,update}; section.onGenerate(generate);
  }
})();
