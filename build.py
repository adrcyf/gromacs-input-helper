"""Build a standalone offline HTML, using only the Python standard library."""
from pathlib import Path
import argparse

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,default=ROOT/'index.html')
args=parser.parse_args()
css=(ROOT/'src'/'style.css').read_text(encoding='utf-8')
js='\n'.join((ROOT/'src'/n).read_text(encoding='utf-8') for n in ['core.js','topology.js','gro.js','mdp.js','import.js'])
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="离线可用的中文GROMACS参数填写、文件导入与文本生成助手。"><title>GROMACS 参数填写助手</title><style>'''+css+'''</style></head><body><div class="layout"><aside><div class="eyebrow">GROMACS 2018.8</div><div class="brand">参数填写助手</div><div class="nav-title">选择要填写的文件</div><nav id="file-nav"><a href="#directory">填写目录与使用方式</a></nav><p class="sidebar-note">同一页面上下填写。<br>数值留空，方法可改。<br>ⓘ 悬停看简释，点击看详细解释。<br>关闭或刷新后不保留内容。</p></aside><main><header id="directory"><div class="eyebrow">从资料到文件</div><h1>把查到的参数，填成输入文件</h1><p>选择左侧文件，手动填写或导入已有内容，核对后生成并复制。原子、分子连接和坐标支持逐行编辑；暂时不用的区块保持关闭。defaults 的第一列 nbfunc 也可修改；更换势函数后，原子类型参数列同步变化。</p><p class="note">导入会将已支持的字段回填；额外 MDP 参数保留在可编辑表格，相互作用的其他函数可通过函数号与原始参数填写。缺项留空，未处理内容会提示；再次生成只包含已映射的内容。数值依据文献、模型与研究条件填写，可选项留空时程序可能采用默认设置。</p><p class="note">此页适用于常见经典固定拓扑模型，不是完整的GROMACS预处理器；不自动拟合参数或启动模拟。所有文件均在浏览器本地处理，不上传或保存。</p><p class="note">复制后用记事本保存为对应的 .itp、.top、.gro 或 .mdp；保存类型选“所有文件”，避免多出 .txt 扩展名。</p><div class="steps"><span>① 查资料或导入文件</span><span>② 核对字段与解释</span><span>③ 修改参数</span><span>④ 生成并复制</span></div></header><div id="sections"></div><footer>方法与单位依据 <a href="https://manual.gromacs.org/documentation/2018.8/user-guide/mdp-options.html">GROMACS 2018.8 参数文档</a>及<a href="https://manual.gromacs.org/2018-current/manual-2018.8.pdf">同版拓扑手册</a>。<br>此工具整理已知数据，不替代模型来源核实与实际预处理检查。<a href="https://github.com/adrcyf/gromacs-input-helper">源码与使用说明</a></footer></main></div><a href="#directory" class="back-top">↑ 返回目录</a><script>'''+js+'''
const names={forcefield:'forcefield.itp',atomtypes:'atomtypes.itp',molecule:'molecule.itp',topol:'topol.top',gro:'structure.gro',em:'em.mdp',nvt:'nvt.mdp',npt:'npt.mdp',production:'production.mdp'};
for(const [id,name] of Object.entries(names)){const s=Helper.sections[id];s.element.querySelector('.section-heading').append(Helper.el('div',{class:'filename'},name));const a=document.querySelector('#file-nav a[href="#'+id+'"]');a.prepend(Helper.el('small',{},name));}
</script></body></html>'''
args.output.write_bytes(page.replace('\r\n','\n').encode('utf-8'))
print('Built:',args.output.name)
