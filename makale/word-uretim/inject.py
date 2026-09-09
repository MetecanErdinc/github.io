# -*- coding: utf-8 -*-
import sys, os, re, shutil, zipfile
sys.path.insert(0, '/tmp/claude-0/-home-user-github-io/7a61d517-e6bf-5d3a-a94e-2a84c6106e16/scratchpad')
import ooxml
from shapes import sp, txt, group

DOCX = '/home/user/github.io/makale/derleme-firin-had-optimizasyonu.docx'
WORK = '/tmp/claude-0/-home-user-github-io/7a61d517-e6bf-5d3a-a94e-2a84c6106e16/scratchpad/unz'
B, O, G, GY, INK = '2A78D6', 'EB6834', '1BAF7A', 'ECECEB', '52514E'

# ---------------------------------------------------------------- grafikler
CHARTS = {}
CHARTS[1] = dict(cm=(16, 7.0), cats=['1974–1999', '2000–2009', '2010–2019', '2020–2026'],
  series=[dict(name='Kaynak sayısı', vals=[4, 8, 19, 13], color=B, labels=True, lblpos='outEnd')],
  bar_dir='col', grouping='clustered', val_title='Kaynak sayısı', gap=70, val_max=22)
CHARTS[3] = dict(cm=(16, 6.2),
  cats=['Sakin ve ark. [42] · fansız · 11–20',
        'Sakin ve ark. [42] · fanlı · 28–34',
        'Carson ve ark. [43] · fanlı · 15–40'],
  series=[dict(name='taban', vals=[11, 28, 15], color=None),
          dict(name='aralık', vals=[9, 6, 25], color=B)],
  bar_dir='bar', grouping='stacked', overlap=100, gap=70, val_max=50,
  val_title='Birleşik yüzey ısı taşınım katsayısı, h (W/m²K)')
CHARTS[4] = dict(cm=(16, 7.2),
  cats=['Ağ yakınsama belirsizliği (GCI)', 'Fanın sayısal temsili',
        'Işınım modeli (belirli ad)', 'Türbülans modeli (belirli ad)', 'Yazılım adı'],
  series=[dict(name='Açıkça bildiren', vals=[0, 5, 5, 6, 7], color=B, labels=True, lblpos='inEnd', skip=[0]),
          dict(name='Bildirmeyen veya okunamayan', vals=[19, 14, 14, 13, 12], color=GY)],
  bar_dir='bar', grouping='stacked', overlap=100, gap=60, legend='b', val_max=19,
  val_title='Çalışma sayısı (19 sayısal çalışma içinde)')

# ---------------------------------------------------------------- Şekil 2
def sekil2():
    s = []
    s.append(sp(44, 32, 588, 340, 'rect', None, 'C9C8C2', 58000))            # govde
    s.append(sp(58, 46, 560, 312, 'rect', 'FFFFFF', INK, 13000))             # kavite
    s.append(sp(60, 48, 86, 86, 'rect', 'B9B8B2', None, pattern='ltUpDiag')) # olu hacim
    s.append(sp(60, 270, 86, 86, 'rect', 'B9B8B2', None, pattern='ltUpDiag'))
    s.append(sp(96, 58, 300, 12, 'roundRect', None, O, 15000))               # rezistans
    s.append(sp(96, 334, 300, 12, 'roundRect', None, O, 15000))
    s.append(sp(104, 150, 404, 9, 'rect', INK, None))                        # tepsiler
    s.append(sp(104, 250, 404, 9, 'rect', INK, None))
    s.append(sp(700, 88, 0, 63, 'line', None, 'A9A8A2', 70000))              # hava kanali
    s.append(sp(634, 88, 66, 0, 'line', None, 'A9A8A2', 70000))
    s.append(sp(700, 253, 0, 63, 'line', None, 'A9A8A2', 70000))
    s.append(sp(634, 316, 66, 0, 'line', None, 'A9A8A2', 70000))
    s.append(sp(612, 46, 14, 312, 'rect', 'E7E6E1', INK, 10000))             # FKS
    for hy in (86, 128, 170, 250, 292):
        s.append(sp(614, hy, 10, 15, 'roundRect', 'FCFCFB', INK, 7000))
    s.append(sp(598, 181, 42, 42, 'ellipse', 'FCFCFB', INK, 10000))          # emme agzi
    s.append(sp(646, 146, 112, 112, 'ellipse', None, INK, 13000))            # fan
    s.append(sp(646, 202, 112, 0, 'line', None, B, 20000))
    s.append(sp(702, 146, 0, 112, 'line', None, B, 20000))
    s.append(sp(662, 162, 80, 80, 'line', None, B, 20000))
    s.append(sp(662, 162, 80, 80, 'line', None, B, 20000, flipH=True))
    s.append(sp(696, 196, 12, 12, 'ellipse', INK, None))
    for y0, y1 in ((93, 106), (135, 140), (177, 192), (257, 240), (299, 286)):  # jetler
        s.append(sp(512, min(y0, y1), 96, abs(y1 - y0), 'line', None, B, 15000,
                    arrow=True, flipH=True))
    s.append(sp(470, 202, 122, 0, 'line', None, INK, 15000, arrow=True, dash='dash', flipH=True))
    s.append(sp(150, 176, 56, 52, 'circularArrow', O, None, adj='<a:gd name="adj5" fmla="val 12500"/>'))
    s.append(sp(150, 262, 56, 52, 'circularArrow', O, None, adj='<a:gd name="adj5" fmla="val 12500"/>'))
    for n, x, y, c in ((1, 774, 186, B), (2, 642, 58, B), (3, 566, 316, B), (4, 528, 188, INK),
                       (5, 74, 66, '8D8C86'), (6, 210, 218, O), (7, 292, 122, INK), (8, 292, 44, O)):
        s.append(sp(x, y, 34, 34, 'ellipse', c, None, text=str(n), size=800, bold=True))
    leg = [(1, 'Sirkülasyon fanı'), (2, 'Hava kanalı'), (3, 'Fan koruma sacı (FKS)'),
           (4, 'Emme ağzı'), (5, 'Ölü hacim'), (6, 'Geri sirkülasyon'),
           (7, 'Tepsi ve raf'), (8, 'Rezistans')]
    for k, (n, lab) in enumerate(leg):
        col, row = k // 3, k % 3
        s.append(txt(40 + col * 300, 402 + row * 24, 290, 22,
                     '%d  %s' % (n, lab), size=850, color=INK, align='l'))
    s.append(txt(40, 402 + 3 * 24, 590, 22,
                 'Mavi ok: FKS deliklerinden çıkan jet · Kesikli ok: kaviteden fana dönüş',
                 size=800, color=INK, align='l'))
    return group(s, 880, 500, 16.0, 'Şekil 2')

# ---------------------------------------------------------------- Şekil 5
def sekil5():
    s = []
    cols = [(10, 'a) Türbülans modeli'), (315, 'b) Işınım modeli'), (620, 'c) Fanın sayısal temsili')]
    W = 260
    for x, title in cols:
        s.append(txt(x, 4, W, 26, title, size=950, bold=True, color='0B0B0B', align='ctr'))
    Q = ['Hangi büyüklük hedefleniyor?', 'Ortam ışınıma katılıyor mu?', 'Fan bir tasarım değişkeni mi?']
    for (x, _), q in zip(cols, Q):
        s.append(sp(x, 34, W, 44, 'roundRect', 'EEF4FC', B, 13000, text=q, size=850, color='0B0B0B'))
        s.append(sp(x + W // 2, 78, 0, 20, 'line', None, 'A9A8A2', 10000, arrow=True))
    BR = [('Kavite ortalaması\nsıcaklık', 'Ayrılma ve\nyerel ısı akısı'),
          ('Hayır:\nelektrikli fırın', 'Evet:\ngazlı fırın'),
          ('Hayır: odak\nkanal ve kavite', 'Evet: fan\ngeometrisi')]
    RES = [('k-ε ailesi\ny⁺ = 30–300\n[21], [34], [17]', 'k-ω SST\ny⁺ ≈ 1\n[13], [25]', B, B),
           ('S2S\nyüzeyler arası\n[27], [34], [44]', 'DO\nhacimsel çözüm\n[15], [26]', O, O),
           ('Momentum kaynağı\nen düşük maliyet\n[18]', 'MRF [8], [15]\nanlık jet gerekirse\nKayan Ağ', G, G)]
    for (x, _), (b1, b2), (r1, r2, c1, c2) in zip(cols, BR, RES):
        s.append(sp(x, 100, 124, 62, 'roundRect', 'FFFFFF', 'C9C8C2', 10000, text=b1, size=800, color=INK))
        s.append(sp(x + 136, 100, 124, 62, 'roundRect', 'FFFFFF', 'C9C8C2', 10000, text=b2, size=800, color=INK))
        s.append(sp(x + 62, 162, 0, 18, 'line', None, 'A9A8A2', 10000, arrow=True))
        s.append(sp(x + 198, 162, 0, 18, 'line', None, 'A9A8A2', 10000, arrow=True))
        s.append(sp(x, 182, 124, 94, 'roundRect', c1, None, text=r1, size=750, bold=True))
        s.append(sp(x + 136, 182, 124, 94, 'roundRect', c2, None, text=r2, size=750, bold=True))
    s.append(sp(305, 0, 0, 280, 'line', None, 'E6E5E0', 10000))
    s.append(sp(610, 0, 0, 280, 'line', None, 'E6E5E0', 10000))
    return group(s, 890, 284, 16.0, 'Şekil 5')

# ---------------------------------------------------------------- Şekil 6
def sekil6():
    s = []
    s.append(sp(470, 20, 150, 130, 'rect', 'F4E3DA', None))
    s.append(sp(30, 84, 570, 0, 'line', None, 'DCDCD8', 20000))
    ev = [(70, '20 Şubat 2014', 'Yürürlüğe giriş', 1, B),
          (150, '20 Şubat 2015', 'Gerekliliklerin\nuygulanmaya başlaması', -1, B),
          (470, '20 Şubat 2019', 'Sıkı kademe:\nEEI kavite < 96', 1, O)]
    for x, d, t, side, c in ev:
        s.append(sp(x - 9, 75, 18, 18, 'ellipse', c, 'FCFCFB', 10000))
        if side > 0:
            s.append(txt(x - 90, 22, 180, 16, d, size=850, bold=True, color='0B0B0B', align='ctr'))
            s.append(txt(x - 90, 38, 180, 32, t, size=800, color=INK, align='ctr'))
        else:
            s.append(txt(x - 90, 98, 180, 16, d, size=850, bold=True, color='0B0B0B', align='ctr'))
            s.append(txt(x - 90, 114, 180, 32, t, size=800, color=INK, align='ctr'))
    s.append(txt(470, 110, 150, 30, 'EEI < 96 zorunlu', size=800, color=O, align='ctr'))
    for x, lab in ((70, '2014'), (150, '2015'), (230, '2016'), (310, '2017'), (390, '2018'), (470, '2019')):
        s.append(txt(x - 30, 152, 60, 14, lab, size=800, color=INK, align='ctr'))
    return group(s, 620, 172, 16.0, 'Şekil 6')

# ---------------------------------------------------------------- paketleme
if os.path.exists(WORK): shutil.rmtree(WORK)
with zipfile.ZipFile(DOCX) as z: z.extractall(WORK)
docxml = open(WORK + '/word/document.xml', encoding='utf-8').read()
rels   = open(WORK + '/word/_rels/document.xml.rels', encoding='utf-8').read()
ct     = open(WORK + '/[Content_Types].xml', encoding='utf-8').read()

os.makedirs(WORK + '/word/charts/_rels', exist_ok=True)
os.makedirs(WORK + '/word/embeddings', exist_ok=True)
next_rid = 900
new_rels, new_ct = [], []

def chart_drawing(n, rid, cm_w, cm_h):
    return ('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="60"/></w:pPr>'
      '<w:r><w:drawing>'
      '<wp:inline distT="0" distB="0" distL="0" distR="0" '
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
      '<wp:extent cx="%d" cy="%d"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
      '<wp:docPr id="%d" name="Şekil %d"/><wp:cNvGraphicFramePr/>'
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
      '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">'
      '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="%s"/>'
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
      % (int(cm_w * 360000), int(cm_h * 360000), 3000 + n, n, rid))

for n, cfg in CHARTS.items():
    next_rid += 1
    rid = 'rId%d' % next_rid
    xml = ooxml.bar_chart(cfg['cats'], cfg['series'], bar_dir=cfg['bar_dir'],
        grouping=cfg['grouping'], val_title=cfg.get('val_title'), legend=cfg.get('legend'),
        gap=cfg.get('gap', 60), overlap=cfg.get('overlap'), val_max=cfg.get('val_max'))
    open(WORK + '/word/charts/chart%d.xml' % n, 'w', encoding='utf-8').write(xml)
    open(WORK + '/word/charts/_rels/chart%d.xml.rels' % n, 'w', encoding='utf-8').write(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/'
      'relationships/package" Target="../embeddings/veri%d.xlsx"/></Relationships>' % n)
    open(WORK + '/word/embeddings/veri%d.xlsx' % n, 'wb').write(
      ooxml.workbook_bytes(cfg['cats'], cfg['series']))
    new_rels.append('<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/'
                    '2006/relationships/chart" Target="charts/chart%d.xml"/>' % (rid, n))
    new_ct.append('<Override PartName="/word/charts/chart%d.xml" ContentType="application/vnd.'
                  'openxmlformats-officedocument.drawingml.chart+xml"/>' % n)
    new_ct.append('<Override PartName="/word/embeddings/veri%d.xlsx" ContentType="application/vnd.'
                  'openxmlformats-officedocument.spreadsheetml.sheet"/>' % n)
    cm_w, cm_h = cfg['cm']
    repl = chart_drawing(n, rid, cm_w, cm_h)
    pat = re.compile(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?\[\[SEKIL%d\]\](?:(?!</w:p>).)*?</w:p>' % n, re.S)
    docxml, k = pat.subn(lambda m: repl, docxml)
    assert k == 1, ('SEKIL%d bulunamadi' % n, k)

for n, fn in ((2, sekil2), (5, sekil5), (6, sekil6)):
    repl = fn()
    pat = re.compile(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?\[\[SEKIL%d\]\](?:(?!</w:p>).)*?</w:p>' % n, re.S)
    docxml, k = pat.subn(lambda m: repl, docxml)
    assert k == 1, ('SEKIL%d bulunamadi' % n, k)

rels = rels.replace('</Relationships>', ''.join(new_rels) + '</Relationships>')
ct = ct.replace('</Types>', ''.join(new_ct) + '</Types>')
open(WORK + '/word/document.xml', 'w', encoding='utf-8').write(docxml)
open(WORK + '/word/_rels/document.xml.rels', 'w', encoding='utf-8').write(rels)
open(WORK + '/[Content_Types].xml', 'w', encoding='utf-8').write(ct)

out = DOCX
if os.path.exists(out): os.remove(out)
zf = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for root, _, files in os.walk(WORK):
    for f in files:
        full = os.path.join(root, f)
        zf.write(full, os.path.relpath(full, WORK))
zf.close()
print('enjekte edildi:', out, '| %.1f KB' % (os.path.getsize(out) / 1024))
