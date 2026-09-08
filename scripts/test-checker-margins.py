"""Exercise real analyzer and margin rules with synthetic parsed page geometry."""
import importlib.util
from pathlib import Path
import sys
import types
import unittest
import ast

root = Path(__file__).resolve().parents[1] / "kdp-preflight-engine"
sys.path.insert(0, str(root))
parser = types.ModuleType("app.core.pdf_parser")
parser.ALLOWED_TRIM_POINTS = {(432,648)}
parser.POINTS_PER_INCH = 72
parser.parse_pdf = lambda _: parsed
sys.modules[parser.__name__] = parser
from app.core.document_analyzer import analyze_document, gutter_inches
spec = importlib.util.spec_from_file_location("margin_rules", root / "app/rules/margin_rules.py")
rules = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rules)
parsed = {}

def document(box1,box2):
    global parsed
    parsed = {"page_count":300,"pages":[{"page_number":n,"width":432,"height":648,
        "trim_box":(0,0,432,648),"text_blocks":[{"bbox":box}]} for n,box in [(1,box1),(2,box2)]]}
    return analyze_document(Path("synthetic.pdf"))

class Margins(unittest.TestCase):
    def test_python_syntax(self):
        for source in (root/'app').rglob('*.py'):
            ast.parse(source.read_text(encoding='utf-8'), filename=str(source))

    def test_image_parser_checks_each_placement(self):
        log=types.ModuleType('structlog')
        log.get_logger=lambda _: types.SimpleNamespace(warning=lambda *a,**k: None)
        sys.modules['structlog']=log
        sys.modules['fitz']=types.ModuleType('fitz')
        spec=importlib.util.spec_from_file_location('parser_under_test',root/'app/core/pdf_parser.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        class Page:
            parent=types.SimpleNamespace(extract_image=lambda _: {'width':300,'height':300,'colorspace':3,'bpc':8})
            def get_images(self, full=False): return [(42,)]
            def get_image_info(self, *, xrefs=False):
                assert xrefs
                return [{'xref':42,'bbox':[0,0,72,72]},{'xref':42,'bbox':[0,0,144,144]}]
        images=module.extract_images(Page())
        self.assertEqual([i['dpi_x'] for i in images],[300,150])
        self.assertEqual(images[0]['colorspace'],'DeviceRGB')

    def test_bleed_geometry_and_artwork(self):
        global parsed
        parsed = {"page_count":300,"pages":[{"page_number":n,"width":441,"height":666,
            "text_blocks":[{"bbox":box}],"images":[{"bbox":[0,0,441,666]}]}
            for n,box in [(1,[36,27,414,639]),(2,[27,27,405,639])]]}
        doc=analyze_document(Path('synthetic.pdf'), {'book_type':'paperback','bleed_mode':'bleed','color_mode':'bw'})
        self.assertEqual(doc['analysis']['trim_width_in'],6)
        self.assertEqual(doc['analysis']['trim_height_in'],9)
        self.assertEqual(doc['analysis']['pages'][0]['trim_rect'],(0,9,432,657))
        self.assertEqual(doc['analysis']['pages'][1]['trim_rect'],(9,9,441,657))
        self.assertEqual(rules.rule_safe_zone_validation(doc),[])
        for filename in ['page_rules','image_rules']:
            spec=importlib.util.spec_from_file_location(filename,root/f'app/rules/{filename}.py')
            module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
            if filename=='page_rules':
                self.assertEqual(module.rule_allowed_trim_sizes(doc),[])
                self.assertEqual(module.rule_bleed_validation(doc),[])
                doc['analysis']['print_options']['book_type']='hardcover'
                doc['analysis']['page_count']=74
                self.assertEqual(len(module.rule_min_page_count(doc)),1)
                doc['analysis']['page_count']=551
                self.assertEqual(len(module.rule_max_page_count(doc)),1)
            else:
                self.assertEqual(module.rule_image_bleed(doc),[])
                # Short at fore-edge must still be caught.
                doc['analysis']['pages'][0]['images'][0]['bbox']=[0,0,433,666]
                self.assertEqual(len(module.rule_image_bleed(doc)),1)

    def test_valid_mirrored_pages(self):
        doc=document([36,18,414,630],[18,18,396,630])
        self.assertEqual(rules.rule_gutter_margin(doc),[])
        self.assertEqual(rules.rule_outside_margin_min(doc),[])
        self.assertEqual(rules.rule_safe_zone_validation(doc),[])

    def test_both_inside_edges(self):
        doc=document([25,18,414,630],[18,18,407,630])
        self.assertEqual([i['page'] for i in rules.rule_gutter_margin(doc)],[1,2])
        self.assertEqual(rules.rule_outside_margin_min(doc),[])

    def test_both_outside_edges(self):
        doc=document([36,18,420,630],[12,18,396,630])
        self.assertEqual([i['page'] for i in rules.rule_outside_margin_min(doc)],[1,2])
        self.assertEqual(rules.rule_gutter_margin(doc),[])

    def test_gutter_boundaries(self):
        for count,expected in [(23,.375),(24,.375),(150,.375),(151,.5),(300,.5),
            (301,.625),(500,.625),(501,.75),(700,.75),(701,.875),(828,.875)]:
            self.assertEqual(gutter_inches(count),expected)

    def test_page_limit_matrix_uses_paper_and_color_tier(self):
        spec=importlib.util.spec_from_file_location('page_rules_matrix',root/'app/rules/page_rules.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        base={'analysis':{'page_count':777,'trim_width_in':6.0,'trim_height_in':9.0,
                          'print_options':{'book_type':'paperback','paper_type':'cream'}}}
        self.assertEqual(len(module.rule_max_page_count(base)),1)
        base['analysis']['print_options']['paper_type']='premium-color'
        self.assertEqual(module.rule_max_page_count(base),[])
        base['analysis']['print_options']={'book_type':'paperback','paper_type':'standard-color'}
        self.assertEqual(len(module.rule_max_page_count(base)),1)

    def test_broken_rule_fails_processing(self):
        logger = types.ModuleType('structlog')
        logger.get_logger = lambda _: types.SimpleNamespace(exception=lambda *a,**k: None)
        registry = types.ModuleType('app.rules')
        def broken(_): raise ValueError('internal failure')
        registry.ALL_RULES = [('TEST','test',broken)]
        sys.modules['structlog'] = logger
        sys.modules['app.rules'] = registry
        from app.core.kdp_rules_engine import run_validation
        with self.assertRaisesRegex(RuntimeError,'could not complete'):
            run_validation({})

if __name__ == '__main__': unittest.main()
