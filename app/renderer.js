// Interface. Aucune logique métier ici : tout passe par les outils de bin/,
// exposés par le processus principal.
const $ = (s) => document.querySelector(s)
const $$ = (s) => [...document.querySelectorAll(s)]

let INV = null          // inventaire du projet
let EPISODE = null      // épisode choisi
let BLOCS = []          // script découpé
let mpm = 150

// ───────────────────────────── navigation ────────────────────────────────────

function aller(nom) {
  $$('.vue').forEach((v) => v.classList.toggle('visible', v.id === `vue-${nom}`))
  $$('.etape').forEach((b) => b.classList.toggle('actif', b.dataset.vue === nom))
  if (nom === 'micro' && typeof rafraichirSources === 'function') rafraichirSources()
  // La vue vient d'apparaître : c'est seulement maintenant qu'elle est mesurable.
  if (nom === 'prise' && typeof remesurer === 'function') requestAnimationFrame(remesurer)
}
$$('.etape').forEach((b) => b.addEventListener('click', () => aller(b.dataset.vue)))

function journal(nom) {
  return $(`#journal-${nom}`)
}
let journalCourant = 'micro'
window.studio.surSortie((ligne) => {
  const j = journal(journalCourant)
  if (!j) return
  j.textContent += ligne
  j.scrollTop = j.scrollHeight
})

async function outil(vue, nom, args) {
  journalCourant = vue
  return window.studio.outil(nom, args)
}

// ───────────────────────────── inventaire ────────────────────────────────────

async function recharger(garderEpisode = true) {
  INV = await window.studio.inventaire()
  if (INV.erreur) { console.error('inventaire :', INV.erreur); return }
  $('#nom-emission').textContent = INV.emission.titre || 'Studio'
  $('#sous-emission').textContent = INV.emission.sous_titre || 'atelier'

  const liste = $('#liste-episodes')
  liste.innerHTML = ''
  for (const ep of INV.episodes) {
    const b = document.createElement('button')
    b.className = 'carte' + (EPISODE && EPISODE.nom === ep.nom ? ' choisi' : '')
    const puce = (txt, ok) => `<span class="puce${ok ? ' ok' : ''}">${txt}</span>`
    b.innerHTML = `<span class="titre">${ep.titre}</span><span class="puces">
      ${puce(ep.script ? 'script' : 'pas de script', !!ep.script)}
      ${puce(ep.prises.length ? `${ep.prises.length} prise(s)` : 'aucune prise', ep.prises.length > 0)}
      ${puce(ep.monte ? 'monté' : 'non monté', !!ep.monte)}</span>`
    b.addEventListener('click', () => choisir(ep))
    liste.appendChild(b)
  }

  peuplerSources(INV.sources)
  if ($('#m-ambiance').value === '') $('#m-ambiance').value = INV.ambiance || ''
  if ($('#m-musique').value === '') $('#m-musique').value = INV.musiques[0] || ''

  const alerte = $('#alerte')
  alerte.hidden = !INV.a_remplir
  if (INV.a_remplir) {
    alerte.textContent = "emission.toml contient encore des champs REMPLIR : ton pseudo "
      + "GitHub dans les quatre URL, et l'adresse de courriel publique. "
      + "Tant qu'ils y sont, le flux et la mise en ligne refusent de s'exécuter."
  }

  if (garderEpisode && EPISODE) {
    const maj = INV.episodes.find((e) => e.nom === EPISODE.nom)
    if (maj) choisir(maj, false)
  }
}

async function choisir(ep, naviguer = true) {
  EPISODE = ep
  $('#courant').innerHTML = `<b>${ep.titre}</b><br>${ep.prises.length} prise(s)`
  $$('.carte').forEach((c, i) => c.classList.toggle('choisi', INV.episodes[i]?.nom === ep.nom))

  const sel = $('#m-prise')
  sel.innerHTML = ''
  for (const p of ep.prises) {
    const o = document.createElement('option')
    o.value = p; o.textContent = p.split('/').pop(); sel.appendChild(o)
  }
  sel.selectedIndex = ep.prises.length - 1

  BLOCS = []
  if (ep.script) {
    const r = await window.studio.script(ep.script)
    if (!r.erreur) { BLOCS = r.blocs; construireRuban() }
  }
  if (naviguer) aller(ep.prises.length ? 'prise' : 'micro')
}

$('#nouvel-episode').addEventListener('submit', async (e) => {
  e.preventDefault()
  journalCourant = 'micro'
  const code = await outil('micro', 'nouvel-episode',
                           [$('#ne-numero').value, $('#ne-sujet').value])
  if (code === 0) { $('#ne-sujet').value = ''; await recharger(false) }
  else aller('micro')
})

// ───────────────────────────── micro ─────────────────────────────────────────

// Un micro branché après le démarrage n'apparaîtrait jamais si la liste n'était
// lue qu'une fois. On la relit à chaque passage sur l'étape, et à la demande.
function peuplerSources(sources) {
  const src = $('#source')
  const avant = src.value
  src.innerHTML = ''
  if (!sources.length) {
    const o = document.createElement('option')
    o.value = ''; o.textContent = 'aucune entrée détectée'
    src.appendChild(o)
    return
  }
  for (const s of sources) {
    const o = document.createElement('option')
    o.value = s.nom
    o.textContent = s.libelle + (s.usb ? '  · USB' : '')
    src.appendChild(o)
  }
  // On garde le choix précédent s'il existe encore ; sinon on préfère un micro
  // branché en USB au micro intégré, qui est presque toujours le moins bon.
  const garde = sources.find((s) => s.nom === avant)
  const usb = sources.find((s) => s.usb)
  src.value = (garde || usb || sources[0]).nom
}

async function rafraichirSources() {
  const inv = await window.studio.inventaire()
  if (!inv.erreur) { INV = inv; peuplerSources(inv.sources) }
}

$('#btn-sources').addEventListener('click', rafraichirSources)

$('#btn-test').addEventListener('click', async () => {
  const b = $('#btn-test'); b.disabled = true
  journal('micro').textContent = ''
  const s = $('#source').value
  await outil('micro', 'rec', s ? ['--test', '--source', s] : ['--test'])
  b.disabled = false
})

// ───────────────────────────── prompteur ─────────────────────────────────────

const ruban = $('#ruban')
const scene = document.querySelector('.scene')
let defile = false, enregistre = false, horloge = 0, duree = 0, dernier = 0, actif = null, t0 = 0

function construireRuban() {
  ruban.innerHTML = ''
  for (const b of BLOCS) {
    const p = document.createElement('p')
    p.className = b.genre
    p.textContent = b.texte
    ruban.appendChild(p)
    b.el = p
  }
  horloge = 0
  remesurer()
  const mots = BLOCS.filter((b) => b.genre === 'texte').reduce((s, b) => s + b.mots, 0)
  $('#etat-prise').textContent = `${mots} mots · ${Math.floor(mots / mpm)} min ${String(Math.round(mots * 60 / mpm % 60)).padStart(2, '0')} s`
}

// Chaque bloc avance au rythme de ce qu'il contient : le texte au rythme de
// lecture choisi, les indications bien plus vite puisqu'on ne les prononce pas.
// À vitesse constante, on court sur les passages denses.
//
// Mesurer n'a de sens que si la vue est affichée : dans un sous-arbre en
// display:none, offsetTop et offsetHeight valent zéro, et un calendrier calculé
// là reste faux pour toujours — le ruban semble bloqué et saute d'un bloc à
// l'autre. D'où le refus de mesurer à vide, et l'observateur plus bas.
function calendrier() {
  const h = scene.clientHeight
  if (!h || !BLOCS.length || !ruban.offsetHeight) return false

  // Le rembourrage se cale sur la scène, pas sur le viewport : la scène est
  // plus courte que la fenêtre (en-tête et bandeau), et le repère de lecture
  // est lui aussi un pourcentage de la scène. Les deux doivent s'accorder.
  const haut = Math.round(h * 0.42) + 'px'
  if (ruban.style.paddingTop !== haut) {
    ruban.style.paddingTop = haut
    ruban.style.paddingBottom = Math.round(h * 0.80) + 'px'
  }

  let t = 0
  for (const b of BLOCS) {
    if (!b.el) continue
    b.haut = b.el.offsetTop
    b.hauteur = b.el.offsetHeight + parseFloat(getComputedStyle(b.el).marginBottom)
    b.debut = t
    b.duree = b.genre === 'texte' ? b.mots / mpm * 60
            : b.genre === 'indication' ? Math.min(2.5, b.mots / 420 * 60 + 0.35) : 0.55
    t += b.duree
  }
  duree = t
  return true
}

function remesurer() { if (calendrier()) placer(horloge) }
addEventListener('resize', remesurer)
// Se déclenche quand la vue passe de masquée à visible, quand la fenêtre change
// de taille, et quand les polices finissent de charger — les trois moments où
// les mesures précédentes deviennent fausses.
new ResizeObserver(remesurer).observe(ruban)
if (document.fonts) document.fonts.ready.then(remesurer)

function placer(t) {
  if (!BLOCS.length || !duree) return
  let b = BLOCS[0]
  for (const c of BLOCS) if (c.debut <= t) b = c
  const part = b.duree > 0 ? Math.min(1, (t - b.debut) / b.duree) : 1
  const guide = scene.clientHeight * 0.38
  ruban.style.transform = `translateY(${-(b.haut + part * b.hauteur - guide)}px)`
  $('#avance').style.width = (duree ? 100 * Math.min(1, t / duree) : 0) + '%'
  if (b !== actif) {
    if (actif?.el) actif.el.classList.remove('actif')
    b.el?.classList.add('actif')
    actif = b
  }
}

function image(ms) {
  if (defile) {
    if (dernier) horloge += (ms - dernier) / 1000
    placer(horloge)
  }
  dernier = ms
  if (enregistre) {
    const e = (Date.now() - t0) / 1000
    $('#chrono').textContent = `${Math.floor(e / 60)}:${String(Math.floor(e % 60)).padStart(2, '0')}`
  }
  requestAnimationFrame(image)
}
requestAnimationFrame(image)

function etat(txt) { $('#etat-prise').textContent = txt }

async function basculerPrise() {
  if (!enregistre) {
    if (!EPISODE) { etat("choisis d'abord un épisode"); aller('episode'); return }
    const s = $('#source').value
    etat('Démarrage…')
    const r = await window.studio.recDemarrer({ nom: EPISODE.nom, source: s || null })
    if (r.erreur) { etat('✗ ' + r.erreur); return }
    enregistre = true; t0 = Date.now()
    document.body.classList.add('enregistre')
    $('#btn-prise').textContent = 'Pause du défilement'
    $('#btn-stop').disabled = false
    etat('Enregistrement')
    // 1,5 s de silence avant les premiers mots : le montage s'en sert pour
    // mesurer le fond sonore de la pièce.
    setTimeout(() => { defile = true; dernier = 0 }, 1500)
    return
  }
  defile = !defile; dernier = 0
  etat(defile ? 'Enregistrement' : 'Défilement en pause')
}

async function arreterPrise() {
  defile = false
  if (!enregistre) { etat('Prêt'); return }
  const r = await window.studio.recArreter()
  enregistre = false
  document.body.classList.remove('enregistre')
  $('#btn-prise').textContent = 'Démarrer la prise'
  $('#btn-stop').disabled = true
  if (r.erreur) { etat('✗ ' + r.erreur); return }
  const mots = BLOCS.filter((b) => b.genre === 'texte').reduce((s, b) => s + b.mots, 0)
  const reel = r.duree > 1 ? Math.round(mots / (r.duree / 60)) : 0
  etat(`${r.fichier.split('/').pop()} · ${Math.round(r.duree)} s · lu à ${reel} mots/min`)
  await recharger()
  aller('montage')
}

$('#btn-prise').addEventListener('click', () => { arme = true; basculerPrise() })
$('#btn-stop').addEventListener('click', arreterPrise)

// Une fenêtre qui s'ouvre prend le focus d'elle-même sous la plupart des
// gestionnaires. Si la barre d'espace suffisait à lancer une prise, une phrase
// tapée ailleurs partirait dans le micro. On exige donc un clic dans la fenêtre
// depuis la dernière prise de focus : taper ne suffit pas, cliquer oui.
let arme = false
addEventListener('focus', () => { arme = false })
addEventListener('blur', () => { arme = false })
addEventListener('pointerdown', () => { arme = true })

addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (!$('#vue-prise').classList.contains('visible')) return
  if (e.code === 'Space' && !enregistre && !arme) {
    e.preventDefault()
    arme = true
    etat('clique dans la fenêtre, puis espace pour démarrer')
    return
  }
  if (e.code === 'Space') { e.preventDefault(); basculerPrise() }
  else if (e.key === 'Escape') arreterPrise()
  else if (e.key === 'm' || e.key === 'M') {
    window.studio.recMarquer().then((r) => { if (r.n) etat(`Reprise ${r.n} marquée`) })
  }
  else if (e.key === 'r' || e.key === 'R') { horloge = 0; placer(0) }
  else if (e.key === 'ArrowUp') { mpm += 5; $('#mpm').textContent = mpm; remesurer() }
  else if (e.key === 'ArrowDown') { mpm = Math.max(60, mpm - 5); $('#mpm').textContent = mpm; remesurer() }
  else if (/^[1-9]$/.test(e.key)) {
    const s = BLOCS.filter((b) => b.genre === 'section')[+e.key - 1]
    if (s) { horloge = s.debut; placer(horloge) }
  }
})

// ───────────────────────────── montage ───────────────────────────────────────

$('#btn-monter').addEventListener('click', async () => {
  if (!EPISODE) { aller('episode'); return }
  const prise = $('#m-prise').value
  if (!prise) { journal('montage').textContent = '✗ aucune prise à monter\n'; return }
  const sortie = `sorties/${EPISODE.fichier || EPISODE.nom + '.mp3'}`
  const a = ['-o', sortie, '-t', EPISODE.titre]
  if (EPISODE.numero !== null && EPISODE.numero !== undefined) a.push('-e', String(EPISODE.numero))
  if (EPISODE.date) a.push('-d', EPISODE.date)
  if ($('#m-stereo').checked) a.push('--stereo')
  if ($('#m-coupe').checked) a.push('--coupe-silences')
  if ($('#m-ambiance').value.trim())
    a.push('--ambiance', $('#m-ambiance').value.trim(), '--ambiance-ecart', $('#m-amb-ecart').value)
  if ($('#m-musique').value.trim())
    a.push('--musique', $('#m-musique').value.trim(), '--musique-ecart', $('#m-mus-ecart').value)
  a.push('--duck', $('#m-duck').value)
  if (INV.pochette) a.push('--pochette', INV.pochette)
  a.push(prise)

  journal('montage').textContent = ''
  $('#btn-monter').disabled = true
  $('#btn-ecouter').disabled = true
  const code = await outil('montage', 'master', a)
  $('#btn-monter').disabled = false
  if (code === 0) {
    $('#btn-ecouter').disabled = false
    $('#btn-ecouter').dataset.fichier = sortie
    await recharger()
  }
})

$('#btn-ecouter').addEventListener('click', async () => {
  const f = $('#btn-ecouter').dataset.fichier
  const r = await window.studio.jouer(`${INV.racine}/${f}`)
  if (r.erreur) journal('montage').textContent += '✗ ' + r.erreur + '\n'
})

// ───────────────────────────── publication ───────────────────────────────────

$$('[data-pub]').forEach((b) => b.addEventListener('click', async () => {
  const quoi = b.dataset.pub
  journal('publication').textContent = ''
  if (quoi === 'texte') {
    if (!EPISODE?.script) { journal('publication').textContent = '✗ aucun script\n'; return }
    await outil('publication', 'texte', [EPISODE.script])
  } else if (quoi === 'flux') {
    await outil('publication', 'flux', ['--verifier'])
  } else if (quoi === 'site') {
    await outil('publication', 'publier', [])
  } else if (quoi === 'pousser') {
    const ok = await window.studio.confirmer({
      titre: 'Mettre en ligne ?',
      corps: 'Le site sera commité et poussé vers GitHub Pages. Les épisodes '
           + 'deviendront publics dès la propagation.',
      bouton: 'Publier',
    })
    if (!ok) return
    await outil('publication', 'publier', ['--pousser'])
  }
  await recharger()
}))

// ───────────────────────────── démarrage ─────────────────────────────────────

const depart = new URLSearchParams(location.hash.slice(1))
aller('episode')
recharger(false).then(async () => {
  const nom = depart.get('episode')
  if (nom) {
    const ep = INV.episodes.find((e) => e.nom === nom || e.nom.endsWith(nom))
    if (ep) await choisir(ep, false)
  }
  if (depart.get('vue')) aller(depart.get('vue'))
})
