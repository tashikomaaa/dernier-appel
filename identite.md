# Identité de « Dernier Appel »

## 1. Le nom

Trois contraintes, dans cet ordre :

1. **Deux mots courts.** Mesuré, pas supposé : rendu à 55 px — la taille réelle
   dans une liste d'écoute — « DERNIER APPEL » se lit sans effort, tandis que
   « L'ARRIÈRE-SALLE » passe sur deux lignes avec un trait d'union en bout de
   ligne et devient faible. Au-delà de trois mots, le titre n'est plus lisible
   du tout à cette taille.
2. **Un nom propre d'émission, pas une description.** « Histoires étranges »
   décrit un rayon, pas une émission.
3. **Libre.** À vérifier directement dans Apple Podcasts et Spotify avant de
   t'engager : une recherche web ne voit pas tout.

### Le nom retenu : **Dernier Appel**

La dernière tournée au comptoir et le dernier message capté : un seul nom qui
porte le bar, l'espionnage et le signal. Et le seul des trois à rester
parfaitement lisible en vignette.

### Les candidats

| nom | ce qu'il porte | à 55 px |
|---|---|---|
| **Dernier Appel** | la dernière tournée au bar **et** le dernier message capté — couvre le bar, l'espionnage et l'OVNI d'un seul mot | excellent |
| **Sous le Néon** | l'imagerie noire, la lumière crue sur fond sombre | bon |
| **L'Arrière-Salle** | la pièce du fond où l'on parle de ce qui ne se dit pas ailleurs — le plus juste pour le ton | faible (trait d'union) |

Écartés après vérification : *Chambre Noire* (pris deux fois, dont Radio Nova),
*Zone d'Ombre* (RTS), *L'Heure Bleue* (plusieurs).

## 2. L'identité visuelle

Registre noir : fond presque noir, **une seule** source de lumière chaude, un
accent froid en rappel, et rien d'autre. Tout détail disparaît à 55 px.

```bash
bin/pochette -t "Dernier Appel" -s "histoires étranges"
bin/pochette -t "Dernier Appel" --variante neon --police display
```

Le script produit toujours **deux** fichiers : la pochette en 3000 px et un
aperçu à 55 px agrandi au plus proche voisin. C'est le second qui décide — juge
dessus, jamais sur le grand.

Trois variantes : `tungstene` (ambre chaud, par défaut), `neon` (accent cyan,
plus froid), `sang` (accent rouge sourd).

Deux polices : `noire` par défaut, parce qu'un didone comme `display`, plus
élégant en grand, perd ses déliés à 55 px — vérifié, « LE BOX » s'y casse
littéralement.

## 3. L'identité sonore

Le principe : **tu racontes depuis le fond d'un bar.** La salle est là tout du
long, en dessous ; la musique n'intervient qu'aux bords.

### Le bar

`bin/ambiance` fabrique le fond couche par couche — l'air de la salle, la
rumeur des conversations, les verres, les chaises. Rien n'est enregistré, donc
rien n'est à licencier, et la boucle se referme sur elle-même sans raccord
audible (vérifié : l'écart maximal entre échantillons au point de bouclage est
identique à celui d'un instant quelconque).

```bash
bin/ambiance -d 2:00 --graine 1848 --rumeur 50 --densite 12
```

**La graine est l'identité de l'émission.** À graine égale, le fond est
rigoureusement identique d'un épisode à l'autre — même salle, mêmes verres, aux
mêmes instants. Choisis-la une fois, note-la, ne la change plus.

Les réglages : `--rumeur` (présence des voix), `--salle` (poids du grave),
`--densite` (verres et chaises par minute). Le grave est corrélé entre les deux
canaux, donc rien ne s'effondre quand un lecteur resomme en mono.

### Le mixage

```bash
bin/master --stereo \
  --ambiance assets/ambiance-bar.wav --ambiance-ecart 28 \
  --intro assets/theme.wav --outro assets/theme-fin.wav \
  --duck 5 -t "…" prises/…wav
```

Le niveau du fond n'est pas donné en dB absolus mais **en écart sous ta voix**,
mesuré à chaque épisode : un réglage trouvé une fois reste au même endroit pour
toujours, quel que soit le niveau de la prise. Vérifié à la mesure : 28 dB
demandés donnent 27,0 dB, 16 donnent 15,1.

`--duck` creuse le fond quand tu parles et le laisse intact dans les pauses
(mesuré : 0,1 dB d'écart hors parole). 5 dB est un bon point de départ.

Passe en `--stereo` pour cette émission : une voix seule n'a rien à y gagner,
mais une salle, si. C'est la salle qu'on vend.

### La musique

**La musique de *L.A. Noire* est sous droits** (Andrew Hale, Simon Hale, Woody
Jackson pour Rockstar). On vise le registre, pas les morceaux : jazz feutré,
trompette bouchée, balais sur la caisse claire, contrebasse, piano espacé.
Termes de recherche utiles : *film noir jazz*, *smoky jazz*, *detective jazz*,
*muted trumpet*, *cool jazz*, *late night jazz*.

### Le morceau retenu

**« Signs To Nowhere » de Shane Ivers** — contrebasse lourde, balais sur la
caisse claire, vibraphone, trompette bouchée et saxophone. 3 min 31 à 90 bpm,
registre 1940 exactement. Licence vérifiée le 14 octobre 2026 :

- **CC BY 4.0** — « Free to use in any project — personal or commercial — as
  long as you include a credit. » Usage podcast et commercial autorisés.
- Crédit obligatoire, à mettre dans la description de chaque épisode :
  `Music: Signs To Nowhere by Shane Ivers - https://www.silvermansound.com`
- https://www.silvermansound.com/free-music/signs-to-nowhere

Son catalogue contient d'autres pièces du même registre (« Streetlight
Serenade »), sous la même licence : de quoi prendre une ouverture et une
fermeture qui se répondent.

À éviter en revanche : « Noir Theme » de Pk jazz Collective sur Free Music
Archive, qui est en **CC BY-NC-SA** — la clause non commerciale est une zone
grise dès qu'un podcast gagne le moindre euro, et le partage à l'identique est
contaminant.

### Les autres réserves

- **Silverman Sound** (Shane Ivers) — tout en CC BY 4.0, c'est le plus propre.
- **Free Music Archive**, **ccMixter**, **incompetech** (Kevin MacLeod) — bons
  fonds, mais vérifie la licence morceau par morceau : « NC » et « SA » s'y
  mélangent au CC BY.
- **Pixabay Music** — licence maison, usage commercial autorisé sans crédit
  obligatoire. Pratique, mais ce n'est pas du Creative Commons : relis-la.
- **Bibliothèque sur abonnement** — Epidemic Sound, Artlist, Soundstripe.
  Vérifie que la licence couvre explicitement le podcast, pas seulement la
  vidéo. C'est ce qu'il faut si tu veux un thème qui devienne reconnaissable.
- **Domaine public : piège.** Un enregistrement des années 40 peut être libre
  en Europe et protégé aux États-Unis, et la composition relève d'un droit
  distinct de l'enregistrement. Ton podcast est distribué partout : évite.

Attention aussi aux réclamations automatiques de droits sur YouTube, qui
touchent même des morceaux correctement licenciés.

### Ma recommandation sur la structure

Tu as demandé un fond musical sous la narration. Je l'ai construit et il
fonctionne, mais je te conseille autre chose :

```
0:00  la salle seule, qui s'ouvre en fondu
0:04  le thème, 12 à 15 s
0:18  ta voix entre, le thème s'efface en 6 s
      …toute la narration sur la salle seule, 28 dB sous la voix…
15:40 le thème revient sous les vingt dernières secondes
16:10 les deux s'éteignent ensemble
```

Deux raisons. Seize minutes de musique continue fatiguent et masquent les
consonnes, surtout sur un haut-parleur de téléphone. Et la salle suffit à tenir
l'illusion : c'est elle qui dit « il te raconte ça au comptoir », pas la
musique. La musique dit « ça commence » et « c'est fini ».

Si tu veux des relances musicales entre les sections, `master` ne sait pas
encore les placer en cours d'épisode — c'est une option à ajouter, dis-le-moi.
