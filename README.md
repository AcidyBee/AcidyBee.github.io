# acidybee.github.io

Code source du portfolio d'Alexis Bourgeois (AcidyBee), construit avec [Quarto](https://quarto.org).
Le site est bilingue : le français à la racine, l'anglais sous `/en/`.

## Démarrage rapide

1. Installez Quarto (≥ 1.7) depuis quarto.org, puis vérifiez dans le Terminal de RStudio : `quarto --version`.
2. Ouvrez `AcidyBee.github.io.Rproj` dans RStudio.
3. Pour travailler sur une page, ouvrez son `.qmd` et cliquez sur **Render**, ou lancez dans le Terminal :

   ```sh
   quarto preview                 # version française, rechargée à chaque sauvegarde
   quarto preview --profile en    # version anglaise
   ```

   `quarto preview` ne construit qu'une langue à la fois : depuis l'aperçu français, le bouton **EN**
   mène donc à une page introuvable (404). C'est normal.

4. Pour voir le site complet (FR + EN), exactement comme en ligne :

   ```sh
   ./preview.sh      # construit les deux langues, puis ouvrir http://localhost:8000
   ```

## Arborescence

```
_quarto.yml            configuration commune (thème, navbar, pied de page)
_quarto-fr.yml         profil français : menu, pages à rendre, dossier de sortie
_quarto-en.yml         profil anglais
build.sh               construit les deux langues et les fusionne dans _site/
preview.sh             build.sh + petit serveur local pour tout parcourir

index.qmd              accueil            ┐
about.qmd              parcours           │ pages françaises
projects.qmd           liste des études   │
skills.qmd             compétences        │
publications.qmd       publications       │
contact.qmd            contact            ┘
projects/              une fiche .qmd par étude de cas (+ _metadata.yml)
en/                    les mêmes fichiers, en anglais

data/                  contenu structuré, partagé par les deux langues
  publications.yml     une entrée par référence
  skills.yml           compétences par groupe (fr/en)
  timeline.yml         chronologie du parcours (fr/en)
  pav_web.json         points du hexbin (produit par le dépôt pav-grenoble-hexbin)

_partials/             gabarits HTML
  head.html            polices Google Fonts
  after-body.html      charge assets/js/site.js
  title-block.html     en-tête de page et de fiche projet (résultat clé, fiche signalétique)
  *.ejs                gabarits des listes : cartes projet, publications, compétences, chronologie

assets/
  scss/                thème : light.scss, dark.scss, puis un fichier par zone (_home, _case…)
  js/site.js           bouton de langue, copie de l'e-mail, filtres des projets
  js/hexbin.js         carte hexbin interactive de l'accueil
  img/                 images
```

## Comment ça marche

**Deux langues, deux profils.** Un profil Quarto est un fichier `_quarto-<nom>.yml` qui complète `_quarto.yml`.
Le profil `fr` rend la racine (sans `en/`), le profil `en` ne rend que `en/`. `build.sh` lance les deux puis fusionne.
Chaque page a le même nom de fichier dans les deux langues : c'est ce qui permet au bouton FR/EN de retrouver la page correspondante.

**Le contenu d'abord, la présentation ensuite.**
- Le texte vit dans les `.qmd` (Markdown) et les `.yml` de `data/`.
- La mise en forme vit dans `assets/scss/`. Les blocs `::: {.nom}` des `.qmd` posent une classe CSS, que le SCSS met en forme.
- Les couleurs sont des « jetons » (`--honey`, `--slate`…) définis deux fois : dans `light.scss` et dans `dark.scss`. Tous les composants utilisent ces jetons, d'où un mode sombre sans effort.

**Les listings.** Quarto sait transformer une série de fichiers (ou un `.yml`) en liste : voir le bloc `listing:` en tête de `projects.qmd`, `publications.qmd`, etc.
Le gabarit `.ejs` décrit le HTML d'un élément. Syntaxe (modèles lodash) : `<% code %>` pour la logique, `<%= valeur %>` pour insérer une valeur.

**Les fiches projet.** Tout ce qui est « fiche signalétique » est dans le front matter (période, cadre, rôle, résultat clé, outils, liens) et affiché par `_partials/title-block.html`.
Le corps ne contient que le récit (Contexte, Question, Données, Méthode, Résultats) et les figures. Les numéros dans les hexagones sont ajoutés par le CSS.

**Titres d'onglet.** Chaque page a son propre titre d'onglet (`pagetitle:` dans le front matter), par exemple « Parcours · Alexis Bourgeois ».
C'est ce titre qui apparaît dans les favoris, l'historique et les résultats de recherche.

## Tâches courantes

**Ajouter une étude de cas**
1. Copiez `projects/sensigaspi.qmd` sous un nouveau nom, par exemple `projects/mon-projet.qmd`.
2. Modifiez le front matter et le texte ; déposez les images dans `assets/img/`.
3. `order:` fixe la position dans la liste, `featured: true` la met à la une de l'accueil (gardez-en trois).
4. Faites de même dans `en/projects/mon-projet.qmd`.

**Ajouter une publication** : une entrée dans `data/publications.yml` (une seule fois pour les deux langues). Pensez à mettre à jour les totaux dans le titre et le chapeau de `publications.qmd` et `en/publications.qmd`.

**Ajouter une compétence** : une ligne dans `data/skills.yml` (`level` : 1 à 3 ; `case` : nom de fichier d'une fiche, facultatif).

**Changer une couleur** : modifiez le jeton dans `assets/scss/light.scss` et/ou `dark.scss`.

**Mettre à jour le hexbin** : relancez le pipeline du dépôt `pav-grenoble-hexbin`, puis copiez `outputs/pav_web.json` dans `data/`.

## Publication sur GitHub Pages

Le fichier `.github/workflows/publish.yml` construit et publie le site à chaque `git push` sur `main`.
Réglage à faire une seule fois sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
Le dossier `_site/` n'est pas versionné (voir `.gitignore`) : c'est GitHub qui le reconstruit.

## Pièges rencontrés (et évités)

- Un bloc `::: {}` sans classe n'est pas reconnu par Pandoc : toujours lui donner un nom (`::: {.aud-item}`).
- Certaines classes sont réservées par Quarto : `.proof` (preuve mathématique), `.callout-*`, `.column-*`… d'où `.proofs`.
- Dans les gabarits `.ejs` : pas d'indentation ni de ligne vide (Pandoc relit le HTML comme du Markdown), et pas de balise `<% %>` dans les commentaires.
- Le champ `labels` est réservé par Quarto : les libellés des fiches sont sous `ui:` dans `projects/_metadata.yml`.
- Dans un profil, une valeur qui ressemble à un dossier existant est traitée comme un chemin : d'où `lang: en-GB` plutôt que `lang: en`.
- Les chemins vers `assets/js` et `data/` sont absolus (`/assets/js/…`) : le site doit être servi à la racine d'un domaine, ce qui est le cas sur `acidybee.github.io` et avec `quarto preview`.
