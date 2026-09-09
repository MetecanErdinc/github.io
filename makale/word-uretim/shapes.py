# -*- coding: utf-8 -*-
"""Yerlesik Word sekil grubu (wpg:wgp + wps:wsp) uretici."""
from xml.sax.saxutils import escape
A   = 'http://schemas.openxmlformats.org/drawingml/2006/main'
WPG = 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup'
WPS = 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape'
WP  = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
W   = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
_id = [2000]
def nid():
    _id[0] += 1; return _id[0]

def _txbx(text, size, bold, color, align):
    jc = {'ctr': 'center', 'l': 'left', 'r': 'right'}[align]
    ps = []
    for t in text.split('\n'):
        ps.append(
          '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>'
          '<w:jc w:val="%s"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'
          '<w:b w:val="%s"/><w:color w:val="%s"/><w:sz w:val="%d"/></w:rPr></w:pPr>'
          '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>'
          '<w:b w:val="%s"/><w:color w:val="%s"/><w:sz w:val="%d"/></w:rPr>'
          '<w:t xml:space="preserve">%s</w:t></w:r></w:p>'
          % (jc, str(bool(bold)).lower(), color, max(2, round(size / 50)),
             str(bool(bold)).lower(), color, max(2, round(size / 50)), escape(t)))
    return ('<wps:txbx><w:txbxContent xmlns:w="%s">%s</w:txbxContent></wps:txbx>' % (W, ''.join(ps)))

def sp(x, y, w, h, prst='rect', fill=None, line=None, lw=12700, text=None,
       size=900, bold=False, color='FFFFFF', align='ctr', anchor='ctr',
       arrow=False, dash=None, pattern=None, rot=None, adj='', flipH=False):
    if pattern:
        f = ('<a:pattFill prst="%s"><a:fgClr><a:srgbClr val="%s"/></a:fgClr>'
             '<a:bgClr><a:srgbClr val="FFFFFF"/></a:bgClr></a:pattFill>' % (pattern, fill or 'B9B8B2'))
    elif fill:
        f = '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>' % fill
    else:
        f = '<a:noFill/>'
    if line:
        ends = '<a:tailEnd type="triangle" w="med" len="med"/>' if arrow else ''
        d = '<a:prstDash val="%s"/>' % dash if dash else ''
        l = '<a:ln w="%d" cap="rnd"><a:solidFill><a:srgbClr val="%s"/></a:solidFill>%s%s</a:ln>' % (lw, line, d, ends)
    else:
        l = '<a:ln><a:noFill/></a:ln>'
    attrs = ''
    if rot:   attrs += ' rot="%d"' % rot
    if flipH: attrs += ' flipH="1"'
    tx = _txbx(text, size, bold, color, align) if text is not None else ''
    isbox = text is not None and prst == 'rect' and not fill and not line
    return ('<wps:wsp><wps:cNvPr id="%d" name="Sekil-%d"/><wps:cNvSpPr%s/>'
            '<wps:spPr><a:xfrm%s><a:off x="%d" y="%d"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
            '<a:prstGeom prst="%s"><a:avLst>%s</a:avLst></a:prstGeom>%s%s</wps:spPr>%s'
            '<wps:bodyPr rot="0" anchor="%s" lIns="9000" tIns="0" rIns="9000" bIns="0" '
            'wrap="square"><a:noAutofit/></wps:bodyPr></wps:wsp>'
            % (nid(), nid(), ' txBox="1"' if isbox else '', attrs, x, y, w, h,
               prst, adj, f, l, tx, anchor))

def txt(x, y, w, h, text, size=900, bold=False, color='52514E', align='l'):
    return sp(x, y, w, h, 'rect', None, None, text=text, size=size, bold=bold,
              color=color, align=align)

def group(shapes, cw, ch, cm_w, name):
    EMU = 360000
    cx = int(cm_w * EMU); cy = int(cm_w * ch / cw * EMU)
    return ('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="60"/></w:pPr>'
      '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="%s">'
      '<wp:extent cx="%d" cy="%d"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
      '<wp:docPr id="%d" name="%s"/><wp:cNvGraphicFramePr/>'
      '<a:graphic xmlns:a="%s"><a:graphicData uri="%s">'
      '<wpg:wgp xmlns:wpg="%s" xmlns:wps="%s"><wpg:cNvGrpSpPr/><wpg:grpSpPr>'
      '<a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/>'
      '<a:chOff x="0" y="0"/><a:chExt cx="%d" cy="%d"/></a:xfrm></wpg:grpSpPr>%s</wpg:wgp>'
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
      % (WP, cx, cy, nid(), name, A, WPG, WPG, WPS, cx, cy, cw, ch, ''.join(shapes)))
