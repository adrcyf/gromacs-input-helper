import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class BrowserRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        candidates = [Path(p) / 'Microsoft/Edge/Application/msedge.exe' for p in (r'C:\Program Files (x86)', r'C:\Program Files')]
        edge = next((p for p in candidates if p.exists()), None)
        cls.browser = cls.pw.chromium.launch(headless=True, **({'executable_path': str(edge)} if edge else {}))

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto((ROOT / 'index.html').as_uri())

    def tearDown(self):
        self.page.close()
        self.assertEqual(self.errors, [])

    def js(self, code, arg=None):
        return self.page.evaluate(code, arg)

    def imp(self, section, text, filename=''):
        return self.js('x => Helper.importText(x.id,x.text,x.filename)', dict(id=section, text=text, filename=filename))

    def test_initial_and_refresh(self):
        self.assertEqual(self.js('Object.keys(Helper.sections).length'), 9)
        self.assertNotIn('第1周', self.page.locator('body').inner_text())
        self.assertEqual(self.js('Object.values(Helper.mdpForms).flatMap(f=>Object.values(f.fields)).filter(x=>x.type==="number" && x.value!=="").length'), 0)
        self.imp('nvt', 'dt = 0.5\nnsteps = 100')
        self.page.reload()
        self.assertEqual(self.js('Helper.mdpForms.nvt.fields.dt.value'), '')

    def test_mdp_partial_dedup_unknown_and_raw_select(self):
        self.imp('nvt', 'dt=0.5\nnsteps=100')
        result = self.imp('nvt', 'integrator = unusual-method\nnst_log = 10\nnst-log = 20\nunknown-thing = 3')
        self.assertTrue(result['ok'])
        self.assertTrue(any('重复' in w for w in result['warnings']))
        self.assertEqual(self.js('Helper.mdpForms.nvt.tables.extra.getRows()[0].values'), {'key': 'unknown-thing', 'value': '3'})
        self.assertEqual(self.js('Helper.mdpForms.nvt.fields.dt.value'), '')
        self.assertEqual(self.js('Helper.mdpForms.nvt.fields.nsteps.value'), '')
        self.assertEqual(self.js('Helper.mdpForms.nvt.fields["nstlog"].value'), '20')
        self.assertEqual(self.js('Helper.mdpForms.nvt.fields.integrator.value'), 'unusual-method')
        self.assertIsNone(self.js('Helper.sections.nvt.generate()'))

    def test_extra_mdp_parameter_is_editable_and_exported(self):
        result = self.imp('em', 'integrator=steep\nnsteps=10\nemtol=100\ncustom-option=0\n')
        self.assertTrue(result['ok'], result)
        self.js("Helper.mdpForms.em.tables.extra.getRows()[0].inputs.value.value = '42'")
        self.assertIn('custom-option = 42', self.js('Helper.sections.em.generate()'))

    def test_mdp_methods_custom_value_and_zero(self):
        self.assertTrue(self.imp('em', 'integrator=steep\nnsteps=0\nemtol=100\ncutoff-scheme=group\nns-type=simple\npbc=no\n')['ok'])
        field = self.page.locator('#em [data-key="coulombtype"]').locator('..')
        field.get_by_role('button', name='填写其他值…').click()
        field.get_by_label('静电方法：其他值').fill('custom-method')
        field.get_by_role('button', name='使用此值').click()
        output = self.js('Helper.sections.em.generate()')
        for line in ('nsteps = 0', 'cutoff-scheme = group', 'ns-type = simple', 'pbc = no', 'coulombtype = custom-method'):
            self.assertIn(line, output)
        self.assertEqual(self.js("[...document.querySelectorAll('#em select')].filter(e => !e.closest('.field').querySelector('.method-edit')).length"), 0)

    def test_mdp_duplicate_extra_and_unknown_only_rejected(self):
        self.assertTrue(self.imp('em', 'integrator=steep\nnsteps=10\nemtol=100')['ok'])
        self.js("Helper.mdpForms.em.tables.extra.set([{key:'nsteps', value:'5'}])")
        self.assertIsNone(self.js('Helper.sections.em.generate()'))
        self.assertFalse(self.imp('em', 'unknown-parameter=123')['ok'])
        self.assertEqual(self.js('Helper.mdpForms.em.fields.nsteps.value'), '10')

    def test_atomtype_columns_follow_nbfunc_for_new_rows(self):
        table = self.page.locator('#atomtypes [data-table="atomtypes"]')
        self.js("Helper.topForms.atomtypes.fields.nbfunc.value='2'; Helper.topForms.atomtypes.fields.nbfunc.dispatchEvent(new Event('change',{bubbles:true}))")
        table.get_by_role('button', name='＋ 添加一行').click()
        state = self.js("""() => {const t=Helper.topForms.atomtypes.tables.atomtypes; const row=t.getRows().at(-1); return Object.fromEntries(['v','w','a','b','c'].map(k=>[k,row.inputs[k].closest('td').hidden]));}""")
        self.assertEqual(state, {'v':True, 'w':True, 'a':False, 'b':False, 'c':False})
        self.js("Helper.topForms.atomtypes.fields.nbfunc.value='1'; Helper.topForms.atomtypes.fields.nbfunc.dispatchEvent(new Event('change',{bubbles:true}))")
        state = self.js("""() => {const t=Helper.topForms.atomtypes.tables.atomtypes; const row=t.getRows().at(-1); return Object.fromEntries(['v','w','a','b','c'].map(k=>[k,row.inputs[k].closest('td').hidden]));}""")
        self.assertEqual(state, {'v':False, 'w':False, 'a':True, 'b':True, 'c':True})

    def test_rejections_preserve_form(self):
        self.imp('forcefield', '[ defaults ]\n1 2 no 0 1\n')
        before = self.js('Helper.topForms.forcefield.fields.lj.value')
        self.assertFalse(self.imp('forcefield', 'integrator = md\ndt = 0.002')['ok'])
        self.assertFalse(self.imp('forcefield', '#ifdef X\n[ defaults ]\n1 2 no 1 1\n#endif')['ok'])
        self.assertEqual(self.js('Helper.topForms.forcefield.fields.lj.value'), before)
        self.imp('molecule', '[ moleculetype ]\nCO2 3\n[ atoms ]\n1 C 1 CO2 C 1 0 12')
        self.assertFalse(self.imp('molecule', '[ moleculetype ]\nA 3\n[ moleculetype ]\nB 3')['ok'])
        self.assertEqual(self.js('Helper.topForms.molecule.fields.name.value'), 'CO2')
        self.imp('topol', '[ system ]\nKeep me\n[ molecules ]\nWAT 1')
        self.assertFalse(self.imp('topol', '#include \"atomtypes.itp\"\n[ defaults ]\n1 2 no 1 1')['ok'])
        self.assertEqual(self.js('Helper.topForms.topol.fields.system.value'), 'Keep me')

    def test_forcefield_and_atomtypes(self):
        text = '[ defaults ]\n1 2 no 0 1\n[ atomtypes ]\nC 12 0 A 0.3 0.2\nO 8 16 -0.5 A 0.2 0\nV dummy 0 0 0 V 0 0\n'
        result = self.imp('forcefield', text)
        self.assertTrue(result['ok'])
        self.assertIn('atomtypes', result['updated'])
        self.assertEqual(self.js('Helper.topForms.forcefield.fields.include.value'), 'atomtypes.itp')
        self.assertEqual(self.js('Helper.topForms.atomtypes.fields.comb.value'), '2')
        rows = self.js('Helper.topForms.atomtypes.tables.atomtypes.getRows().map(r=>r.values)')
        self.assertEqual([(r['bonded'],r['atomic']) for r in rows], [('', ''), ('','8'), ('dummy','0')])
        self.assertEqual(rows[1]['charge'], '-0.5')
        self.assertEqual(rows[2]['mass'], '0')
        self.assertIn('V dummy 0 0 0 V 0 0', self.js('Helper.sections.atomtypes.generate()'))
        self.assertIn('#include "atomtypes.itp"', self.js('Helper.sections.forcefield.generate()'))
        self.assertTrue(self.imp('atomtypes', text)['ok'])
        self.assertEqual(self.js('Helper.topForms.atomtypes.fields.comb.value'), '2')

    def test_molecule_blocks_and_unsupported(self):
        text = '''[ moleculetype ]
WAT 2
[ atoms ]
1 O 1 WAT O 1 -0.8 16
2 H 1 WAT H 1 0.4 1
3 H 1 WAT H2 1 0.4 1
4 V 1 WAT M 1 0 0
[ constraints ]
1 2 1 0.1
1 3 9 0.1
[ virtual_sites2 ]
4 2 3 1 0.5
'''
        result = self.imp('molecule', text, 'water.itp')
        self.assertTrue(result['ok'])
        self.assertEqual(self.js('Helper.topForms.molecule.fields.filename.value'), 'water.itp')
        self.assertTrue(self.js('Helper.topForms.molecule.blocks.constraints.enabled.checked'))
        self.assertTrue(self.js('Helper.topForms.molecule.blocks.virtual_sites2.enabled.checked'))
        out = self.js('Helper.sections.molecule.generate()')
        self.assertIn('1 2 1 0.1', out)
        self.assertIn('4 2 3 1 0.5', out)
        self.assertIn('1 3 9 0.1', out)

    def test_buckingham_defaults_and_atomtypes_round_trip(self):
        text = """[ defaults ]
2 2 no 0 1 0
[ atomtypes ]
X 12 0 A 0 2 3
Y 8 16 -0.5 A 4 5 6
Z bonded 6 12 0 A 7 8 9
"""
        result = self.imp('forcefield', text)
        self.assertTrue(result['ok'], result)
        self.assertEqual(self.js('Helper.topForms.forcefield.fields.nbfunc.value'), '2')
        self.assertEqual(self.js('Helper.topForms.atomtypes.fields.nbfunc.value'), '2')
        self.assertEqual(self.js('Helper.topForms.forcefield.fields.rep.value'), '0')
        self.assertIn('2 2 no 0 1 0', self.js('Helper.sections.forcefield.generate()'))
        output = self.js('Helper.sections.atomtypes.generate()')
        for line in ('X 12 0 A 0 2 3', 'Y 8 16 -0.5 A 4 5 6', 'Z bonded 6 12 0 A 7 8 9'):
            self.assertIn(line, output)
        self.js("Helper.topForms.atomtypes.tables.atomtypes.getRows()[0].inputs.a.value = '10'")
        self.assertIn('X 12 0 A 10 2 3', self.js('Helper.sections.atomtypes.generate()'))
        self.assertTrue(self.imp('forcefield', '[ defaults ]\n1 2 no 0 1\n#include \"atomtypes.itp\"\n')['ok'])
        self.assertEqual(self.js('Helper.topForms.forcefield.fields.rep.value'), '')
        self.assertIn('1 2 no 0 1\n', self.js('Helper.sections.forcefield.generate()'))

    def test_molecule_other_functions_and_b_state_round_trip(self):
        text = """[ moleculetype ]
M 3
[ atoms ]
1 C 1 M C 1 0 12 CB 0 0
2 C 1 M C2 1 0 12
[ bonds ]
1 2 2 0.1 200
1 2 99 0 42
"""
        self.assertTrue(self.imp('molecule', text)['ok'])
        rows = self.js('Helper.topForms.molecule.blocks.bonds.table.getRows().map(r=>r.values)')
        self.assertEqual([(r['func'], r['params']) for r in rows], [('2', '0.1 200'), ('99', '0 42')])
        output = self.js('Helper.sections.molecule.generate()')
        for line in ('1 C 1 M C 1 0 12 CB 0 0', '2 C 1 M C2 1 0 12', '1 2 2 0.1 200', '1 2 99 0 42'):
            self.assertIn(line, output)
        self.js("Helper.topForms.molecule.blocks.bonds.table.getRows()[1].inputs.params.value = '0 43'")
        self.assertIn('1 2 99 0 43', self.js('Helper.sections.molecule.generate()'))

    def test_bonds_without_explicit_parameters_use_type_lookup(self):
        text = """[ moleculetype ]
M 3
[ atoms ]
1 C 1 M C 1 0 12
2 C 1 M C2 1 0 12
[ bonds ]
1 2 5
1 2 1
"""
        self.assertTrue(self.imp('molecule', text)['ok'])
        rows = self.js('Helper.topForms.molecule.blocks.bonds.table.getRows().map(r=>r.values)')
        self.assertEqual([r['paramSource'] for r in rows], ['lookup', 'lookup'])
        output = self.js('Helper.sections.molecule.generate()')
        self.assertIn('1 2 5\n', output)
        self.assertIn('1 2 1\n', output)

    def test_lowercase_pme_retains_related_parameters(self):
        result = self.imp('em', 'integrator=steep\nnsteps=10\nemtol=100\ncoulombtype=pme\nfourierspacing=0.12\npme_order=4\newald_rtol=1e-5\n')
        self.assertTrue(result['ok'], result)
        output = self.js('Helper.sections.em.generate()')
        for line in ('coulombtype = pme', 'fourierspacing = 0.12', 'pme_order = 4', 'ewald_rtol = 1e-5'):
            self.assertIn(line, output)

    def test_topol_paths_and_partial(self):
        result = self.imp('topol', '#include "ff/forcefield.itp"\n#include "water.itp"\n[ system ]\nWater\n[ molecules ]\nWAT 0\n')
        self.assertTrue(result['ok'])
        self.assertTrue(any('不读取' in w for w in result['warnings']))
        out = self.js('Helper.sections.topol.generate()')
        self.assertIn('#include "water.itp"', out)
        self.assertIn('WAT 0', out)
        self.imp('molecule', '[ moleculetype ]\nCO2 3\n[ atoms ]\n1 C 1 CO2 C 1')
        self.assertEqual(self.js('Helper.topForms.molecule.tables.atoms.getRows()[0].values.mass'), '')
        self.assertIsNone(self.js('Helper.sections.molecule.generate()'))

    def test_gro_precision_velocity_and_box(self):
        atom = f'{1:5d}{"WAT":<5}{"O":>5}{1:5d}' + ''.join(f'{x:9.4f}' for x in (0.1,-0.2,0.3)) + ''.join(f'{x:9.5f}' for x in (0.0,-0.01,0.02))
        result = self.imp('gro', 'Water\n1\n' + atom + '\n2 2 2 0 0 0 0 0 0\n')
        self.assertTrue(result['ok'], result)
        self.assertEqual(self.js('Helper.groForm.fields.precision.value'), '4')
        self.assertEqual(self.js('Helper.groForm.fields.velocity.value'), 'yes')
        self.assertEqual(self.js('Helper.groForm.fields.boxType.value'), '9')
        self.assertIn('-0.01000', self.js('Helper.sections.gro.generate()'))

    def test_paste_info_and_copy(self):
        section = self.page.locator('#forcefield')
        section.get_by_label('粘贴文件内容').fill('[ defaults ]\n1 2 no 0 1\n#include "atomtypes.itp"\n')
        section.get_by_role('button', name='导入内容').click()
        self.assertIn('已导入', section.locator('.import-panel [aria-live]').inner_text())
        info = section.locator('.info').first
        info.click()
        self.assertEqual(info.get_attribute('aria-expanded'), 'true')
        self.assertTrue(self.page.locator('#' + info.get_attribute('aria-controls')).is_visible())
        self.js("Object.defineProperty(navigator, 'clipboard', {value:{writeText:async t=>window.__copied=t}, configurable:true})")
        section.get_by_role('button', name='生成内容').click()
        section.get_by_role('button', name='复制内容').click()
        self.page.wait_for_function('window.__copied !== undefined')
        self.assertIn('[ defaults ]', self.js('window.__copied'))

if __name__ == '__main__':
    unittest.main(verbosity=2)

