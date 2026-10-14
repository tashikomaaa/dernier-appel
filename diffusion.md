# Diffusion — un flux, toutes les plateformes

## Le principe

Tu possèdes un fichier `flux.xml` déposé à une URL qui ne change jamais. Chaque
annuaire s'abonne **une fois** à cette URL. Ensuite, publier un épisode, c'est :

```
bin/master …        # le MP3
déposer le MP3      # chez ton hébergeur
bin/flux            # régénère flux.xml
déposer flux.xml    # au même endroit, par-dessus l'ancien
```

Rien à notifier à personne : les annuaires relisent le flux d'eux-mêmes, toutes
les quelques heures. C'est tout l'intérêt de posséder son flux — et la raison
pour laquelle il ne faut pas le confier à un hébergeur qui le générerait pour
toi.

## La mise en place, une seule fois

L'hébergement retenu est **GitHub Pages** : gratuit, sans carte bancaire, et le
flux reste à toi. Six étapes.

1. Créer sur GitHub un dépôt **public** nommé `dernier-appel`.
2. Dans ce dossier : `git init && git branch -M main`, puis
   `git remote add origin git@github.com:<pseudo>/dernier-appel.git`.
3. Remplir les deux champs `REMPLIR` de `emission.toml` : ton pseudo GitHub
   dans les quatre URL, et l'adresse de courriel publique.
4. `bin/publier` (sans `--pousser`) pour vérifier que tout s'assemble, puis
   `git add -A && git commit -m "mise en place" && git push -u origin main`.
5. Sur GitHub : **Settings → Pages → Source : Deploy from a branch →
   `main` → dossier `/docs`**. Une à deux minutes plus tard, l'adresse répond.
6. Vérifier dans un navigateur que `…/flux.xml`, `…/pochette.jpg` et un MP3
   répondent bien. Tant qu'une de ces trois URL échoue, aucune soumission ne
   passera.

Ensuite, publier un épisode tient en une commande : `bin/publier --pousser`.

**Les limites à surveiller** : GitHub conseille de rester sous 1 Go par dépôt,
soit une centaine d'épisodes de seize minutes, et sert 100 Go par mois, soit
environ 9 000 écoutes. Largement de quoi mener la saison 1. Si l'émission
dépasse ça, on bascule les fichiers sur Cloudflare R2 **en gardant la même URL
de flux** — c'est précisément ce que permet de posséder son flux.

## Ce qui doit être vrai avant de soumettre quoi que ce soit

1. **Le flux répond en https** à l'URL déclarée dans `emission.toml`.
2. **Au moins un épisode est publié.** Un flux vide est refusé partout. Une
   bande-annonce de 60 à 90 secondes suffit (`type = "trailer"`), et c'est la
   meilleure façon de lancer les validations pendant que tu écris l'épisode 1.
3. **La pochette est accessible publiquement**, carrée, entre 1400 et 3000 px.
   `bin/flux` le vérifie en local avant que tu découvres le refus chez Apple.
4. **L'adresse de `courriel` est réelle et relevée.** Apple, Spotify, Deezer et
   iHeart y envoient un code de vérification : c'est la preuve que le flux est
   à toi. Une adresse fantaisiste bloque toute la diffusion. Elle est publique
   dans le flux, donc une adresse dédiée au podcast, pas la personnelle.
5. **`bin/flux --verifier` ne renvoie aucune erreur.**

## L'ordre de soumission

Apple d'abord, parce que beaucoup de lecteurs se nourrissent de son annuaire.
Le Podcast Index juste après, parce qu'il est instantané et qu'il alimente tout
l'écosystème ouvert. Les autres ensuite, en parallèle, l'ordre n'importe plus.

| # | plateforme | où | délai | à savoir |
|---|---|---|---|---|
| 1 | **Apple Podcasts** | `podcastsconnect.apple.com` → Add via RSS | 24 à 72 h | code de vérification par courriel |
| 2 | **Podcast Index** | `podcastindex.org/add` | minutes | gratuit ; alimente Fountain, Podverse, Podcast Guru, Castamatic… |
| 3 | **Spotify** | `creators.spotify.com` → Add a podcast | heures | code par courriel |
| 4 | **YouTube Music** | `studio.youtube.com` → Créer → Envoyer un flux RSS | jours | crée une vidéo à image fixe par épisode, sur ta chaîne |
| 5 | **Amazon Music / Audible** | `podcasters.amazon.com` → Get Started | jours | compte Amazon existant suffisant |
| 6 | **Deezer** | `podcasters.deezer.com` → Publish My Podcast | jours | code par courriel |
| 7 | **iHeartRadio** | `podcasters.iheart.com/#submit-podcast` | jours | audience surtout américaine |
| 8 | **TuneIn, Castbox, Player FM, Podchaser, Listen Notes** | soumission libre sur chaque site | variable | à faire une fois, sans urgence |

**Rien à faire pour** Pocket Casts, Overcast, Podcast Addict, AntennaPod,
Podcast Republic : ils se servent de l'annuaire Apple et du Podcast Index. Une
fois les étapes 1 et 2 passées, tu y apparais sans rien demander.

## Les trois choses à ne jamais changer

Elles cassent les abonnements de façon invisible et irréversible :

- **le GUID d'un épisode publié** — pour les plateformes, un GUID différent est
  un épisode différent ; l'ancien disparaît des files d'attente et le nouveau
  est notifié comme une nouveauté ;
- **l'URL du flux** — c'est l'identité de l'émission partout ;
- **l'URL d'un fichier déjà publié** — les épisodes téléchargés plus tard
  tombent sur du vide.

En revanche, changer le **titre**, la **pochette**, la **description** ou les
**catégories** ne risque rien : la modification se propage au prochain passage
des annuaires.

## Le piège de l'hébergeur

Si tu passes plus tard par un service qui te fournit *son* flux, tu repars de
zéro : les abonnés ne suivent pas, et personne ne se réabonne. C'est pour ça
que `emission.toml` pose `verrou = true`, ce qui écrit `podcast:locked` dans le
flux : aucun hébergeur ne peut le réclamer sans ton accord.

Le seul déménagement sans perte consiste à garder la même URL de flux et à
changer ce qu'elle sert.

## Sources des procédures

Vérifié le 14 octobre 2026 :
[Apple via SoundCloud](https://help.soundcloud.com/hc/en-us/articles/115003451707-Submit-your-RSS-feed-to-Apple-Podcasts),
[Podcast Index](https://www.thepodcasthost.com/publishing/submit-your-podcast-to-the-podcast-index/),
[YouTube Music](https://support.google.com/youtubemusic/answer/13525207?hl=en),
[Deezer](https://creatorsupport.deezer.com/hc/en-us/articles/6328148035741-How-To-Add-Your-Podcast-To-Deezer),
[iHeart et Deezer](https://help.alitu.com/en/articles/6046989-how-do-i-submit-my-show-to-pandora-iheartradio-deezer),
[annuaire complet 2026](https://castos.com/podcast-directories/).
