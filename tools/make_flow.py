# English user flow, same topology as the original image5.png.
# Writes the overview and three close-ups (same drawing, different viewBox).
import sys, os
out = sys.argv[1]
INK, PAPER, PAPER2, TEAL, TEALBG, MUTED = "#23201b", "#fffdf8", "#ece3cf", "#14988a", "#d6eeea", "#7a7164"
FONT = "Newsreader 16pt"
X0, DX = 130, 240
R = {0: 80, 1: 205, 2: 330, 3: 450}
W, H, DW, DH = 205, 92, 215, 112
FS, LH = 23, 27
def cx(c): return X0 + c * DX
N = {}
def node(k, c, r, text, kind="user"):
    N[k] = dict(x=cx(c), y=R[r], t=text, kind=kind)
node("A1", 0, 2, "Plan a trip"); node("A2", 1, 2, "Find travel companions")
node("D1", 2, 2, "Existing group chat?", "dec"); node("A3", 2, 0, "Use the existing group"); node("A4", 2, 3, "Create a new group")
node("A5", 3, 2, "Invite Waymark with @Waymark")
node("D2", 4, 2, "Let it read the chat?", "dec"); node("A6", 4, 0, "Ask what it may read", "bot"); node("A7", 4, 3, "Stop using Waymark")
node("B1", 5, 0, "From now on: new messages only"); node("B3", 5, 2, "Include earlier messages")
node("B2", 6, 0, "Organize new messages", "bot"); node("B4", 6, 2, "Organize history and new messages", "bot")
node("C1", 7, 1, "Start planning"); node("C2", 8, 1, "Ask for missing details and preferences", "bot")
node("C3", 9, 1, "Draft an itinerary", "bot"); node("C4", 10, 1, "Members share ideas and conditions")
node("C5", 11, 0, "Ask for a change"); node("C9", 11, 2, "Keep the original plan")
node("C6", 12, 0, "Show the changes as differences", "bot"); node("C7", 13, 0, "Review the proposal")
node("C8", 14, 0, "Apply accepted changes as a new version", "bot")
node("D3", 15, 1, "Agree with the plan?", "dec"); node("E1", 15, 0, "Confirm the version"); node("E2", 15, 3, "Re-plan with new conditions")
node("D4", 16, 1, "Stop collecting?", "dec"); node("F1", 16, 0, "Explain what saving keeps", "bot"); node("F2", 16, 3, "Keep chatting and collecting", "bot")
node("F3", 17, 1, "Choose Save and finish"); node("F4", 18, 1, "Save the version; pause collection", "bot")
node("F5", 19, 1, "Summarize; ask: too many or too few stops?", "bot"); node("F6", 20, 1, "Plan saved, still editable")

def half(k):
    n = N[k]; return (DW if n["kind"] == "dec" else W) / 2, (DH if n["kind"] == "dec" else H) / 2
def L(k): n = N[k]; return (n["x"] - half(k)[0], n["y"])
def Rt(k): n = N[k]; return (n["x"] + half(k)[0], n["y"])
def T(k): n = N[k]; return (n["x"], n["y"] - half(k)[1])
def B(k): n = N[k]; return (n["x"], n["y"] + half(k)[1])
def mid(c): return cx(c) + DX / 2

parts = []
def path(pts, arrow=True, dash=False, color=INK):
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2"'
                 + (' stroke-dasharray="7 6"' if dash else "")
                 + (' marker-end="url(#arr)"' if arrow else "") + "/>")
def label(x, y, s, anchor="middle", italic=True, color=MUTED, size=19):
    parts.append(f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" fill="{color}" text-anchor="{anchor}"'
                 + (' font-style="italic"' if italic else "") + f">{s}</text>")
def straight(a, b): path([Rt(a), L(b)])
def elbow_h(a, b, xm):  # right of a -> xm -> left of b
    (x1, y1), (x2, y2) = Rt(a), L(b); path([(x1, y1), (xm, y1), (xm, y2), (x2, y2)])

straight("A1", "A2"); straight("A2", "D1")
path([T("D1"), B("A3")]); label(N["D1"]["x"] + 12, (T("D1")[1] + B("A3")[1]) / 2 + 6, "Yes", "start")
path([B("D1"), T("A4")]); label(N["D1"]["x"] + 12, (B("D1")[1] + T("A4")[1]) / 2 + 7, "No", "start")
elbow_h("A3", "A5", mid(2)); elbow_h("A4", "A5", mid(2)); straight("A5", "D2")
path([T("D2"), B("A6")]); label(N["D2"]["x"] + 12, (T("D2")[1] + B("A6")[1]) / 2 + 6, "Yes", "start")
path([B("D2"), T("A7")]); label(N["D2"]["x"] + 12, (B("D2")[1] + T("A7")[1]) / 2 + 7, "No", "start")
straight("A6", "B1"); elbow_h("A6", "B3", mid(4))
straight("B1", "B2"); straight("B3", "B4")
elbow_h("B2", "C1", mid(6)); elbow_h("B4", "C1", mid(6))
straight("C1", "C2"); straight("C2", "C3"); straight("C3", "C4")
elbow_h("C4", "C5", mid(10)); elbow_h("C4", "C9", mid(10))
straight("C5", "C6"); straight("C6", "C7"); straight("C7", "C8")
elbow_h("C8", "D3", mid(14))
path([T("D3"), B("E1")]); label(N["D3"]["x"] + 12, (T("D3")[1] + B("E1")[1]) / 2 + 6, "Yes", "start")
path([B("D3"), T("E2")]); label(N["D3"]["x"] + 12, (B("D3")[1] + T("E2")[1]) / 2 + 7, "No", "start")
elbow_h("E1", "D4", mid(15))
path([T("D4"), B("F1")]); label(N["D4"]["x"] + 12, (T("D4")[1] + B("F1")[1]) / 2 + 6, "Yes", "start")
path([B("D4"), T("F2")]); label(N["D4"]["x"] + 12, (B("D4")[1] + T("F2")[1]) / 2 + 7, "No", "start")
elbow_h("F1", "F3", mid(16)); straight("F3", "F4"); straight("F4", "F5"); straight("F5", "F6")
# Loops: re-plan returns to sharing ideas; continuing returns to organizing.
yA, yB = 545, 590
path([B("E2"), (N["E2"]["x"], yA), (N["C4"]["x"], yA), B("C4")], dash=True, color=TEAL)
label((N["E2"]["x"] + N["C4"]["x"]) / 2, yA - 10, "re-plan", color=TEAL)
path([B("F2"), (N["F2"]["x"], yB), (N["B4"]["x"], yB), B("B4")], dash=True, color=TEAL)
label((N["F2"]["x"] + N["B4"]["x"]) / 2, yB - 10, "keep collecting", color=TEAL)

def wrap(s, n=17):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if len(cur) + len(w) + (1 if cur else 0) <= n: cur = (cur + " " + w).strip()
        else: lines.append(cur); cur = w
    lines.append(cur); return lines
for k, n in N.items():
    x, y = n["x"], n["y"]
    if n["kind"] == "dec":
        hw, hh = DW / 2, DH / 2
        parts.append(f'<polygon points="{x},{y-hh} {x+hw},{y} {x},{y+hh} {x-hw},{y}" fill="{PAPER2}" stroke="{INK}" stroke-width="2"/>')
        lines = wrap(n["t"], 13)
    else:
        fill, stroke = (TEALBG, TEAL) if n["kind"] == "bot" else (PAPER, INK)
        parts.append(f'<rect x="{x-W/2+5}" y="{y-H/2+5}" width="{W}" height="{H}" rx="7" fill="{stroke}" opacity="0.28"/>')
        parts.append(f'<rect x="{x-W/2}" y="{y-H/2}" width="{W}" height="{H}" rx="7" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        lines = wrap(n["t"])
    y0 = y - (len(lines) - 1) * LH / 2 + FS * 0.35
    for i, s in enumerate(lines):
        label(x, y0 + i * LH, s.replace("&", "&amp;"), italic=False, color=INK, size=FS)
# Legend, bottom left.
lx, ly = 40, 560
parts.append(f'<rect x="{lx}" y="{ly-16}" width="34" height="22" rx="4" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>')
label(lx + 44, ly + 2, "Member action", "start", italic=False, color=INK, size=19)
parts.append(f'<rect x="{lx+200}" y="{ly-16}" width="34" height="22" rx="4" fill="{TEALBG}" stroke="{TEAL}" stroke-width="2"/>')
label(lx + 244, ly + 2, "Waymark", "start", italic=False, color=INK, size=19)
parts.append(f'<polygon points="{lx+358},{ly-18} {lx+378},{ly-5} {lx+358},{ly+8} {lx+338},{ly-5}" fill="{PAPER2}" stroke="{INK}" stroke-width="2"/>')
label(lx + 388, ly + 2, "Decision", "start", italic=False, color=INK, size=19)

TOTAL_W, TOTAL_H = cx(20) + W / 2 + 40, 620
body = "\n".join(parts)
defs = f'<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker></defs>'
def write(name, vx, vw):
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{vw}" height="{TOTAL_H}" viewBox="{vx} 0 {vw} {TOTAL_H}">'
         f'{defs}\n{body}\n</svg>\n')
    open(os.path.join(out, name), "w", encoding="utf-8").write(s)
write("user-flow-en-original-layout.svg", 0, TOTAL_W)
# Close-ups end at node boundaries so no box is cut.
write("user-flow-en-start.svg", 0, cx(6) + W / 2 + 40)
write("user-flow-en-middle.svg", mid(6) - 10, cx(14) + W / 2 + 40 - (mid(6) - 10))
write("user-flow-en-end.svg", mid(14) - 10, TOTAL_W - (mid(14) - 10))
print("width", TOTAL_W, "height", TOTAL_H)
