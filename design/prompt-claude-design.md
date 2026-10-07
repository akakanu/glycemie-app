# Prompt Claude Design : GlycoSuivi

Prompt utilisé pour générer la maquette de l'app dans Claude Design (accueil, inscription, connexion, saisie, résultat, historique).

Conseils d'utilisation :
- Valider d'abord le système visuel et l'accueil, puis demander les autres écrans un par un.
- « GlycoSuivi » est un nom provisoire.
- Déposer l'export de la maquette dans `context/import/` ou partager le lien.

---

```
Conçois l'interface d'une application web de suivi de la glycémie, en français (Québec).
C'est un MVP : interface sobre, rassurante et claire, pensée d'abord pour le mobile
puis adaptée au bureau.

## Contexte produit
- Nom provisoire : « GlycoSuivi » (propose 2 ou 3 variantes de logo texte simple)
- Utilisateurs : grand public, adultes de tout âge, y compris des personnes peu à l'aise
  avec la technologie. Lisibilité avant tout : texte de base de 16 px minimum,
  bon contraste (WCAG AA) et grandes zones cliquables.
- Ton : bienveillant, jamais alarmiste ni culpabilisant. Tutoiement évité, vouvoiement.
- Unité de glycémie : mmol/L uniquement.
- L'app donne de l'information générale, pas un diagnostic. Un avertissement médical
  doit apparaître sur l'accueil et sur la page résultat.

## Système visuel
- Une couleur principale apaisante (bleu ou turquoise santé) et des neutres doux.
- 4 couleurs de niveau glycémique, toujours accompagnées d'une icône ET d'un libellé
  (jamais la couleur seule) :
  - Bas : violet ou bleu soutenu
  - Normal : vert
  - Élevé : orange ou ambre
  - Très élevé : rouge
- Définis les tokens (couleurs, typographie, espacements, rayons, ombres) et
  les composants réutilisables : bouton primaire/secondaire, champ de formulaire avec
  état d'erreur, carte, badge de niveau, barre de navigation, message d'alerte.
- Prévois une barre de navigation : non connecté (Accueil, Connexion, Créer un compte)
  et connecté (Nouvelle mesure, Historique, Déconnexion).

## Écrans à concevoir

1. Accueil (public)
   - Titre accrocheur, phrase expliquant le principe : « Saisissez votre glycémie,
     comprenez votre résultat, suivez votre évolution. »
   - 3 bénéfices illustrés par des icônes (simple, adapté au moment du repas, historique)
   - Boutons « Créer un compte » (principal) et « Se connecter » (secondaire)
   - Avertissement médical discret en bas de page

2. Inscription
   - Champs : prénom, courriel, mot de passe (8 caractères minimum, indicateur
     de robustesse), confirmation du mot de passe
   - Case à cocher : « J'ai compris que cette application ne remplace pas un avis médical »
   - Montre un état d'erreur (courriel déjà utilisé, mots de passe différents)
   - Lien « Déjà un compte ? Se connecter »

3. Connexion
   - Champs : courriel, mot de passe (avec bouton afficher/masquer)
   - Montre un état d'erreur « Courriel ou mot de passe incorrect »
   - Lien « Pas encore de compte ? En créer un »

4. Saisie d'une mesure (connecté)
   - Grand champ numérique pour la valeur, suffixe « mmol/L », plage acceptée 1.0 à 33.3
   - Choix du moment, sous forme de 4 grandes cartes sélectionnables avec icône :
     À jeun / 1 h après le repas / 2 h après le repas / 4 h et plus après le repas
   - Date et heure (préremplies à maintenant, modifiables)
   - Note facultative (ex. « après le sport »)
   - Bouton « Analyser ma glycémie »
   - Montre un état d'erreur (valeur hors plage, moment non choisi)

5. Résultat (connecté)
   - Mise en avant de la valeur (ex. 8.4 mmol/L) et du moment (2 h après le repas)
   - Badge de niveau coloré avec icône et libellé (ex. « Élevé »)
   - Jauge ou barre horizontale situant la valeur entre les seuils bas, normal,
     élevé et très élevé
   - Phrase d'interprétation + 2 à 4 conseils sous forme de liste
   - Avertissement médical bien visible
   - Boutons « Nouvelle mesure » et « Voir mon historique »
   - Décline cet écran pour les 4 niveaux. Exemple pour Bas (3.6 à jeun) :
     conseil de la règle du 15/15 (15 g de sucre rapide, recontrôler après 15 minutes),
     mis en évidence comme action prioritaire

6. Historique (connecté)
   - Liste des mesures, la plus récente en haut : date et heure, moment, valeur,
     badge de niveau. Format carte sur mobile, tableau sur bureau
   - Filtre simple par moment de mesure
   - Clic sur une mesure : ouvre son résultat
   - Montre l'état vide : « Aucune mesure pour l'instant » avec bouton
     « Ajouter ma première mesure »

## Contraintes pour l'intégration
- L'interface sera développée en Angular : garde des composants cohérents et
  réutilisables d'un écran à l'autre, sans effets complexes.
- Utilise des données d'exemple réalistes (valeurs entre 3.5 et 14 mmol/L, dates
  récentes, prénom « Marie »).
- Pour chaque écran, livre une version mobile (375 px) et une version bureau (1280 px).
```
