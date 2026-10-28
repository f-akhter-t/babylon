"""Builds Babylon.pptx: a 16:9 deck drawn entirely from native, editable shapes."""
import random
import sys
from lxml import etree
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE
from pptx.oxml.ns import qn

OUT = sys.argv[1]

# ---------- palette: frontend/src/index.css @theme ----------
C = dict(
    ink="101C2E", navy="101C2E", frost="E6EEF6", paper="FFFFFF", accent="3E6990",
    soft="2C3E57", muted="556A85", page="EEF2F6", mint="E6EEF6", mint_deep="CBDAEA",
    brand="A9C8E8", amber="E8BF6A", amber_dark="A9801F", good="0B6B50",
    flag_green="0B6B50", flag_green_light="4FC09A", flag_red="E4463D", alert="C8352C",
)
HEAD = "Bricolage Grotesque ExtraBold"   # --font-heading at weight 800
BODY = "Figtree"                         # --font-body

W, H = 13.333, 7.5
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(W), Inches(H)
BLANK = prs.slide_layouts[6]
TOTAL = 14


def rgb(h):
    return RGBColor.from_string(h)


def E(v):
    return Emu(int(round(v * 914400)))


def set_alpha(shape, alpha):
    """alpha 0..1 on the solid fill of a shape."""
    if alpha is None or alpha >= 1:
        return
    clr = shape.fill._xPr.find(qn("a:solidFill")).find(qn("a:srgbClr"))
    a = etree.SubElement(clr, qn("a:alpha"))
    a.set("val", str(int(alpha * 100000)))


def set_line_alpha(shape, alpha):
    ln = shape.line._get_or_add_ln()
    clr = ln.find(qn("a:solidFill")).find(qn("a:srgbClr"))
    a = etree.SubElement(clr, qn("a:alpha"))
    a.set("val", str(int(alpha * 100000)))


def no_shadow(shape):
    sp = shape._element.spPr
    if sp.find(qn("a:effectLst")) is None:
        etree.SubElement(sp, qn("a:effectLst"))


def box(shapes, x, y, w, h, fill=None, line=None, lw=0.75, shape=MSO_SHAPE.RECTANGLE,
        radius=None, alpha=None, dash=None, name=None):
    s = shapes.add_shape(shape, E(x), E(y), E(w), E(h))
    if fill:
        s.fill.solid()
        s.fill.fore_color.rgb = rgb(fill)
        set_alpha(s, alpha)
    else:
        s.fill.background()
    if line:
        s.line.color.rgb = rgb(line)
        s.line.width = Pt(lw)
        if dash:
            s.line.dash_style = dash
    else:
        s.line.fill.background()
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    no_shadow(s)
    if name:
        s.name = name
    s.text_frame.text = ""
    return s


def text(shapes, x, y, w, h, runs, size=16, color="ink", font=BODY, bold=False,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=None, line_spacing=None, name=None):
    """runs: a str, or a list of paragraphs; each paragraph a str or list of (text, overrides)."""
    tb = shapes.add_textbox(E(x), E(y), E(w), E(h))
    if name:
        tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    paras = runs if isinstance(runs, list) else [runs]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if line_spacing:
            p.line_spacing = line_spacing
        parts = para if isinstance(para, list) else [(para, {})]
        for t, ov in parts:
            r = p.add_run()
            r.text = t
            f = r.font
            f.name = ov.get("font", font)
            f.size = Pt(ov.get("size", size))
            f.bold = ov.get("bold", bold)
            f.color.rgb = rgb(C.get(ov.get("color", color), ov.get("color", color)))
            sp = ov.get("spacing", spacing)
            if sp is not None:
                r._r.get_or_add_rPr().set("spc", str(int(sp * 100)))
    return tb


def fill_text(shape, paras, size=14, color="ink", align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE,
              margin=0.08, font=BODY):
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = E(margin)
    tf.margin_top = tf.margin_bottom = E(0.04)
    tf.vertical_anchor = anchor
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        parts = para if isinstance(para, list) else [(para, {})]
        for t, ov in parts:
            r = p.add_run()
            r.text = t
            r.font.name = ov.get("font", font)
            r.font.size = Pt(ov.get("size", size))
            r.font.bold = ov.get("bold", False)
            r.font.color.rgb = rgb(C.get(ov.get("color", color), ov.get("color", color)))


def poly(shapes, pts, fill, alpha=None, name=None):
    """pts in inches."""
    fb = shapes.build_freeform(E(pts[0][0]), E(pts[0][1]), scale=1.0)
    fb.add_line_segments([(E(px), E(py)) for px, py in pts[1:]], close=True)
    s = fb.convert_to_shape()
    s.fill.solid()
    s.fill.fore_color.rgb = rgb(fill)
    set_alpha(s, alpha)
    s.line.fill.background()
    no_shadow(s)
    if name:
        s.name = name
    return s


def line(shapes, x1, y1, x2, y2, color, w=0.75, alpha=None, dash=None):
    c = shapes.add_connector(MSO_CONNECTOR.STRAIGHT, E(x1), E(y1), E(x2), E(y2))
    c.line.color.rgb = rgb(color)
    c.line.width = Pt(w)
    if dash:
        c.line.dash_style = dash
    if alpha:
        set_line_alpha(c, alpha)
    return c


def arrow(shapes, a, a_site, b, b_site, color="soft", elbow=False, w=1.5):
    kind = MSO_CONNECTOR.ELBOW if elbow else MSO_CONNECTOR.STRAIGHT
    c = shapes.add_connector(kind, 0, 0, 0, 0)
    c.begin_connect(a, a_site)
    c.end_connect(b, b_site)
    c.line.color.rgb = rgb(C[color])
    c.line.width = Pt(w)
    ln = c.line._get_or_add_ln()
    tail = etree.SubElement(ln, qn("a:tailEnd"))
    tail.set("type", "triangle")
    tail.set("w", "med")
    tail.set("len", "med")
    return c


# ---------- city decorations ----------
def pin(shapes, cx, top, h, body="flag_green", sun="flag_red", alpha=None):
    """The Babylon map pin (from Logo.jsx), drawn as a freeform teardrop with the red sun."""
    k = h / 16.0  # logo pin spans y 4..29.5 in a 32 grid (~25.5); use 16 units ~ half-size
    pts = []
    import math
    r = 9.5
    for i in range(0, 181, 10):
        a = math.radians(180 + i)
        pts.append((16 + r * math.cos(a), 13.5 + r * math.sin(a)))
    pts += [(25.5, 15.5), (22, 22), (16, 29.5), (10, 22), (6.5, 15.5)]
    sc = h / 25.5
    ox = cx - 16 * sc
    oy = top - 4 * sc
    g = shapes.add_group_shape()
    poly(g.shapes, [(ox + px * sc, oy + py * sc) for px, py in pts], C[body], alpha)
    d = 10 * sc
    s = box(g.shapes, ox + 16 * sc - d / 2, oy + 12 * sc - d / 2, d, d, fill=C[sun], shape=MSO_SHAPE.OVAL, alpha=alpha)
    g.name = "Location pin"
    return g


def hexagon(shapes, x, y, w, color, lw=1.0, alpha=None):
    s = box(shapes, x, y, w, w * 0.866, line=C[color], lw=lw, shape=MSO_SHAPE.HEXAGON)
    if alpha:
        set_line_alpha(s, alpha)
    return s


def grid(shapes, x0, y0, x1, y1, step, color="mint_deep", alpha=0.6):
    g = shapes.add_group_shape()
    x = x0
    while x <= x1 + 1e-6:
        line(g.shapes, x, y0, x, y1, C[color], 0.5, alpha)
        x += step
    y = y0
    while y <= y1 + 1e-6:
        line(g.shapes, x0, y, x1, y, C[color], 0.5, alpha)
        y += step
    g.name = "Grid lines"
    return g


def streets(shapes, x, y, w, h, color="brand", alpha=0.9, pins=True):
    """A small street-map pattern: a few roads, a roundabout and pins."""
    g = shapes.add_group_shape()
    sx, sy = w / 10.0, h / 6.0
    P = lambda px, py: (x + px * sx, y + py * sy)
    roads = [((0, 1.2), (10, 2.0)), ((0, 4.6), (10, 3.8)), ((2.2, 0), (3.0, 6)),
             ((6.8, 0), (6.2, 6)), ((0, 6), (4.5, 0)), ((8.6, 0), (10, 2.6))]
    for (a, b) in roads:
        (x1, y1), (x2, y2) = P(*a), P(*b)
        line(g.shapes, x1, y1, x2, y2, C[color], 2.25, alpha)
    for (a, b) in [((3.0, 2.9), (6.4, 2.6)), ((4.4, 4.2), (4.9, 6))]:
        (x1, y1), (x2, y2) = P(*a), P(*b)
        line(g.shapes, x1, y1, x2, y2, C[color], 1.0, alpha)
    rx, ry = P(6.5, 2.7)
    s = box(g.shapes, rx - 0.16, ry - 0.16, 0.32, 0.32, line=C[color], lw=2.25, shape=MSO_SHAPE.OVAL)
    if pins:
        px, py = P(2.75, 1.55)
        pin(g.shapes, px, py - 0.42, 0.42)
        px, py = P(7.9, 4.0)
        pin(g.shapes, px, py - 0.34, 0.34, body="accent", sun="amber")
    g.name = "Street map pattern"
    return g


def blocks(shapes, x, y, color_seq, unit=0.16, gap=0.05, alpha=None):
    """A row of building-block rectangles of rising heights."""
    g = shapes.add_group_shape()
    hs = [2, 3, 5, 4, 6, 3]
    for i, hh in enumerate(hs):
        col = color_seq[i % len(color_seq)]
        box(g.shapes, x + i * (unit + gap), y - hh * unit, unit, hh * unit, fill=C[col], alpha=alpha)
    g.name = "Building blocks"
    return g


# ---------- the Dhaka skyline (original vector silhouette) ----------
# Units: x 0..1333 (1 unit = 0.01 in at full width), y up from the ground line.
def arch_pts(x0, x1, y0, y1, steps=10):
    """A rectangle with a round top (an arch), clockwise from bottom-left."""
    import math
    cx, r = (x0 + x1) / 2, (x1 - x0) / 2
    pts = [(x0, y0), (x0, y1 - r)]
    for i in range(steps + 1):
        a = math.pi - math.pi * i / steps
        pts.append((cx + r * math.cos(a), y1 - r + r * math.sin(a)))
    pts.append((x1, y0))
    return pts


def dome_pts(cx, base, w, h, steps=14):
    """An onion-ish dome: bulges wider than its base, then tapers to a point."""
    import math
    pts = [(cx - w * 0.42, base)]
    for i in range(steps + 1):
        t = i / steps
        ang = math.pi * t
        bulge = math.sin(ang * 0.9 + 0.25) * w * 0.55
        y = base + h * (t ** 0.9)
        pts.append((cx - bulge * (1 - t) - (w * 0.02), y))
    left = pts
    right = [(2 * cx - px, py) for px, py in reversed(left)]
    return left + right


def circle_pts(cx, cy, r, steps=24):
    import math
    return [(cx + r * math.cos(2 * math.pi * i / steps), cy + r * math.sin(2 * math.pi * i / steps)) for i in range(steps)]


def skyline_shapes():
    """Returns layers: list of (layer, color_key, points, is_cutout)."""
    out = []
    R = lambda x0, x1, h, y0=0: [(x0, y0), (x0, h), (x1, h), (x1, y0)]
    rnd = random.Random(7)

    # back layer: far towers in ice blue
    x = 0
    while x < 1333:
        w = rnd.randint(28, 52)
        h = rnd.randint(95, 205)
        out.append(("back", "brand", R(x, x + w, h), False))
        if rnd.random() < 0.3:
            out.append(("back", "brand", R(x + w * 0.4, x + w * 0.55, h + 18), False))
        x += w + rnd.randint(4, 14)

    # mid layer: nearer towers in accent blue
    x = 10
    while x < 1333:
        w = rnd.randint(30, 60)
        h = rnd.randint(70, 150)
        if 455 < x < 720 or 760 < x < 905:   # keep the landmarks clear
            x += w
            continue
        out.append(("mid", "accent", R(x, x + w, h), False))
        if rnd.random() < 0.45:  # a setback crown
            out.append(("mid", "accent", R(x + w * 0.2, x + w * 0.8, h + rnd.randint(10, 26)), False))
        x += w + rnd.randint(10, 30)

    # Shaheed Minar's red sun sits behind the front layer
    out.append(("sun", "flag_red", circle_pts(830, 118, 46, 32), False))

    F = "front"
    # Ahsan Manzil: long arcaded palace on the river, central drum and dome
    out.append((F, "ink", R(30, 300, 52), False))
    out.append((F, "ink", R(40, 290, 58), False))          # parapet
    out.append((F, "ink", R(132, 208, 86), False))         # raised centre
    out.append((F, "ink", R(150, 190, 104), False))        # drum
    out.append((F, "ink", dome_pts(170, 104, 46, 40), False))
    out.append((F, "ink", R(168.5, 171.5, 156, 140), False))  # finial
    for i in range(10):   # arcade arches (cut out of the facade)
        ax = 48 + i * 24
        if 132 < ax < 200:
            continue
        out.append((F, "cut", arch_pts(ax, ax + 12, 8, 30), True))
        out.append((F, "cut", arch_pts(ax, ax + 12, 35, 48), True))
    out.append((F, "cut", arch_pts(160, 180, 0, 44), True))   # grand entrance
    out.append((F, "ink", [(118, 0), (150, 20), (190, 20), (222, 0)], False))  # front staircase

    # in-between low buildings
    for (a, b, h) in [(300, 330, 34), (330, 352, 62), (352, 390, 46), (390, 418, 120), (394, 414, 136), (418, 440, 40)]:
        out.append((F, "ink", R(a, b, h), False))
    out.append((F, "ink", R(402.5, 405.5, 160, 136), False))  # antenna

    # Jatiya Sangsad Bhaban: Kahn's assembly, massive volumes with geometric openings
    out.append((F, "ink", R(440, 720, 34), False))                 # plinth
    out.append((F, "ink", R(452, 486, 92), False))                 # outer cylinder L
    out.append((F, "ink", [(452, 92), (469, 99), (486, 92)], False))
    out.append((F, "ink", R(684, 718, 92), False))                 # outer cylinder R
    out.append((F, "ink", [(684, 92), (701, 99), (718, 92)], False))
    out.append((F, "ink", R(492, 552, 118), False))                # flank L
    out.append((F, "ink", R(616, 678, 118), False))                # flank R
    out.append((F, "ink", [(548, 0), (548, 150), (558, 160), (610, 160), (620, 150), (620, 0)], False))  # central hall
    out.append((F, "cut", circle_pts(584, 106, 19, 28), True))     # the round opening
    out.append((F, "cut", [(502, 50), (522, 92), (542, 50)], True))  # triangular openings
    out.append((F, "cut", [(626, 50), (647, 92), (668, 50)], True))
    out.append((F, "cut", R(462, 476, 74, 44), True))              # slot windows
    out.append((F, "cut", R(694, 708, 74, 44), True))
    out.append((F, "cut", arch_pts(566, 602, 0, 52, 12), True))    # semicircular entry
    # Shaheed Minar: stepped plinth, four flanking frames, the bowed central frame
    out.append((F, "ink", R(744, 916, 9), False))
    out.append((F, "ink", R(758, 902, 18), False))
    for (a, b, h) in [(770, 781, 84), (790, 802, 108), (858, 870, 108), (879, 890, 84)]:
        out.append((F, "ink", R(a, b, h, 18), False))
        out.append((F, "cut", R(a + 3.5, b - 3.5, h - 8, 26), True))
    out.append((F, "ink", R(814, 820, 132, 18), False))           # central frame uprights
    out.append((F, "ink", R(840, 846, 132, 18), False))
    for yy in (52, 82, 112):                                       # the grille bars
        out.append((F, "ink", R(814, 846, yy + 3, yy), False))
    out.append((F, "ink", [(814, 128), (846, 128), (836, 166), (802, 166), (802, 160), (832, 160), (840, 134), (814, 134)], False))  # bowed head
    # low connectors
    for (a, b, h) in [(916, 950, 28), (930, 946, 74), (1060, 1076, 44)]:
        out.append((F, "ink", R(a, b, h), False))
    # Baitul Mukarram: the cube mosque on its podium
    out.append((F, "ink", R(948, 1062, 22), False))
    out.append((F, "ink", R(960, 1050, 104, 22), False))
    out.append((F, "ink", R(955, 1055, 112, 104), False))
    out.append((F, "cut", R(962, 1048, 96, 93), True))             # the band under the parapet
    for i in range(3):
        ax = 972 + i * 26
        out.append((F, "cut", arch_pts(ax, ax + 14, 22, 60), True))
    out.append((F, "ink", R(1003.5, 1006.5, 124, 112), False))
    # modern Motijheel / Gulshan towers
    towers = [
        (1078, 1112, 214, "spire"), (1118, 1160, 168, "setback"), (1166, 1194, 190, "slant"),
        (1200, 1244, 146, "flat"), (1250, 1292, 236, "crown"), (1298, 1333, 124, "flat"),
    ]
    for (a, b, h, kind) in towers:
        if kind == "slant":
            out.append((F, "ink", [(a, 0), (a, h - 20), (b, h), (b, 0)], False))
        else:
            out.append((F, "ink", R(a, b, h), False))
        if kind == "spire":
            m = (a + b) / 2
            out.append((F, "ink", R(m - 1.5, m + 1.5, h + 34, h), False))
        if kind == "setback":
            out.append((F, "ink", R(a + 8, b - 8, h + 20), False))
        if kind == "crown":
            out.append((F, "ink", [(a + 6, h), (a + 6, h + 14), ((a + b) / 2, h + 28), (b - 6, h + 14), (b - 6, h)], False))
        for row in range(int(h // 22) - 1):   # window bands
            yy = 16 + row * 22
            out.append((F, "cut", R(a + 5, b - 5, yy + 4, yy), True))
    return out


def skyline(shapes, x0, ground, width, height, mode="full", alpha=None, page="page",
            window=(0, 1333), tint=None):
    """Draws the skyline group. mode 'full' = three tinted layers; 'faint' = one tint, no cutouts."""
    ux0, ux1 = window
    sx = width / (ux1 - ux0)
    sy = height / 240.0
    g = shapes.add_group_shape()
    colors = {"back": "brand", "mid": "accent", "front": "ink", "sun": "flag_red"}
    for layer, ckey, pts, cut in skyline_shapes():
        xs = [p[0] for p in pts]
        if max(xs) < ux0 or min(xs) > ux1:
            continue
        if mode == "faint":
            if cut or layer == "back":
                continue
            col = C[tint or "accent"]
            a = alpha if layer != "sun" else alpha * 0.9
            if layer == "sun":
                col = C["flag_red"]
        else:
            col = C[page] if cut else C[ckey]
            a = None
        poly(g.shapes, [(x0 + (px - ux0) * sx, ground - py * sy) for px, py in pts], col, a)
    g.name = "Dhaka skyline (Ahsan Manzil, Sangsad Bhaban, Shaheed Minar, Baitul Mukarram)"
    return g


def river(shapes, y, h, alpha=None):
    g = shapes.add_group_shape()
    box(g.shapes, 0, y, W, h, fill=C["ink"])
    rnd = random.Random(3)
    for i in range(14):
        lx = rnd.uniform(0.2, W - 1.6)
        ly = y + rnd.uniform(0.08, h - 0.08)
        line(g.shapes, lx, ly, lx + rnd.uniform(0.4, 1.4), ly, C["brand"], 1.0, 0.55)
    g.name = "Buriganga river band"
    return g


# ---------- shared slide furniture ----------
def bg(slide, color="page"):
    f = slide.background.fill
    f.solid()
    f.fore_color.rgb = rgb(C[color])


def pills(slide, left, right, center="BABYLON  ·  FOR BANGLADESH", dark=False):
    sh = slide.shapes
    col = "frost" if dark else "ink"
    for txt, x, al in ((left, 0.5, PP_ALIGN.CENTER), (right, None, PP_ALIGN.CENTER)):
        w = max(1.5, 0.095 * len(txt) + 0.45)
        xx = x if x is not None else W - 0.5 - w
        p = box(sh, xx, 0.32, w, 0.4, line=C[col], lw=1.0, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
        fill_text(p, [txt], size=14, color=col, margin=0.12)
        p.name = "Label pill"
    text(sh, 4.4, 0.38, W - 8.8, 0.3, center, size=14, color="muted" if not dark else "brand",
         align=PP_ALIGN.CENTER, spacing=1.5)


def faint_skyline(slide, window=(380, 1333)):
    skyline(slide.shapes, 0, H + 0.02, W, 1.25, mode="faint", alpha=0.16, window=window)


def browser_frame(shapes, x, y, w, h, label, route):
    g = shapes.add_group_shape()
    box(g.shapes, x, y, w, h, fill=C["paper"], line=C["accent"], lw=1.5,
        shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.04, dash=MSO_LINE.DASH)  # 7 = dash
    line(g.shapes, x + 0.02, y + 0.42, x + w - 0.02, y + 0.42, C["mint_deep"], 1.0)
    for i, col in enumerate(("flag_red", "amber", "flag_green_light")):
        box(g.shapes, x + 0.18 + i * 0.2, y + 0.15, 0.12, 0.12, fill=C[col], shape=MSO_SHAPE.OVAL)
    u = box(g.shapes, x + 0.85, y + 0.08, w - 1.05, 0.27, fill=C["page"], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
    fill_text(u, [route], size=14, color="muted", align=PP_ALIGN.LEFT, margin=0.12)
    icon = box(g.shapes, x + w / 2 - 0.22, y + 0.42 + (h - 0.42) / 2 - 0.55, 0.44, 0.34,
               line=C["brand"], lw=1.5, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.15)
    text(g.shapes, x + 0.25, y + 0.42 + (h - 0.42) / 2 - 0.1, w - 0.5, 0.7, [
        [("Screenshot: ", {"bold": True, "color": "accent"}), (label, {})]],
        size=14, color="soft", align=PP_ALIGN.CENTER)
    g.name = "Screenshot placeholder (browser): " + label
    return g


def phone_frame(shapes, x, y, w, h, label):
    g = shapes.add_group_shape()
    box(g.shapes, x, y, w, h, fill=C["paper"], line=C["accent"], lw=1.5,
        shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12, dash=MSO_LINE.DASH)
    box(g.shapes, x + w / 2 - 0.35, y + 0.14, 0.7, 0.12, fill=C["mint_deep"], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
    box(g.shapes, x + w / 2 - 0.22, y + h / 2 - 0.62, 0.44, 0.34, line=C["brand"], lw=1.5,
        shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.15)
    text(g.shapes, x + 0.15, y + h / 2 - 0.15, w - 0.3, 1.2, [
        [("Screenshot: ", {"bold": True, "color": "accent"}), (label, {})]],
        size=14, color="soft", align=PP_ALIGN.CENTER)
    g.name = "Screenshot placeholder (phone): " + label
    return g


def big_title(slide, words, x=0.55, y=0.85, size=80, w=None, color="ink", align=PP_ALIGN.LEFT, h=None):
    return text(slide.shapes, x, y, w or (W - 2 * x), h or size / 72 * 1.05, words, size=size, font=HEAD,
                color=color, align=align, spacing=-1.5, line_spacing=0.9)


# ---------- slides ----------
def slide_title():
    s = prs.slides.add_slide(BLANK)
    bg(s)
    grid(s.shapes, 0.5, 1.0, W - 0.5, 4.6, 0.5, alpha=0.45)
    pills(s, "Civic issue reporting  ·  Bangladesh", "Meheri  ·  Joyti  ·  Farhana  ·  Riktika",
          center="REPORT  ·  FIX  ·  VERIFY")
    text(s.shapes, 1.6, 0.95, W - 3.2, 0.8,
         "Babylon lets citizens drop a pin to report a pothole, overflowing bins or a broken street light, "
         "then follow it until it is fixed. Departments work their queue, and an admin checks every fix against its photo.",
         size=14, color="soft", align=PP_ALIGN.CENTER)
    big_title(s, "BABYLON", y=1.6, size=165, align=PP_ALIGN.CENTER, h=2.6)
    # logo mark next to the caption line
    pin(s.shapes, 6.665, 4.15, 0.5)
    river(s.shapes, H - 0.3, 0.3)
    skyline(s.shapes, 0, H - 0.3, W, 2.75)
    streets(s.shapes, 0.55, 1.0, 1.6, 1.0, alpha=0.7, pins=False)
    hexagon(s.shapes, W - 1.75, 1.05, 0.55, "accent", 1.25, 0.6)
    hexagon(s.shapes, W - 1.32, 1.42, 0.38, "flag_green_light", 1.25, 0.8)


def slide_intro():
    s = prs.slides.add_slide(BLANK)
    bg(s)
    pills(s, f"02 / {TOTAL}  ·  Introduction", "Why we built it")
    big_title(s, "WHY BABYLON", y=0.85, size=72)
    text(s.shapes, 0.6, 1.95, 7.6, 0.4, "Civic problems get reported, then lost. Babylon keeps every report visible until the fix is proven.",
         size=18, color="soft")
    cols = [
        ("The problem", "flag_red", [
            "Reports vanish with no follow-up",
            "No proof a fix really happened",
            "No view of which department is slow",
        ]),
        ("Who it's for", "flag_green", [
            "Citizens: report, vote, follow",
            "City departments: work the queue",
            "Admin: verify fixes, rank departments",
        ]),
        ("Tech stack", "accent", [
            "React 19, Vite 8, Tailwind 4",
            "Express 5, MongoDB, Mongoose",
            "JWT, Zod; Gemini + CLIP AI",
        ]),
    ]
    for i, (head, col, items) in enumerate(cols):
        x = 0.6 + i * 4.12
        card = box(s.shapes, x, 2.55, 3.92, 2.2, fill=C["paper"], line=C["mint_deep"], lw=1.0,
                   shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
        box(s.shapes, x + 0.25, 2.8, 0.34, 0.34, fill=C[col], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.25)
        text(s.shapes, x + 0.72, 2.79, 3.0, 0.4, head, size=20, font=HEAD, color="ink")
        text(s.shapes, x + 0.25, 3.32, 3.5, 1.4, [[("•  " + t, {})] for t in items], size=14, color="soft",
             line_spacing=1.15)
    hexagon(s.shapes, W - 1.45, 1.0, 0.6, "accent", 1.25, 0.5)
    hexagon(s.shapes, W - 1.9, 1.35, 0.4, "brand", 1.25, 0.9)
    river(s.shapes, H - 0.22, 0.22)
    skyline(s.shapes, 0, H - 0.22, W, 1.9)


def slide_overview(n, name, subtitle, route_pill, cards, shot=None, phone=None):
    s = prs.slides.add_slide(BLANK)
    bg(s)
    faint_skyline(s)
    pills(s, f"{n:02d} / {TOTAL}  ·  {name}", route_pill)
    big_title(s, name.upper(), y=0.82, size=72)
    text(s.shapes, 0.6, 1.88, 8.2, 0.4, subtitle, size=18, color="soft")
    # the highlight panel
    pw = 8.05 if (shot or phone) else W - 1.2
    panel = box(s.shapes, 0.55, 2.4, pw, 3.95, fill=C["ink"], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.05,
                name="Features I built panel")
    text(s.shapes, 0.85, 2.55, 4, 0.3, "FEATURES I BUILT", size=14, bold=True, color="brand", spacing=2)
    blocks(s.shapes, 0.55 + pw - 1.45, 2.88, ["brand", "accent", "flag_green_light", "amber"], unit=0.14, gap=0.05)
    cw = (pw - 0.6 - 0.15) / 2
    for i, (title, detail, col) in enumerate(cards):
        r, c = divmod(i, 2)
        x = 0.85 + c * (cw + 0.15)
        y = 2.98 + r * 1.1
        box(s.shapes, x, y, cw, 1.0, fill=C["frost"], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.1,
            name="Feature card: " + title)
        box(s.shapes, x + 0.16, y + 0.17, 0.2, 0.2, fill=C[col], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
        text(s.shapes, x + 0.48, y + 0.1, cw - 0.6, 0.3, title, size=16, bold=True, color="ink")
        text(s.shapes, x + 0.16, y + 0.44, cw - 0.3, 0.55, detail, size=14, color="accent", line_spacing=0.95)
    if shot and phone:
        browser_frame(s.shapes, 8.85, 2.4, 2.2, 3.95, shot[0], shot[1])
        phone_frame(s.shapes, 11.2, 2.4, 1.6, 3.95, phone)
    elif shot:
        browser_frame(s.shapes, 8.85, 2.4, 3.95, 3.95, shot[0], shot[1])
    return s


def slide_overview_two_frames(n, name, subtitle, route_pill, cards, shot, phone):
    s = slide_overview(n, name, subtitle, route_pill, cards)
    return s


def lanes(s, labels=("React page", "Express API", "MongoDB"), y0=1.95, lane_h=1.45):
    for i, lab in enumerate(labels):
        y = y0 + i * lane_h
        fills = ["paper", "frost", "mint_deep"]
        b = box(s.shapes, 0.55, y, W - 1.1, lane_h - 0.06, fill=C[fills[i]], shape=MSO_SHAPE.ROUNDED_RECTANGLE,
                radius=0.06, name="Lane: " + lab)
        if i == 2:
            set_alpha(b, 0.55)
        t = text(s.shapes, 0.62 - 0.55, y + lane_h / 2 - 0.17, 1.4, 0.32, lab.upper(), size=14, bold=True,
                 color="accent", align=PP_ALIGN.CENTER, spacing=1)
        t.rotation = 270
    return y0, lane_h


COLX0, PITCH, NW, NH = 1.25, 1.95, 1.78, 0.98


def node(s, lane, col, paras, kind="node", lane_geo=(1.95, 1.45), dy=0.0, h=NH, fill="paper"):
    y0, lh = lane_geo
    x = COLX0 + col * PITCH
    y = y0 + lane * lh + (lh - 0.06 - h) / 2 + dy
    styles = {
        "node": dict(fill=C["paper"], line=C["accent"], shape=MSO_SHAPE.ROUNDED_RECTANGLE, color="ink"),
        "start": dict(fill=C["ink"], line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, color="frost"),
        "db": dict(fill=C["accent"], line=None, shape=MSO_SHAPE.FLOWCHART_MAGNETIC_DISK, color="paper"),
        "decide": dict(fill=C["amber"], line=None, shape=MSO_SHAPE.DIAMOND, color="ink"),
        "end": dict(fill=C["flag_green"], line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, color="paper"),
    }[kind]
    shp = box(s.shapes, x, y, NW, h, fill=styles["fill"], line=styles["line"], lw=1.25, shape=styles["shape"],
              radius=0.18 if styles["shape"] == MSO_SHAPE.ROUNDED_RECTANGLE else None)
    out = []
    for i, p in enumerate(paras):
        if i == 0:
            out.append([(p, {"bold": True, "color": styles["color"]})])
        else:
            out.append([(p, {"color": styles["color"] if kind != "node" else "accent"})])
    fill_text(shp, out, size=14, margin=0.06 if kind != "decide" else 0.02)
    shp.name = "Step: " + " ".join(paras)
    return shp


def note(s, x, y, w, h, msg):
    b = box(s.shapes, x, y, w, h, fill=C["paper"], line=C["amber_dark"], lw=1.0, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
            radius=0.2, dash=MSO_LINE.DASH, name="Note")
    fill_text(b, [msg], size=14, color="soft", align=PP_ALIGN.LEFT, margin=0.12)
    return b


def slide_flow(n, name, title, subtitle, build):
    s = prs.slides.add_slide(BLANK)
    bg(s)
    faint_skyline(s, window=(0, 900))
    pills(s, f"{n:02d} / {TOTAL}  ·  {name}", "Flowchart")
    big_title(s, title, y=0.82, size=48, h=0.75)
    text(s.shapes, 0.6, 1.5, 11, 0.35, subtitle, size=16, color="soft")
    lanes(s)
    build(s)
    return s


# T, L, B, R connection sites
T, Lf, B, Rt = 0, 1, 2, 3


def flow_meheri(s):
    a = node(s, 0, 0, ["Admin opens", "/admin/verify"], "start")
    b = node(s, 1, 1, ["GET /admin/", "verification-queue"])
    c = node(s, 2, 1, ["issues", "awaiting check"], "db")
    d = node(s, 0, 2, ["ReviewPanel", "before / after slider"])
    e = node(s, 0, 3, ["Fix OK?"], "decide", h=1.2)
    f = node(s, 1, 4, ["POST approve", "or reject + reason"])
    g = node(s, 2, 4, ["issues", "resolved / sent back"], "db")
    h = node(s, 2, 5, ["alerts", "reporter + department"], "db")
    i = node(s, 0, 5, ["Queue refreshes", "VerifyResolutions"], "end")
    arrow(s.shapes, a, Rt, b, Lf, elbow=True)
    arrow(s.shapes, b, B, c, T)
    arrow(s.shapes, c, Rt, d, Lf, elbow=True)
    arrow(s.shapes, d, Rt, e, Lf)
    arrow(s.shapes, e, Rt, f, T, elbow=True)
    arrow(s.shapes, f, B, g, T)
    arrow(s.shapes, g, Rt, h, Lf)
    arrow(s.shapes, h, T, i, B)
    note(s, 6.15, 3.5, 1.65, 0.85 + 0.0, "No: sent back to the department")


def flow_joyti(s):
    a = node(s, 0, 0, ["ReportForm +", "LocationPicker"], "start")
    b = node(s, 1, 1, ["POST /citizen/", "reports"])
    c = node(s, 1, 2, ["severity.hook", "photo → priority"])
    d = node(s, 2, 3, ["issues", "status: open"], "db")
    e = node(s, 2, 4, ["votes", "own vote"], "db")
    f = node(s, 2, 5, ["alerts", "citizen + dept"], "db")
    g = node(s, 0, 5, ["ThankYou screen", "then /my-reports"], "end")
    arrow(s.shapes, a, Rt, b, Lf, elbow=True)
    arrow(s.shapes, b, Rt, c, Lf)
    arrow(s.shapes, c, Rt, d, Lf, elbow=True)
    arrow(s.shapes, d, Rt, e, Lf)
    arrow(s.shapes, e, Rt, f, Lf)
    arrow(s.shapes, f, T, g, B)
    note(s, COLX0 + 2 * PITCH, 2.15, 2 * PITCH - 0.17, 0.95, "Zod checks the body; if CLIP is off, priority stays 'medium'")


def flow_farhana(s):
    a = node(s, 0, 0, ["StaffSignup", "/staff/signup"], "start")
    b = node(s, 1, 1, ["POST /staff/signup", "with access code"])
    c = node(s, 2, 1, ["users", "onboarded: false"], "db")
    d = node(s, 0, 2, ["StaffProfile", "SetupChecklist"])
    e = node(s, 1, 3, ["Setup checks", "code, ID, phone, email"])
    f = node(s, 2, 3, ["emailcodes", "6-digit code"], "db")
    g = node(s, 1, 4, ["POST /staff/finish", "409 until done"])
    h = node(s, 2, 4, ["users", "onboarded: true"], "db")
    i = node(s, 0, 5, ["Panel unlocked", "new token"], "end")
    arrow(s.shapes, a, Rt, b, Lf, elbow=True)
    arrow(s.shapes, b, B, c, T)
    arrow(s.shapes, c, Rt, d, Lf, elbow=True)
    arrow(s.shapes, d, Rt, e, Lf, elbow=True)
    arrow(s.shapes, e, B, f, T)
    arrow(s.shapes, e, Rt, g, Lf)
    arrow(s.shapes, g, B, h, T)
    arrow(s.shapes, h, Rt, i, Lf, elbow=True)
    note(s, COLX0 + 3 * PITCH, 2.15, 2 * PITCH - 0.17, 0.95, "Codes, roster and access code stay on the server")


def flow_riktika(s):
    a = node(s, 0, 0, ["Citizen adds a", "photo on /report"], "start")
    b = node(s, 0, 1, ["DuplicatePanel", "checkDuplicates"])
    c = node(s, 1, 2, ["POST /reports/", "duplicates"])
    d = node(s, 2, 2, ["users", "citizen's division"], "db")
    e = node(s, 1, 3, ["CLIP", "photo → embedding"])
    f = node(s, 2, 4, ["issues", "open, same division"], "db")
    g = node(s, 1, 5, ["cosineSimilarity", "≥ minSimilarity"])
    h = node(s, 0, 5, ["Look-alikes", "shown with photos"], "end")
    arrow(s.shapes, a, Rt, b, Lf)
    arrow(s.shapes, b, Rt, c, Lf, elbow=True)
    arrow(s.shapes, c, B, d, T)
    arrow(s.shapes, d, Rt, e, Lf, elbow=True)
    arrow(s.shapes, e, Rt, f, Lf, elbow=True)
    arrow(s.shapes, f, Rt, g, Lf, elbow=True)
    arrow(s.shapes, g, T, h, B)
    note(s, COLX0 + 3 * PITCH, 2.15, 2 * PITCH - 0.17, 0.95, "No CLIP or no division: empty list, filing never blocked")


def slide_shots(n, name, title, frames):
    s = prs.slides.add_slide(BLANK)
    bg(s)
    faint_skyline(s, window=(200, 1100))
    pills(s, f"{n:02d} / {TOTAL}  ·  {name}", "Screens")
    big_title(s, title, y=0.82, size=48, h=0.75)
    x = 0.6
    for kind, label, route, w in frames:
        if kind == "browser":
            browser_frame(s.shapes, x, 1.8, w, 3.9, label, route)
        else:
            phone_frame(s.shapes, x, 1.8, w, 3.9, label)
        text(s.shapes, x, 5.85, w, 0.35, route, size=14, color="muted", align=PP_ALIGN.CENTER)
        x += w + 0.3
    return s


def slide_conclusion():
    s = prs.slides.add_slide(BLANK)
    bg(s)
    pills(s, f"{TOTAL} / {TOTAL}  ·  Conclusion", "Thank you")
    big_title(s, "WHAT WE BUILT", y=0.82, size=72)
    cols = [
        ("Achieved", "flag_green", [
            "Citizen, department, admin panels",
            "Report → fix → photo-verified close",
            "English and Bangla, light and dark",
            "42 backend + 15 frontend test files",
        ]),
        ("Deployment", "accent", [
            "Frontend + backend on Vercel",
            "MongoDB Atlas, connect on demand",
            "Gmail SMTP for email codes",
            "AI keys stay on the server",
        ]),
        ("Future work", "amber", [
            "Personal staff invites",
            "Real SMS for phone codes",
            "Host with memory for CLIP at scale",
        ]),
    ]
    for i, (head, col, items) in enumerate(cols):
        x = 0.6 + i * 4.12
        box(s.shapes, x, 2.0, 3.92, 2.75, fill=C["paper"], line=C["mint_deep"], lw=1.0,
            shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
        box(s.shapes, x + 0.25, 2.25, 0.34, 0.34, fill=C[col], shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.25)
        text(s.shapes, x + 0.72, 2.24, 3.0, 0.4, head, size=20, font=HEAD, color="ink")
        text(s.shapes, x + 0.25, 2.78, 3.5, 1.9, [[("•  " + t, {})] for t in items], size=14, color="soft",
             line_spacing=1.15)
    river(s.shapes, H - 0.22, 0.22)
    skyline(s.shapes, 0, H - 0.22, W, 1.9)


# ---------- content (from the repository) ----------
slide_title()
slide_intro()

slide_overview(3, "Meheri", "Admin panel, AI photo severity, Bangla and dark mode", "Admin  ·  F1 CLIP  ·  i18n", [
    ("Verify Resolutions", "/admin/verify · approve, reject, send-to-queue", "flag_green"),
    ("Accountability", "GET /api/admin/accountability · stats.service, Recharts", "accent"),
    ("Identity review API", "GET /api/admin/identity · POST /identity/:id/review", "amber"),
    ("F1 photo severity", "clip.service + severity.service: photo → issue priority", "flag_red"),
    ("Staff Dashboard", "StaffDashboard.jsx · /admin/dashboard", "brand"),
    ("Bangla, translate, theme", "bn.js, TranslateText · POST /api/translate · ThemeToggle", "flag_green_light"),
], shot=("Verify Resolutions before/after review", "/admin/verify"))
slide_flow(4, "Meheri", "MEHERI · VERIFY A FIX", "An admin checks a department's fix against the report photo, then the issue closes or goes back.", flow_meheri)
slide_shots(5, "Meheri", "MEHERI · SCREENS", [
    ("browser", "Accountability chart and department rows", "/admin/accountability", 4.55),
    ("browser", "Staff Dashboard counts", "/admin/dashboard", 4.55),
    ("phone", "Home in Bangla (LanguageToggle)", "/  (bn)", 2.65),
])

slide_overview(6, "Joyti", "Citizen reporting backend and the citizen screens", "Citizen API  ·  Feed  ·  F4 chat", [
    ("Report form", "ReportForm, LocationPicker · POST /api/citizen/reports", "flag_green"),
    ("My reports API", "GET, PATCH, DELETE /citizen/reports/:id", "accent"),
    ("Issue Feed + votes", "/feed · FeedCard, FeedFilters · /reports/:id/vote", "amber"),
    ("Points, levels, alerts", "LevelCard · /citizen/me, /points/earn, /alerts", "brand"),
    ("F4 help chat", "ChatWidget · POST /citizen/chat · gemini.service", "flag_red"),
    ("Reopen + F5 weekly", "OwnerReopen · WeeklySummaryCard · /summary/weekly", "flag_green_light"),
], shot=("report submission form", "/report"))
slide_flow(7, "Joyti", "JOYTI · FILE A REPORT", "A citizen's report travels through validation and AI scoring into three collections.", flow_joyti)
slide_shots(8, "Joyti", "JOYTI · SCREENS", [
    ("browser", "Issue Feed with filters and votes", "/feed", 4.55),
    ("browser", "My Reports with LevelCard", "/my-reports", 4.55),
    ("phone", "Help chat (ChatWidget) open", "any citizen page", 2.65),
])

slide_overview(9, "Farhana", "Map, issue pages, accounts and the AI report assistant", "Map  ·  Auth  ·  F6 / F8", [
    ("Map page", "/map · IssueMap, DropPin, PinLayer · GET /api/issues", "flag_green"),
    ("Issue detail + edit", "ProgressCard, IssueMiniMap · /issues/:id/edit", "accent"),
    ("Sign-in + passwords", "/api/auth login, signup · forgot/reset by email code", "amber"),
    ("Staff setup", "StaffSignup, SetupChecklist · /api/auth/staff/*", "brand"),
    ("Profile + ID review", "/profile PhoneCard, IdentityCard · /admin/identity", "flag_red"),
    ("F6 assist + F8 summarize", "AssistPanel, SummarizeButton · /reports/assist", "flag_green_light"),
], shot=("Map page with pins and sidebar", "/map"))
slide_flow(10, "Farhana", "FARHANA · STAFF SIGN-UP AND SETUP", "A new staff account proves who it is, step by step, before its panel opens.", flow_farhana)
slide_shots(11, "Farhana", "FARHANA · SCREENS", [
    ("browser", "Issue detail with progress steps", "/issues/:id", 4.55),
    ("browser", "Staff setup checklist", "/department/profile", 4.55),
    ("phone", "Report assistant panel (AssistPanel)", "/report", 2.65),
])

slide_overview(12, "Riktika", "Project foundation, Home page, department and profile APIs", "Home  ·  Dept API  ·  F2", [
    ("Project foundation", "Vite, Tailwind, router · Button, StatusPill, /styleguide", "flag_green"),
    ("Home page", "HeroSlider, StatsRow, HowItWorks, FixedThisWeek", "accent"),
    ("Backend foundation", "app.js, routes.js · authenticate, authorize, JWT", "amber"),
    ("Department API", "/department/issues · start work · submit fix", "brand"),
    ("Citizen profile API", "/citizen/profile · phone code · identity submit", "flag_red"),
    ("F2 duplicate check", "DuplicatePanel · /reports/duplicates · CLIP", "flag_green_light"),
], shot=("Home page hero slider", "/"), phone="DuplicatePanel on /report")
slide_flow(13, "Riktika", "RIKTIKA · F2 DUPLICATE PHOTO CHECK", "Before a report is filed, its photo is compared with open reports nearby.", flow_riktika)

slide_conclusion()

prs.save(OUT)
print("saved", OUT, len(prs.slides._sldIdLst), "slides")
