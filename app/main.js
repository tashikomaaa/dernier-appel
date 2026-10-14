// Processus principal : la fenêtre, l'enregistrement, et les appels aux outils.
// Toute la logique métier reste dans bin/ — cette couche ne fait que l'exposer.
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn, execFile } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const RACINE = path.resolve(__dirname, '..')
const outil = (nom) => path.join(RACINE, 'bin', nom)

let fenetre = null
let enreg = null   // { proc, fichier, debut, marques }

// Un enregistreur orphelin continuerait d'enregistrer le micro indéfiniment.
// Deux protections : on l'arrête sur tous les chemins de sortie, et on laisse
// son PID sur le disque pour pouvoir le rattraper au démarrage suivant si
// l'application a été tuée sans pouvoir réagir.
const VERROU = path.join(RACINE, 'prises', '.enregistrement.pid')

function poserVerrou(pid, fichier) {
  try {
    fs.mkdirSync(path.dirname(VERROU), { recursive: true })
    fs.writeFileSync(VERROU, `${pid}\n${fichier}\n`)
  } catch {}
}
function leverVerrou() { try { fs.unlinkSync(VERROU) } catch {} }

function tuerEnregistrement() {
  if (enreg) {
    try { enreg.proc.kill('SIGINT') } catch {}
    enreg = null
  }
  leverVerrou()
}

function rattraperOrphelin() {
  let contenu
  try { contenu = fs.readFileSync(VERROU, 'utf8') } catch { return null }
  const [pid, fichier] = contenu.trim().split('\n')
  try {
    const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
    if (!args.includes('pw-record')) { leverVerrou(); return null }
    process.kill(Number(pid), 'SIGINT')
    leverVerrou()
    return { pid, fichier }
  } catch { leverVerrou(); return null }
}

app.on('before-quit', tuerEnregistrement)
app.on('will-quit', tuerEnregistrement)
process.on('exit', tuerEnregistrement)
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { tuerEnregistrement(); app.quit() })
}

function creerFenetre() {
  fenetre = new BrowserWindow({
    width: 1280, height: 840, minWidth: 620, minHeight: 420,
    backgroundColor: '#0A0A0C',
    title: 'Studio',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  // --vue=<étape> ouvre directement sur une étape (episode, micro, prise,
  // montage, publication). --episode=<nom> choisit l'épisode.
  const depart = process.argv.slice(1)
    .filter((a) => a.startsWith('--vue=') || a.startsWith('--episode='))
    .map((a) => a.replace(/^--/, ''))
    .join('&')
  fenetre.loadFile(path.join(__dirname, 'index.html'), depart ? { hash: depart } : {})
}

// Une seule instance : deux fenêtres pourraient lancer deux pw-record en
// parallèle sur la même entrée. La seconde tentative réveille la première.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (fenetre) { if (fenetre.isMinimized()) fenetre.restore(); fenetre.focus() }
  })
  app.whenReady().then(() => {
    const orphelin = rattraperOrphelin()
    creerFenetre()
    if (orphelin) {
      fenetre.webContents.once('did-finish-load', () => {
        fenetre.webContents.send('outil:ligne',
          `⚠ un enregistrement était resté en cours (pid ${orphelin.pid}) et vient ` +
          `d'être arrêté : ${orphelin.fichier}\n`)
      })
    }
  })
}
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) creerFenetre() })
app.on('window-all-closed', () => { tuerEnregistrement(); app.quit() })

// ─────────────────────────────── lecture du projet ───────────────────────────

function pythonJSON(args) {
  return new Promise((resolve) => {
    execFile(outil('inventaire'), args, { cwd: RACINE, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return resolve({ erreur: (stderr || err.message).trim() })
        try { resolve(JSON.parse(stdout)) }
        catch (e) { resolve({ erreur: 'sortie illisible : ' + e.message }) }
      })
  })
}

ipcMain.handle('inventaire', () => pythonJSON([]))
ipcMain.handle('script', (_e, chemin) => pythonJSON(['--script', chemin]))

// ─────────────────────────────── enregistrement ──────────────────────────────

function cheminLibre(nom) {
  const d = path.join(RACINE, 'prises')
  fs.mkdirSync(d, { recursive: true })
  let c = path.join(d, `${nom}.wav`), n = 2
  while (fs.existsSync(c)) c = path.join(d, `${nom}-${n++}.wav`)
  return c
}

ipcMain.handle('rec:demarrer', async (_e, { nom, source }) => {
  if (enreg) return { erreur: 'un enregistrement est déjà en cours' }
  const fichier = cheminLibre(nom)
  const args = ['--rate', '48000', '--channels', '1', '--format', 's24']
  if (source) args.push('--target', source)
  args.push(fichier)
  let proc
  try { proc = spawn('pw-record', args) }
  catch (e) { return { erreur: 'pw-record : ' + e.message } }

  let erreurTot = ''
  proc.stderr.on('data', (d) => { erreurTot += d.toString() })
  const parti = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(true), 350)
    proc.once('exit', () => { clearTimeout(t); resolve(false) })
  })
  if (!parti) return { erreur: erreurTot.trim() || "pw-record s'est arrêté aussitôt" }

  enreg = { proc, fichier, debut: Date.now(), marques: [] }
  poserVerrou(proc.pid, fichier)
  // Garde-fou : une prise ne dure pas trois heures. Si l'interface se fige,
  // l'enregistrement s'arrête tout de même.
  enreg.minuterie = setTimeout(() => { tuerEnregistrement() }, 3 * 3600 * 1000)
  return { fichier }
})

ipcMain.handle('rec:marquer', () => {
  if (!enreg) return { erreur: 'aucun enregistrement en cours' }
  enreg.marques.push((Date.now() - enreg.debut) / 1000)
  return { n: enreg.marques.length }
})

ipcMain.handle('rec:arreter', () => {
  if (!enreg) return { erreur: 'aucun enregistrement en cours' }
  const e = enreg
  enreg = null
  clearTimeout(e.minuterie)
  leverVerrou()
  return new Promise((resolve) => {
    const secours = setTimeout(() => { try { e.proc.kill('SIGTERM') } catch {} }, 5000)
    e.proc.once('close', () => {
      clearTimeout(secours)
      const duree = (Date.now() - e.debut) / 1000
      let octets = 0
      try { octets = fs.statSync(e.fichier).size } catch {}
      if (e.marques.length) {
        const mm = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:` +
                          `${(t % 60).toFixed(3).padStart(6, '0')}  reprise\n`
        fs.writeFileSync(e.fichier.replace(/\.wav$/, '.marques.txt'),
                         e.marques.map(mm).join(''))
      }
      resolve({ fichier: e.fichier, duree, octets, marques: e.marques.length })
    })
    // SIGINT et pas SIGKILL : c'est ce qui laisse à pw-record le temps d'écrire
    // l'en-tête WAV. Tué brutalement, le fichier serait inexploitable.
    e.proc.kill('SIGINT')
  })
})

// ─────────────────────────────── outils ──────────────────────────────────────

ipcMain.handle('outil', (evt, nom, args) => new Promise((resolve) => {
  const envoyer = (l) => { if (!evt.sender.isDestroyed()) evt.sender.send('outil:ligne', l) }
  envoyer(`$ bin/${nom} ${args.join(' ')}\n`)
  let proc
  try {
    proc = spawn(outil(nom), args.map(String), { cwd: RACINE })
  } catch (e) {
    envoyer(`✗ ${e.message}\n`); return resolve(1)
  }
  proc.stdout.on('data', (d) => envoyer(d.toString()))
  proc.stderr.on('data', (d) => envoyer(d.toString()))
  proc.on('error', (e) => { envoyer(`✗ ${e.message}\n`); resolve(1) })
  proc.on('close', (code) => resolve(code ?? 1))
}))

ipcMain.handle('confirmer', async (_e, { titre, corps, bouton }) => {
  const r = await dialog.showMessageBox(fenetre, {
    type: 'warning', buttons: ['Annuler', bouton], defaultId: 0, cancelId: 0,
    message: titre, detail: corps,
  })
  return r.response === 1
})
