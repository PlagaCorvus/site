# Tri Instagram

Application web pour trier sa bibliothèque Instagram : publications, enregistrements,
« j'aime », abonnements et abonnés. Un seul fichier, aucune installation, aucun compte.

**En ligne :** [`tri-instagram/`](https://plagacorvus.github.io/site/tri-instagram/)

## Démarrage recommandé : le lanceur

Le fichier `lanceur.py` contient la page et un petit serveur local. Il ne dépend que de
Python 3, présent sur Linux et macOS. Il choisit lui-même un port libre, trouve les
archives `.zip` dans Téléchargements, Downloads, Bureau, le dossier courant et ceux passés
en argument, sert la page et ouvre le navigateur par défaut.

```
python3 lanceur.py
```

La page liste alors les archives et les ouvre d'un clic, sans boîte de sélection de
fichier, ce qui contourne un sélecteur de bureau défaillant. Ctrl+C arrête le serveur.
Options : `--port N`, `--no-browser`, et des chemins de dossiers ou d'archives.

`lanceur.py` est régénéré depuis `index.html` par `python3 construire.py`.

## Ce qu'elle fait

- Lit l'archive de données Instagram (format JSON), au choix le `.zip` tel quel ou le dossier décompressé.
- Affiche chaque catégorie séparément avec le nombre d'éléments restant à trier.
- **Mode tri rapide** : un élément à la fois, décision au clavier (← retirer, ↓ plus tard, → garder, Z annuler).
- **Vue liste ou grille** : vignettes pour les publications qui ont des images dans l'archive,
  lignes compactes avec pastille pour les comptes et les liens.
- **Abonnements** : repère les comptes qui ne vous suivent pas en retour et les relations réciproques.
- **Filtre par compte** : une pastille par compte avec son nombre d'éléments, pour traiter une source d'un coup.
- **Tout sélectionner** sur la vue filtrée, puis une seule action pour l'ensemble.
- Recherche, tri par date ou par nom, filtres par décision, sélection multiple.
- **Export** : page HTML à garder sur l'ordinateur, liste de liens, fichier CSV pour tableur, ou sauvegarde JSON réimportable.
- Les décisions sont conservées dans le navigateur ; la session se reprend après fermeture de l'onglet.

## Les images des publications enregistrées

L'archive Instagram contient vos propres photos et vidéos, mais **pas celles des publications
que vous avez enregistrées** : elles appartiennent à d'autres comptes. Pour ces publications,
l'export ne fournit que le compte, le lien et la date.

Le bouton **Aperçus**, désactivé par défaut, affiche ces publications grâce au lecteur public
d'Instagram, le même que celui utilisé pour intégrer une publication sur un site. La page
contacte alors instagram.com, qui voit quelles publications vous consultez. Aucune donnée de
votre archive n'est transmise et aucune connexion au compte n'est demandée. Les publications
des comptes privés et celles qui ont été supprimées ne s'affichent pas.

## Confidentialité

Aucune connexion à Instagram, aucun identifiant, aucun envoi de données. La page ne charge
aucune ressource externe : le fichier `.zip` est décompressé localement par le navigateur
(`DecompressionStream`), et les vignettes proviennent des fichiers de l'archive. La seule
exception est l'affichage des aperçus, qui est facultatif et désactivé tant que vous ne
l'activez pas.

## Obtenir son archive

Dans Instagram : **Paramètres → Centre de comptes → Vos informations et autorisations →
Télécharger vos informations**. Choisir le format **JSON**. Instagram envoie un lien par
e-mail, entre quelques minutes et 48 heures selon le volume.

## Garder sa bibliothèque sur son ordinateur

L'export **page HTML** produit un fichier autonome : la liste de vos enregistrements avec
un champ de recherche, et un bouton par publication pour en afficher l'aperçu. Il s'ouvre
dans n'importe quel navigateur, sans connexion pour la liste elle-même.

Les images et vidéos des publications enregistrées ne peuvent pas être téléchargées :
elles ne sont pas dans l'archive, et l'application ne récupère rien depuis Instagram.
Vos propres médias, eux, sont déjà dans l'archive, dans le dossier `media`.

## Limite connue

Instagram ne permet pas de supprimer ou de se désabonner en masse depuis l'extérieur.
L'application produit la liste des éléments à traiter ; les actions se font ensuite dans
l'application Instagram, lien par lien.

## Si rien ne se passe

La ligne en bas de l'écran d'import indique la version, le mode d'ouverture et le
navigateur. Elle signale aussi un contexte où la page ne peut pas fonctionner, comme
un aperçu intégré dans une visionneuse : dans ce cas, enregistrez le fichier et ouvrez-le
avec votre navigateur. Toute erreur inattendue s'affiche en clair dans cette zone.

Les archives RAR ou 7z ne sont pas lisibles par un navigateur. Instagram livre un `.zip` :
utilisez-le tel quel. Si l'export est livré en plusieurs parties, déposez tous les `.zip`
en une seule fois.

## Développement

Fichier unique `index.html`, sans dépendance ni étape de compilation. Ouvrir le fichier
dans un navigateur suffit. Le bouton « Essayer avec un exemple » charge un jeu de données
fictif pour parcourir l'interface sans archive.
