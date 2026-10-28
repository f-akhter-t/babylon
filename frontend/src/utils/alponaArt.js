// Original line art for the home page hero, as plain SVG markup in the current
// text colour. Each piece is drawn in a 400 x 400 box. Every stroke has
// pathLength="1" and every group a --i number, so index.css can draw it in.
const f = (n) => +n.toFixed(1)
const sin = (d) => Math.sin((d * Math.PI) / 180)
const cos = (d) => Math.cos((d * Math.PI) / 180)

const path = (d, extra = '') => `<path d="${d}" pathLength="1" ${extra}/>`
const circ = (cx, cy, r, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" pathLength="1" ${extra}/>`
const dot = (cx, cy, r = 1.6) => `<circle class="dot" cx="${f(cx)}" cy="${f(cy)}" r="${r}" fill="currentColor" stroke="none"/>`
const g = (i, inner, tf = '') => `<g style="--i:${i}"${tf ? ` transform="${tf}"` : ''}>${inner}</g>`
const at = (x, y, a, inner) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${inner}</g>`

// A leaf standing on the origin, pointing up; veins optional.
const leafD = (len, w) =>
  `M0 0C${f(-w)} ${f(-len * 0.25)} ${f(-w * 0.7)} ${f(-len * 0.8)} 0 ${f(-len)}C${f(w * 0.7)} ${f(-len * 0.8)} ${f(w)} ${f(-len * 0.25)} 0 0Z`
const leaf = (len, w, veins = 0) => {
  let s = path(leafD(len, w))
  if (veins) {
    s += path(`M0 ${f(-len * 0.08)}V${f(-len * 0.9)}`)
    for (let k = 1; k <= veins; k++) {
      const y = -len * (0.15 + (0.6 * k) / veins)
      const dx = w * 0.55 * (1 - (k - 1) / (veins + 1))
      s += path(`M0 ${f(y)}L${f(-dx)} ${f(y - len * 0.14)}M0 ${f(y)}L${f(dx)} ${f(y - len * 0.14)}`)
    }
  }
  return s
}
// Repeat make(k) n times around (cx, cy); the origin of each copy sits r out from the centre.
const around = (cx, cy, n, off, r, make) =>
  Array.from({ length: n }, (_, k) => {
    const a = (360 / n) * k + off
    return g(k, at(cx, cy, a, `<g transform="translate(0 ${-r})">${make(k)}</g>`))
  }).join('')
const spiral = (cx, cy, r0, turns, dir, phase) => {
  const pts = []
  const steps = 70
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * turns * 360
    const r = r0 * (1 - 0.93 * (s / steps))
    pts.push([cx + dir * r * cos(t + phase), cy + r * sin(t + phase)])
  }
  return { pts, d: 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') }
}

// ---------- 1. corner vine (the corner is at the bottom-left) ----------
const outward = (cx, cy, x, y) => (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI
export const corner = () => {
  const out = []
  const T = 'translate(0 400)'
  // frame lines along the two edges, like the border of a painted alpona
  out.push(g(0, path('M0 394H318') + path('M0 388H300') + path('M6 400V82') + path('M12 400V100'), ''))
  // sunburst fan around the corner
  out.push(g(1, path('M60 0A60 60 0 0 0 0 -60') + path('M104 0A104 104 0 0 0 0 -104'), T))
  let ticks = ''
  for (let a = 3; a < 90; a += 3.5) ticks += path(`M${f(66 * cos(a))} ${f(-66 * sin(a))}L${f(98 * cos(a))} ${f(-98 * sin(a))}`)
  out.push(g(2, ticks, T))
  let petals = ''
  for (let a = 7; a < 90; a += 12) petals += at(110 * cos(a), -110 * sin(a), 90 - a, leaf(58, 14, 3))
  out.push(g(3, petals, T))
  out.push(g(4, path('M178 0A178 178 0 0 0 0 -178') + path('M184 0A184 184 0 0 0 0 -184'), T))
  let outer = ''
  for (let a = 5; a < 90; a += 10) {
    outer += at(186 * cos(a), -186 * sin(a), 90 - a, leaf(34, 9, 0))
    outer += dot(176 * cos(a + 5), -176 * sin(a + 5), 2.2)
  }
  out.push(g(5, outer, T))
  // two big scrolls with leaves along their outer edge
  const scroll = (cx, cy, r0, turns, dir, phase, stem, i0) => {
    const s1 = spiral(cx, cy, r0, turns, dir, phase)
    const s2 = spiral(cx, cy, r0 * 0.78, turns, dir, phase)
    let lv = ''
    ;[14, 28, 42, 55].forEach((k) => {
      const [x, y] = s1.pts[k]
      lv += at(x, y, outward(cx, cy, x, y), leaf(46 - k * 0.3, 12, 2))
    })
    const [ex, ey] = s1.pts[70]
    return [
      g(i0, path(stem) + path(s1.d) + path(s2.d)),
      g(i0 + 1, lv + circ(ex, ey, 4) + dot(ex, ey, 1.6)),
    ]
  }
  out.push(...scroll(250, 214, 78, 1.4, 1, 190, 'M150 330C200 340 270 330 306 270C320 242 312 204 292 190', 6))
  out.push(...scroll(112, 150, 62, 1.3, -1, 10, 'M16 300C34 250 40 214 62 188C78 168 92 164 100 166', 8))
  // a few leaves climbing the stems
  let lv = ''
  ;[[170, 334, 30], [210, 332, -30], [250, 322, 40], [286, 296, -40]].forEach(([x, y, a]) => (lv += at(x, y, a, leaf(40, 11, 2))))
  ;[[24, 286, -20], [34, 252, 40], [48, 222, -35], [66, 196, 50]].forEach(([x, y, a]) => (lv += at(x, y, a, leaf(34, 9, 1))))
  out.push(g(10, lv))
  out.push(g(11, dot(150, 330, 2.6) + dot(318, 262, 2) + dot(16, 300, 2.6) + dot(190, 340, 1.8) + dot(100, 230, 2)))
  return out.join('')
}

// ---------- 2. lotus mandala ----------
export const mandala = () => {
  const out = []
  const C = 200
  // lotus in the middle
  let lot = ''
  for (let a = -72; a <= 72; a += 24) lot += at(C, C + 38, a, leaf(78, 20, 2))
  out.push(g(0, lot))
  lot = ''
  for (let a = -48; a <= 48; a += 24) lot += at(C, C + 38, a, leaf(64, 17, 1))
  out.push(g(1, lot))
  lot = ''
  for (let a = -24; a <= 24; a += 24) lot += at(C, C + 38, a, leaf(50, 14, 0))
  out.push(g(2, lot + circ(C, C + 40, 4)))
  out.push(g(3, circ(C, C, 98) + circ(C, C, 104) + circ(C, C, 110)))
  out.push(g(4, around(C, C, 18, 0, 124, () => circ(0, 0, 11)) ))
  let big = around(C, C, 12, 0, 130, () => leaf(66, 30, 0) + `<g transform="scale(.55) translate(0 -10)">${leaf(66, 30, 0)}</g>` + dot(0, -44, 2.5) + dot(-8, -30, 1.6) + dot(8, -30, 1.6) + path('M0 -8V-26'))
  out.push(big)
  out.push(g(6, around(C, C, 12, 15, 134, () => leaf(40, 14, 0) + dot(0, -22, 2))))
  out.push(g(7, circ(C, C, 198, 'class="soft"')))
  return out.join('')
}

// ---------- 3. rickshaw (a Dhaka cycle rickshaw, side view) ----------
export const rickshaw = () => {
  const out = []
  const wheel = (cx, cy, r, i) => {
    let sp = ''
    for (let k = 0; k < 16; k++) sp += path(`M${f(cx + 8 * cos(k * 22.5))} ${f(cy + 8 * sin(k * 22.5))}L${f(cx + (r - 7) * cos(k * 22.5))} ${f(cy + (r - 7) * sin(k * 22.5))}`)
    return g(i, circ(cx, cy, r) + circ(cx, cy, r - 6) + circ(cx, cy, 8) + circ(cx, cy, 3) + sp)
  }
  out.push(wheel(100, 270, 56, 0), wheel(290, 270, 66, 1))
  // frame
  out.push(g(2, path('M100 270L126 205M126 205L222 222M222 222L290 270M126 205L156 270M156 270L222 222M156 270L100 270') +
    path('M126 205L112 188C106 182 96 183 90 190M112 188L128 182') + circ(156, 270, 9) + path('M148 270L164 270')))
  // driver's seat
  out.push(g(3, path('M168 200C172 192 186 190 196 198L200 218L170 216Z') + path('M170 204L198 206')))
  // passenger seat and the box under it
  out.push(g(4, path('M205 216L335 216L338 246L214 246Z') + path('M205 216C203 196 212 178 224 168') + path('M214 246L214 232L335 232')))
  // the folded hood
  out.push(g(5, path('M222 172C214 120 252 70 312 66C350 70 354 130 338 216') + path('M222 172C260 160 300 150 338 156')))
  let ribs = ''
  ;[0, 1, 2, 3].forEach((k) => {
    ribs += path(`M${228 + k * 14} 170C${222 + k * 10} ${130 + k * 6} ${262 + k * 6} ${86 + k * 12} 322 ${74 + k * 14}`)
  })
  out.push(g(6, ribs))
  let scal = ''
  for (let k = 0; k < 7; k++) scal += path(`M${224 + k * 16.5} 166q8.2 10 16.5 0`)
  out.push(g(7, scal))
  // painted panel on the back with flowers
  let fl = ''
  ;[236, 262, 288, 314].forEach((x) => {
    fl += circ(x, 239, 5) + dot(x, 239, 1.5) + path(`M${x - 11} 239h4M${x + 7} 239h4`)
  })
  out.push(g(8, fl))
  // mudguard curls and a small flag for good measure
  out.push(g(9, path('M44 270C44 200 100 196 126 205') + path('M246 270C246 236 300 206 338 216') + path('M338 216L338 130') + path('M338 130L368 140L338 152Z')))
  return out.join('')
}

// ---------- 4. hilsa (ilish) ----------
export const hilsa = () => {
  const out = []
  const centre = (x) => 205 - (x - 30) * 0.015
  const half = (x) => 66 * Math.pow(Math.sin((Math.PI * (x - 30)) / 300), 0.75) * (1 - (x - 30) / 900)
  out.push(g(0, path('M30 207C60 152 190 128 318 188L338 196L384 156L364 206L390 258L338 216L318 224C220 290 92 272 30 207Z')))
  out.push(g(1, path('M30 207C40 214 48 214 56 212') + circ(66, 196, 8) + dot(66, 196, 3.5)))
  out.push(g(2, path('M96 168C82 196 84 232 104 246') + path('M110 172C100 198 102 228 116 242')))
  out.push(g(3, path('M170 146L196 116L232 154') + path('M184 138L196 128M204 138L212 128') + path('M120 244L158 270L136 238') + path('M262 224L296 252L282 220')))
  out.push(g(4, path('M120 205C180 196 260 196 330 206')))
  let sc = ''
  for (let row = 0; row < 7; row++) {
    for (let x = 130 + (row % 2) * 9; x < 310; x += 18) {
      const y = 160 + row * 15 + ((x - 30) / 300) * 4
      if (Math.abs(y - centre(x)) < half(x) - 6 && Math.abs(y - 205) > 4) sc += path(`M${x - 7} ${y}q7 9 14 0`)
    }
  }
  out.push(g(5, sc))
  out.push(g(6, path('M338 196L372 176M338 196L372 206M338 196L376 236')))
  return out.join('')
}

// ---------- 5. shapla (water lily), the national flower ----------
export const shapla = () => {
  const out = []
  const bx = 200, by = 262
  out.push(g(0, path('M200 400C196 360 210 320 200 262')))
  let p = ''
  for (let a = -78; a <= 78; a += 26) p += at(bx, by, a, leaf(112, 24, 3))
  out.push(g(1, p))
  p = ''
  for (let a = -65; a <= 65; a += 26) p += at(bx, by, a, leaf(92, 21, 2))
  out.push(g(2, p))
  p = ''
  for (let a = -52; a <= 52; a += 26) p += at(bx, by, a, leaf(70, 18, 1))
  out.push(g(3, p))
  p = ''
  for (let a = -26; a <= 26; a += 26) p += at(bx, by, a, leaf(50, 14, 0))
  out.push(g(4, p))
  let st = circ(bx, by - 26, 10)
  for (let k = 0; k < 10; k++) st += dot(bx + 17 * cos(k * 36), by - 26 + 17 * sin(k * 36), 1.6)
  out.push(g(5, st))
  // lily pad and a bud
  out.push(g(6, path('M60 350C70 320 150 318 168 346C150 372 76 376 60 350Z') + path('M114 346L168 346') + path('M60 350L114 346')))
  out.push(g(7, path('M290 400C282 360 300 330 306 296') + at(306, 296, 0, leaf(46, 13, 1)) + at(306, 296, -26, leaf(40, 11, 0)) + at(306, 296, 26, leaf(40, 11, 0))))
  out.push(g(8, path('M240 380C250 372 270 372 280 380') + path('M92 392c10 6 30 6 40 0M150 396c10 6 30 6 40 0')))
  return out.join('')
}

export const MOTIFS = [mandala, rickshaw, hilsa, shapla]

// Bangladesh, in a 400 x 520 box (simplified from public map data). DHAKA is the red dot.
export const BANGLADESH_PATH =
  'M384,413L386,462L390,472L384,477L380,467L369,466L363,458L356,462L351,484L359,494L362,520L352,498L341,485L341,474L334,459L340,443L335,441L336,429L331,425L325,401L318,388L316,374L300,349L292,342L270,346L275,360L265,364L251,360L236,341L224,315L228,298L222,289L223,268L218,287L194,282L223,300L220,315L210,316L217,331L206,343L213,348L214,359L223,370L223,383L209,404L207,394L196,422L190,428L175,423L179,412L170,413L163,388L159,406L163,420L158,425L145,424L148,430L139,433L134,427L137,420L131,394L133,414L129,430L121,434L122,418L113,437L106,427L99,427L95,399L90,371L83,345L86,337L78,325L78,315L87,306L65,296L72,280L53,265L56,245L67,239L64,219L70,212L61,206L48,204L20,188L10,174L13,164L25,147L34,154L43,138L45,125L84,127L89,115L76,109L75,100L52,97L43,83L27,69L19,72L15,60L22,38L36,30L44,18L44,9L34,9L41,0L62,13L75,30L82,26L94,28L82,16L86,11L98,21L101,39L116,51L135,55L140,46L137,38L144,31L159,57L155,66L159,84L156,106L158,116L165,115L203,129L224,127L240,129L274,124L294,130L309,131L315,127L340,126L362,135L378,152L368,157L358,151L346,196L331,201L327,218L315,211L312,220L306,214L304,223L285,223L283,233L273,241L273,248L266,256L266,267L273,279L279,309L285,316L285,298L293,305L303,327L320,314L316,298L320,289L332,278L332,257L341,264L349,256L358,267L366,290L364,307L366,325L378,349L384,396Z'
export const DHAKA = { x: 206.6, y: 249.4 }
