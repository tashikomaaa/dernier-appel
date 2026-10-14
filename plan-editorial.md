# Plan de relance — les arcanes de l'histoire

## 1. Le diagnostic

Tu as cité quatre causes d'arrêt. Elles ne sont pas indépendantes : ce sont
quatre symptômes d'un coût unitaire trop élevé. Un épisode qui coûte un
week-end a besoin d'un week-end libre *et* d'une forte motivation. Dès que
l'audience ne fournit plus la motivation, le week-end libre sert à autre chose.

| cause d'arrêt | contre-mesure |
|---|---|
| le temps de recherche | le brief est fait ici, avec les sources ; tu valides et tu réécris |
| le montage audio | supprimé : `bin/master` remplace le montage par une commande |
| pas d'audience | on arrête d'en attendre de la motivation (§6) et on travaille les deux seuls leviers réels |
| le temps, la vie | saison finie de 8 épisodes, dates fixées d'avance, fin annoncée |

Le dernier point est le plus important. Un podcast « en cours » sans fin prévue
ne s'arrête jamais : il s'éteint, et s'éteindre fait honte, donc on n'y revient
pas. Une saison de 8 épisodes se **termine**. Après quoi tu décides d'en faire
une autre, ou pas, sans que ce soit un échec.

## 2. Le format arrêté

- **Durée : 15 à 18 minutes.** Assez pour traiter un sujet, assez court pour
  s'écrire et se lire en une soirée. C'est aussi le format qui se termine le
  plus — un épisode écouté jusqu'au bout vaut mieux que trois abandonnés à 40 %.
- **Voix seule, texte écrit, lu.** Pas d'improvisation : écrire d'abord est ce
  qui rend la prise unique possible.
- **Un mystère documenté par épisode**, traité en enquête — pas en récit de
  l'étrange.

Cible : **2 400 mots** (≈ 16 min à 150 mots/minute). Vérifie avec `bin/duree`
avant d'enregistrer, jamais après.

## 3. La structure fixe

Toujours la même. C'est elle qui tue la page blanche : tu ne te demandes plus
comment construire l'épisode, seulement quoi mettre dans chaque case.

| # | section | durée | mots | rôle |
|---|---|---|---|---|
| 1 | Accroche | 0:00–0:45 | 110 | une scène, au présent, qui se termine sur la question |
| 2 | Le décor | 0:45–3:00 | 340 | lieu, époque, qui est qui — le minimum nécessaire |
| 3 | L'énigme | 3:00–7:30 | 680 | les faits établis, et eux seuls |
| 4 | Les pistes | 7:30–13:00 | 830 | 2 ou 3 hypothèses, chacune avec ce qui l'appuie *et* ce qui la contredit |
| 5 | Ce qu'on sait, ce qu'on ne saura pas | 13:00–15:30 | 375 | la clôture honnête |
| 6 | Chute | 15:30–16:15 | 115 | une dernière image, puis la sortie |

La section 5 est ta signature. La plupart des contenus de ce genre promettent
une révélation et livrent un sous-entendu. Dire clairement « voilà où s'arrêtent
les sources » est à la fois plus honnête et plus satisfaisant.

## 4. Les règles de rigueur

Le créneau « mystères de l'histoire » est saturé de contenus qui confondent
absence de preuve et preuve d'autre chose. Trois formules, et on s'y tient :

- **« Il est établi que… »** — un fait sourcé, sur lequel les historiens
  s'accordent.
- **« Les sources divergent : … »** — un point débattu. On donne les deux camps
  et qui les porte.
- **« On raconte que…, mais aucune source contemporaine ne l'atteste. »** — une
  légende. On dit d'où elle vient et quand elle est apparue, ce qui est souvent
  plus intéressant que la légende.

Ce qu'on n'écrit jamais : « les historiens ne peuvent pas expliquer »,
« la science reste muette », « troublante coïncidence ». Ces formules ne
décrivent pas un mystère, elles en fabriquent un.

Minimum par épisode : **trois sources**, dont au moins une universitaire ou une
source primaire. Chaque affirmation datée. Les sources vont dans `brief.md` et
les principales sont citées à voix haute dans l'épisode — ça prend dix secondes
et ça te distingue immédiatement.

## 5. La cadence

**Saison 1 : 8 épisodes, un tous les quinze jours.** Les dates sont fixées
maintenant, pas décidées au fil de l'eau.

Budget par épisode, en deux séances :

- **Séance A (≈ 1 h 30)** — je produis le brief et les sources ; tu les lis, tu
  coupes, tu choisis l'angle. Puis je rédige un premier script, que tu réécris
  dans ta voix. Cette réécriture n'est pas optionnelle : un texte qui n'est pas
  le tien s'entend à la lecture.
- **Séance B (≈ 1 h)** — `rec --test`, une prise, `master`, publication.

Enregistre **deux épisodes dans la même séance B** quand tu peux : le gain est
réglé, la voix est chaude, le deuxième coûte moitié moins.

## 6. L'audience, sans se raconter d'histoires

Un podcast sans promotion ne se découvre pas sur Spotify. L'application ne
recommande presque rien qui n'a pas déjà des écoutes, et il n'y a pas de
rattrapage possible par la qualité seule. Trois constats utiles :

1. **La découverte se fait par la recherche, pas par la recommandation.** D'où
   l'importance des titres : `Le trésor de Rennes-le-Château` se cherche,
   `Épisode 4 : de l'or sous l'église` ne se cherche pas. Mets le nom propre que
   les gens taperaient dans le titre, toujours.
2. **Le texte est indexable, l'audio non.** Publier la transcription de chaque
   épisode quelque part (`bin/transcrire` la produit) est le seul levier gratuit
   et durable. Un épisode audio est invisible pour un moteur de recherche ;
   sa transcription ne l'est pas.
3. **La régularité fait plus que la promotion.** Huit épisodes publiés aux dates
   annoncées valent mieux que huit épisodes meilleurs publiés au hasard.

Ce qui ne marche pas et qu'il ne faut pas payer : acheter de la visibilité,
poster le lien dans des groupes génériques, demander des abonnements avant
d'avoir un corpus. Ce qui marche à petite échelle : être présent là où ton
sujet précis se discute déjà, pour parler du sujet — pas du podcast.

## 7. À nettoyer avant de republier

Trois détails qui coûtent cher et se corrigent en dix minutes :

- **Le nom du show est en minuscules** (« les arcanes de l'histoire »). Mets
  « Les Arcanes de l'Histoire » : en l'état, ça signale l'amateurisme avant
  la première seconde d'écoute.
- **La description** doit dire en une phrase qui parle, de quoi, et à quel
  rythme. Celle d'aujourd'hui annonce une intention, pas un contenu.
- **La pochette** doit rester lisible à 55 pixels de côté, la taille réelle
  dans une liste d'écoute. Teste-la à cette taille, pas en grand.

## 8. Les décisions qui t'appartiennent

1. **Combien d'épisodes sont déjà publiés, et lesquels ?** Je n'ai pas pu lire
   la liste depuis l'extérieur. J'en ai besoin pour ne pas te proposer un sujet
   déjà traité, et pour savoir si la saison 1 commence à l'épisode 1 ou 6.
2. **Où est hébergé le flux ?** Si tu passes par Spotify for Creators, le flux
   RSS ne t'appartient pas vraiment. Le récupérer chez un hébergeur ou le
   générer toi-même est faisable — je peux écrire le générateur de flux — mais
   ça n'a d'intérêt que si tu veux exister ailleurs que sur Spotify.
3. **Le périmètre des sujets.** « Mystères de l'histoire » va des énigmes
   policières aux civilisations disparues. Un créneau plus serré se trouve mieux.
