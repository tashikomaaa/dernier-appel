# les arcanes de l'histoire — atelier de production

Objectif de cet atelier : qu'un épisode coûte **une soirée**, pas un week-end.
Pas de montage multipiste. Une prise lue, une commande, un fichier publiable.

## La boucle

Tout se fait depuis l'application :

```
bin/studio
```

Cinq étapes, dans l'ordre : **Épisode → Micro → Prise → Montage → Publication.**
Chaque étape appelle les outils ci-dessous — l'application ne réimplémente rien,
donc tout reste faisable en ligne de commande si tu préfères.

```
1. brief      →  episodes/NNN-sujet/brief.md     (recherche, sources, angle)
2. script     →  episodes/NNN-sujet/script.md    (texte lu, minuté d'avance)
3. Micro      →  régler le gain AVANT de lire 2 500 mots
4. Prise      →  le script défile, l'enregistrement tourne, une seule prise
5. Montage    →  MP3 publiable, aux normes de loudness
6. Publication→  transcription, flux, site, mise en ligne
```

La règle la plus importante tient à l'étape 4 : **on ne s'arrête pas**. Une
phrase ratée, on la reprend sur place, à voix haute, on marque l'instant avec
<kbd>M</kbd> et on continue. `--coupe-silences` enlève les blancs, et une
reprise immédiate s'entend à peine. S'arrêter pour recommencer, c'est ce qui
transforme une heure de travail en quatre.


## Les outils

### `bin/rec` — enregistrer

```bash
bin/rec --sources                  # quelles entrées existent
bin/rec --test                     # 6 s, puis diagnostic du gain et de la pièce
bin/rec --depuis prise.wav         # même diagnostic sur un fichier existant
bin/rec 004-affaire-dupont         # enregistre dans prises/, Ctrl-C pour arrêter
```

`--test` répond à la seule question qui compte avant d'enregistrer : est-ce que
cette prise sera récupérable ? Il mesure la crête (écrêtage = prise perdue), le
niveau de la voix, celui de la pièce, et l'écart entre les deux. Sous 20 dB
d'écart, aucun traitement ne sauvera la prise ; au-dessus de 35 dB, tout est
permis.

### `bin/studio` — l'application

```bash
bin/studio                                   ouvre l'atelier
bin/studio --episode=004-sujet --vue=prise   directement sur une étape
```

Une fenêtre, cinq étapes. L'interface est dans `app/` (Electron) ; la logique
reste dans `bin/`, appelée en sous-processus et affichée dans le journal de
chaque étape. Une seule implémentation, deux façons de s'en servir.

L'étape **Prise** est un prompteur :

| touche | effet |
|---|---|
| `espace` | démarre l'enregistrement, puis met le défilement en pause ou le relance |
| `↑` `↓` | ajuste la vitesse en direct, par pas de 5 mots/minute |
| `M` | marque une reprise — les instants partent dans `prises/<nom>.marques.txt` |
| `1`–`9` | saute au début d'une section, pour refaire un passage |
| `R` | revient au début |
| `Échap` | arrête la prise et affiche le bilan |

Quatre choix de conception :

- **Le défilement n'est pas à vitesse constante.** Chaque bloc avance au rythme
  de ce qu'il contient : le texte au rythme de lecture choisi, les indications
  de jeu beaucoup plus vite puisqu'on ne les prononce pas.
- **Le défilement démarre 1,5 s après l'enregistrement.** Ce silence initial
  sert à `master` pour mesurer le fond sonore de ta pièce.
- **Mettre le défilement en pause n'interrompt pas la prise.** Seul `Échap`
  arrête l'enregistrement.
- **L'enregistreur ne peut pas rester orphelin.** Il est arrêté sur tous les
  chemins de sortie, son PID est posé dans `prises/.enregistrement.pid`, et un
  enregistrement qui aurait survécu à un arrêt brutal est rattrapé et stoppé au
  démarrage suivant. Une barre d'espace reçue dans la seconde qui suit une prise
  de focus est ignorée, pour qu'une fenêtre passée au premier plan ne déclenche
  pas une prise toute seule.

### `bin/nouvel-episode` — partir du gabarit

```bash
bin/nouvel-episode 4 "le tresor de rennes le chateau"
```

Copie `episodes/_modele/` et renseigne numéro, titre et nom de fichier. C'est
aussi ce que fait le formulaire de l'étape **Épisode**.

### `bin/duree` — viser la bonne longueur

```bash
bin/duree episodes/004-*/script.md
bin/duree --mpm 140 episodes/004-*/script.md
```

Compte les mots réellement lus (il ignore les titres, les notes entre crochets
et les blocs de sources) et donne le temps de lecture. Après ta première prise,
divise le nombre de mots par la durée réelle et mets ta vraie cadence dans
`ARCANES_MPM` — l'estimation devient juste.

### `bin/master` — post-production

```bash
bin/master --coupe-silences \
  -t "Le trésor de Rennes-le-Château" -e 4 \
  --description "Un curé pauvre devient riche en 1891. Enquête." \
  --pochette assets/pochette.jpg \
  --intro assets/musique/generique.wav \
  prises/004-affaire-dupont.wav
```

Ce qu'il fait, dans cet ordre, et pourquoi l'ordre compte :

| étape | traitement | rôle |
|---|---|---|
| 1 | concat | plusieurs prises bout à bout, si tu as coupé en deux |
| 2a | `highpass`, `adeclick`, `afftdn` | grondements, clics de bouche, souffle |
| 2b | `silenceremove` | resserre les pauses — **avant** le nivellement |
| 2c | `equalizer`, `speechnorm`, `acompressor`, `alimiter` | voix égale et dense |
| 3a | `volume`, `sidechaincompress` | fond de salle et musique, posés en écart sous la voix |
| 3b | `acrossfade` | générique enchaîné, sans manger les premiers mots |
| 4 | `loudnorm` en deux passes | −16 LUFS, crête vraie −1,5 dBTP |
| 5 | `libmp3lame` + ID3 | MP3 mono 96 kb/s, tags et pochette |

Deux points de conception à ne pas défaire :

- **La coupe des silences passe avant `speechnorm`.** Dans l'autre sens,
  `speechnorm` remonte le bruit de fond des pauses au niveau de la parole et
  plus aucun silence n'est détectable. C'est silencieux comme bug : la commande
  réussit et ne coupe rien.
- **Le seuil de silence n'est pas une constante.** Il dépend de ta pièce et de
  ton micro. `master` applique le filtre à plusieurs seuils, du plus prudent au
  plus agressif, et retient le premier qui enlève vraiment du temps sans dépasser
  35 % du brut. Tu peux le forcer avec `--seuil-silence`.

Toutes les options : `bin/master --help`.

### `bin/ambiance` — le fond de bar

```bash
bin/ambiance -d 2:00 --graine 1848
```

Synthétise la salle couche par couche : air de la pièce, rumeur, verres,
chaises. Libre de droits par construction, et la boucle se referme sans
raccord audible. **La graine est l'identité de l'émission** — à graine égale le
fond est identique d'un épisode à l'autre. Voir `identite.md`.

### `bin/pochette` — la pochette

```bash
bin/pochette -t "Dernier Appel" -s "histoires étranges"
```

Produit la pochette en 3000 px **et** son aperçu à 55 px, la taille réelle dans
une liste d'écoute. Juge sur le petit.

### `bin/flux` — le flux RSS

```bash
bin/flux --verifier   # contrôle sans rien écrire
bin/flux              # écrit sorties/flux.xml
```

Construit le flux depuis `emission.toml` et les `episodes/*/episode.toml`.
Vérifie avant publication ce que les annuaires refuseraient sans explication :
catégories Apple, dimensions de la pochette, URL absolues en https, GUID
uniques et stables. Voir `diffusion.md`.

### `bin/publier` — le site et la mise en ligne

```bash
bin/publier              # assemble docs/ et vérifie
bin/publier --pousser    # puis commite et pousse vers GitHub Pages
```

Régénère le flux, assemble `docs/` (accueil, flux, pochette, MP3, une page par
épisode portant sa transcription) et, sur demande seulement, pousse. Sans
`--pousser` il ne touche à rien de distant : la mise en ligne reste un geste
explicite.

### `bin/texte` — la transcription, sans rien installer

```bash
bin/texte episodes/004-sujet/script.md
```

Tu lis un texte écrit : la transcription existe déjà. Cet outil enlève ce qui
n'est pas lu (titres, indications, notes entre crochets) et écrit
`sorties/<episode>.txt`, que `bin/publier` reprend dans la page de l'épisode.
C'est ce texte que lisent les moteurs de recherche.

### `bin/transcrire` — sous-titres minutés

```bash
bin/transcrire sorties/004-le-tresor.mp3
```

Sert à la description de l'épisode, aux sous-titres YouTube, et à publier le
texte quelque part d'indexable — le seul levier de découverte sérieux quand on
part de zéro. Aucun moteur n'est installé pour l'instant : la commande te dit
quoi installer.

### `bin/inventaire` — l'état du projet en JSON

```bash
bin/inventaire                      émission, épisodes, entrées micro
bin/inventaire --script fichier.md  découpage d'un script en blocs
```

Le pont entre les outils, écrits en Python, et l'interface, écrite en
JavaScript : une seule lecture des fichiers du projet, un seul format.

## Niveau de sortie

Cible −16 LUFS, crête vraie −1,5 dBTP : la norme de fait du podcast parlé
(Apple demande −16 pour le stéréo, −19 pour le mono ; Spotify ramène tout
autour de −14). À −16 on est bon partout, sans être écrasé ni trop faible.
Sortie en mono par défaut : une voix seule ne gagne rien au stéréo et le
fichier pèse deux fois moins.

## Arborescence

```
bin/           les outils
app/           l'interface (Electron)
episodes/      un dossier par épisode, _modele/ à copier
prises/        audio brut (gros, ne pas versionner)
sorties/       MP3 finaux
assets/        pochette, génériques, fond de bar
emission.toml  fiche d'identité, source du flux RSS
```

## Les autres documents

- `plan-editorial.md` — format, structure, cadence, règles de rigueur
- `identite.md` — nom, identité visuelle, identité sonore, musique
- `diffusion.md` — soumission à toutes les plateformes, pièges à éviter
