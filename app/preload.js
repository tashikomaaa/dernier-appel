// Pont étroit entre l'interface et le processus principal : l'interface n'a
// aucun accès direct au système de fichiers ni aux processus.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('studio', {
  inventaire: () => ipcRenderer.invoke('inventaire'),
  script: (chemin) => ipcRenderer.invoke('script', chemin),
  recDemarrer: (o) => ipcRenderer.invoke('rec:demarrer', o),
  recMarquer: () => ipcRenderer.invoke('rec:marquer'),
  recArreter: () => ipcRenderer.invoke('rec:arreter'),
  outil: (nom, args) => ipcRenderer.invoke('outil', nom, args),
  confirmer: (o) => ipcRenderer.invoke('confirmer', o),
  surSortie: (cb) => ipcRenderer.on('outil:ligne', (_e, l) => cb(l)),
})
