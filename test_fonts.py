"""Static checks for the website's web fonts (Round 16h, 29 Oct 2026; REVIEW_28OCT_R16A "font preloads with matched
fallbacks"), run with the website tests (test_website.py imports these) or alone: python website/test_fonts.py

Two promises. A page preloads only the font files its first screen draws (tools/site_fonts.py finds them in a browser and
records them in tools/site_fonts.json; these checks need no browser). And every family vestora-tokens.css serves has a
fallback face, a local system font scaled to the same average width and line box, standing right behind it in the font
stacks, so the swap to the web font moves nothing. How the swap behaves in a browser is measured with
tools/perf_probe.py (CLS, LCP, when each font arrives)."""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(os.path.dirname(ROOT), "tools")
TOKENS = os.path.join(ROOT, "assets", "vestora-tokens.css")
FONTS = os.path.join(ROOT, "assets", "fonts")
PAGES = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "*.html")))

__all__ = ["test_every_page_preloads_only_the_fonts_its_first_screen_uses",
           "test_a_font_preload_is_the_one_form_the_policy_allows_and_comes_before_the_stylesheets",
           "test_every_family_in_the_tokens_has_its_matched_fallback",
           "test_no_stylesheet_or_page_names_a_web_font_without_its_fallback"]


def _read(path):
    with open(path, encoding="utf-8", newline="") as fh:
        return fh.read().replace("\r\n", "\n")


def _record():
    with open(os.path.join(TOOLS, "site_fonts.json"), encoding="utf-8") as fh:
        return json.load(fh)


def _tokens():
    return re.sub(r"/\*.*?\*/", "", _read(TOKENS), flags=re.S)


def _faces():
    """[(family, block)] for every @font-face of the tokens."""
    out = []
    for block in re.findall(r"@font-face\s*\{(.*?)\}", _tokens(), re.S):
        fam = re.search(r"font-family:\s*'([^']+)'", block)
        out.append((fam.group(1), block))
    return out


def _ranges(text):
    out = []
    for part in text.split(","):
        part = part.strip().upper().replace("U+", "")
        if part:
            lo, _, hi = part.partition("-")
            out.append((int(lo, 16), int(hi or lo, 16)))
    return out


def _stack(var):
    m = re.search(r"%s:\s*([^;]+);" % re.escape(var), _tokens())
    assert m, var + " is not defined in the tokens"
    return [n.strip().strip("'\"") for n in m.group(1).split(",")]


def _web_families():
    return sorted({fam for fam, block in _faces() if "url(fonts/" in block})


PRELOAD = re.compile(r'<link rel="preload" href="assets/fonts/([^"]+)" as="font" type="font/woff2" crossorigin>')


def test_every_page_preloads_only_the_fonts_its_first_screen_uses():
    """The record (tools/site_fonts.json): "pages" is what a browser found in each page's first screen (python
    tools/site_fonts.py --audit), "preload" what its head carries, in that order, and never more than "pages": a preload
    of a file the first screen never draws is bandwidth taken from the stylesheet that paints it. Not all of "pages" is
    preloaded: on 30 Oct 2026 that took the home's LCP from 1576 to 2312 ms and Features' from 1132 to 1728 ms, so the
    home and Features preload nothing until an A/B says otherwise."""
    rec, audited = _record()["preload"], _record()["pages"]
    declared = {re.search(r"url\(fonts/([^)]+)\)", b).group(1) for _, b in _faces() if "url(fonts/" in b}
    assert set(rec) == set(PAGES) == set(audited), "tools/site_fonts.json and the pages differ: %s" % sorted(set(rec) ^ set(PAGES))
    assert not rec["index.html"] and not rec["features.html"], "the home and Features preload a font no A/B has cleared"
    bad = []
    for page in PAGES:
        head = _read(os.path.join(ROOT, page)).split("</head>")[0]
        got = PRELOAD.findall(head)
        if got != rec[page]:
            bad.append("%s preloads %s, its record says %s" % (page, got, rec[page]))
        if not set(got) <= set(audited[page]):
            bad.append("%s preloads %s, its first screen uses only %s" % (page, got, audited[page]))
        for f in got:
            if f not in declared or not os.path.isfile(os.path.join(FONTS, f)):
                bad.append("%s preloads %s, which no @font-face of the tokens serves" % (page, f))
        if got and "assets/vestora-tokens.css" not in head:
            bad.append("%s preloads fonts but never loads the tokens that ask for them" % page)
    assert not bad, "\n  ".join(["font preloads:"] + bad)


def test_a_font_preload_is_the_one_form_the_policy_allows_and_comes_before_the_stylesheets():
    """A font preload needs as="font", its type and crossorigin (a font request is always anonymous CORS, so without
    it the file is fetched twice), and the policy's font-src 'self' lets it through, so it is relative and local. It
    follows the policy meta (so the policy governs it) and leads the stylesheets, and no file is listed twice."""
    bad = []
    for page in PAGES:
        head = _read(os.path.join(ROOT, page)).split("</head>")[0]
        links = re.findall(r"<link\b[^>]*\brel=\"preload\"[^>]*>", head)
        fonts = [l for l in links if 'as="font"' in l]
        if len(fonts) != len(PRELOAD.findall(head)):
            bad.append("%s: a font preload that is not in the one form: %s" % (page, [l for l in fonts if not PRELOAD.fullmatch(l)]))
        files = PRELOAD.findall(head)
        if len(files) != len(set(files)):
            bad.append("%s lists a font twice" % page)
        if not files:
            continue
        csp = head.find('http-equiv="Content-Security-Policy"')
        first = head.find('<link rel="preload" href="assets/fonts/')
        sheet = head.find('<link rel="stylesheet"')
        if not 0 <= csp < first < sheet:
            bad.append("%s: the preloads must come after the policy meta and before the first stylesheet" % page)
    assert not bad, "\n  ".join(["font preloads:"] + bad)


def test_every_family_in_the_tokens_has_its_matched_fallback():
    """A web font that arrives late swaps in for the text already drawn. The fallback is a local system face (Arial,
    Courier New and their metric twins) given the web font's average width (size-adjust, measured by tools/perf_probe.py
    --fonts) and its line box (ascent, descent and line-gap overrides from the font's own metrics), so the swap moves
    nothing. Each family has one, named "<family> Fallback", with a face for every weight the pages set (the regular
    cut under 600, the bold from 600), right behind the family in --display, --sans and --mono, and it draws only
    characters the web font also draws (its unicode-range is inside the family's coverage, which leaves out the rupee
    sign: that comes from Inter's rupee cut), so a fallback never takes a character the next family would have drawn."""
    cov = _record()["coverage"]
    fams = _web_families()
    assert set(fams) == {"Inter", "Instrument Sans", "JetBrains Mono"}, "the tokens serve " + ", ".join(fams)
    stacks = {v: _stack(v) for v in ("--display", "--sans", "--mono")}
    for fam in fams:
        fb = fam + " Fallback"
        blocks = [b for f, b in _faces() if f == fb]
        assert blocks, "%s has no fallback face" % fam
        weights = set()
        for b in blocks:
            assert "url(" not in b and "local(" in b, "%s: a fallback is local() only" % fb
            m = {k: re.search(k + r":\s*([\d.]+)%", b) for k in ("size-adjust", "ascent-override", "descent-override",
                                                                    "line-gap-override")}
            assert all(m.values()), "%s needs size-adjust, ascent-override, descent-override and line-gap-override" % fb
            sa, asc, desc, gap = (float(m[k].group(1)) for k in ("size-adjust", "ascent-override", "descent-override",
                                                                 "line-gap-override"))
            assert 85 <= sa <= 125, "%s: size-adjust %s%% is not a match of Arial's width" % (fb, sa)
            assert 70 <= asc <= 120 and 10 <= desc <= 40 and gap == 0, "%s: overrides %s/%s/%s" % (fb, asc, desc, gap)
            w = re.search(r"font-weight:\s*(\d+)(?:\s+(\d+))?\s*;", b)
            assert w, "%s: a fallback face names its weight" % fb
            lo, hi = int(w.group(1)), int(w.group(2) or w.group(1))
            weights.update(range(lo, hi + 1))
            src = re.search(r"src:\s*([^;]+);", b).group(1)
            assert (lo >= 600) == ("Bold" in src), "%s %s: the bold cut is for 600 and over, the regular under it" % (fb, w.group(0))
            assert lo >= 600 or hi < 600, "%s %s mixes the regular and the bold cut" % (fb, w.group(0))
            rng = re.search(r"unicode-range:\s*([^;}]+)", b)
            assert rng, "%s must keep to the characters %s draws (unicode-range)" % (fb, fam)
            inside = _ranges(cov[fam])
            for lo, hi in _ranges(rng.group(1)):
                assert any(a <= lo and hi <= z for a, z in inside), \
                    "%s draws U+%X-%X, which %s does not" % (fb, lo, hi, fam)
                assert not lo <= 0x20B9 <= hi, "%s takes the rupee sign from Inter's rupee cut" % fb
        if fam != "JetBrains Mono":
            assert {400, 500, 600, 700} <= weights, "%s needs the weights 400, 500, 600 and 700" % fb
        named = [v for v, names in stacks.items() if fam in names]
        assert named, "%s is in no font stack of the tokens" % fam
        for v in named:
            names = stacks[v]
            assert names[names.index(fam) + 1] == fb, "%s: %s must be followed by %s, not %s" % (
                v, fam, fb, names[names.index(fam) + 1])


def test_no_stylesheet_or_page_names_a_web_font_without_its_fallback():
    """The fallback is in the three stacks (--display, --sans, --mono). A rule that writes 'Inter' or another web
    family into its own font-family would swap without one, so the families are named only in the tokens."""
    fams = _web_families()
    bad = []
    for path in sorted(glob.glob(os.path.join(ROOT, "assets", "*.css"))) + [os.path.join(ROOT, p) for p in PAGES]:
        if path == TOKENS:
            continue
        text = _read(path)
        for m in re.finditer(r"font-family\s*[:=]\s*([^;}>]*)", text):
            for fam in fams:
                if fam in m.group(1):
                    bad.append("%s names %s: %s" % (os.path.basename(path), fam, m.group(0)[:80]))
    assert not bad, "\n  ".join(["a web font written outside the tokens' stacks:"] + bad)


if __name__ == "__main__":
    for name in __all__:
        globals()[name]()
        print("ok  " + name)
