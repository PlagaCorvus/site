# Tri Instagram

Application web pour trier sa bibliothèque Instagram : publications, enregistrements,
« j'aime », abonnements et abonnés. Un seul fichier, aucune installation, aucun compte.

**En ligne :** [`tri-instagram/`](https://plagacorvus.github.io/site/tri-instagram/)

## Ce qu'elle fait

- Lit l'archive de données Instagram (format JSON), au choix le `.zip` tel quel ou le dossier décompressé.
- Affiche chaque catégorie séparément avec le nombre d'éléments restant à trier.
- **Mode tri rapide** : un élément à la fois, décision au clavier (← retirer, ↓ plus tard, → garder, Z annuler).
- **Vue liste ou grille** : vignettes pour les publications qui ont des images dans l'archive,
  lignes compactes avec pastille pour les comptes et les liens.
- **Abonnements** : repère les comptes qui ne vous suivent pas en retour et les relations réciproques.
- Recherche, tri par date ou par nom, filtres par décision, sélection multiple et action groupée.
- **Export** : liste de liens à traiter, fichier CSV pour tableur, ou sauvegarde JSON réimportable.
- Les décisions sont conservées dans le navigateur ; la session se reprend après fermeture de l'onglet.

## Confidentialité

Aucune connexion à Instagram, aucun identifiant, aucun envoi de données. La page ne charge
aucune ressource externe : le fichier `.zip` est décompressé localement par le navigateur
(`DecompressionStream`), et les vignettes proviennent des fichiers de l'archive.

## Obtenir son archive

Dans Instagram : **Paramètres → Centre de comptes → Vos informations et autorisations →
Télécharger vos informations**. Choisir le format **JSON**. Instagram envoie un lien par
e-mail, entre quelques minutes et 48 heures selon le volume.

## Limite connue

Instagram ne permet pas de supprimer ou de se désabonner en masse depuis l'extérieur.
L'application produit la liste des éléments à traiter ; les actions se font ensuite dans
l'application Instagram, lien par lien.

## Développement

Fichier unique `index.html`, sans dépendance ni étape de compilation. Ouvrir le fichier
dans un navigateur suffit. Le bouton « Essayer avec un exemple » charge un jeu de données
fictif pour parcourir l'interface sans archive.
