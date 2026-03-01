import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("french_learning.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    definition TEXT,
    example TEXT,
    type TEXT,
    level TEXT DEFAULT 'B1'
  );

  CREATE TABLE IF NOT EXISTS dictations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    level TEXT DEFAULT 'B1'
  );

  CREATE TABLE IF NOT EXISTS sentence_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_sentence TEXT NOT NULL,
    scrambled_words TEXT NOT NULL,
    context TEXT NOT NULL,
    level TEXT DEFAULT 'B1'
  );
`);

// Seed some data if empty
const count = db.prepare("SELECT count(*) as count FROM vocabulary").get() as { count: number };
// Check if first word is translated to Arabic, if not, re-seed
const firstWord = db.prepare("SELECT translation FROM vocabulary LIMIT 1").get() as { translation: string } | undefined;
const needsReseed = !firstWord || !/[\u0600-\u06FF]/.test(firstWord.translation);

if (count.count === 0 || needsReseed) {
  db.exec("DELETE FROM vocabulary");
  const insertVocab = db.prepare("INSERT INTO vocabulary (word, translation, definition, example, type, level) VALUES (?, ?, ?, ?, ?, ?)");
  const sampleVocab = [
    ["Épanouissement", "ازدهار / تفتح", "Action de se développer pleinement.", "Le travail est une source d'épanouissement personnel.", "noun", "B2"],
    ["Incontournable", "لا غنى عنه / لا مفر منه", "Qu'on ne peut pas éviter.", "C'est un monument incontournable de Paris.", "adj", "B1"],
    ["Désormais", "من الآن فصاعدا", "À partir de maintenant.", "Désormais, nous utiliserons cette nouvelle méthode.", "adv", "B2"],
    ["Néanmoins", "ومع ذلك / بَيْدَ أن", "Pourtant, cependant.", "Il est fatigué, néanmoins il continue de travailler.", "adv", "B1"],
    ["Subir", "خضع لـ / عانى من", "Éprouver quelque chose de pénible.", "L'entreprise a subi de lourdes pertes.", "verb", "B1"],
    ["Améliorer", "حسّن / طوّر", "Rendre meilleur.", "Il veut améliorer son niveau de français.", "verb", "B1"],
    ["Quotidien", "يومي", "Qui se fait chaque jour.", "C'est une tâche de la vie quotidienne.", "adj", "B1"],
    ["S'avérer", "تبيّن / اتضح", "Se révéler comme vrai.", "Cette solution s'est avérée efficace.", "verb", "B2"],
    ["Toutefois", "بيد أن / غير أن", "Marque l'opposition.", "Il est intelligent, toutefois il manque de rigueur.", "adv", "B2"],
    ["Davantage", "أكثر / مزيد", "En plus grande quantité.", "Nous devons travailler davantage pour réussir.", "adv", "B2"],
    ["Auparavant", "سابقاً / من قبل", "Avant cela.", "Il vivait à Lyon auparavant.", "adv", "B2"],
    ["Demeurer", "بقي / ظلّ", "Rester dans un état.", "Le mystery demeure entier.", "verb", "B2"],
    ["Entraîner", "أدّى إلى / تسبب في", "Avoir pour conséquence.", "Cette décision va entraîner des changements.", "verb", "B2"],
    ["Parvenir", "بلّغ / توصّل إلى", "Arriver à un but.", "Il est parvenu à ses fins.", "verb", "B2"],
    ["Songer", "فكّر / تأمّل", "Penser à quelque chose.", "Il songe à changer de carrière.", "verb", "B2"],
    ["Contrecarrer", "أحبط / عارض", "S'opposer à quelque chose.", "Ils ont réussi à contrecarrer ses plans.", "verb", "B2"],
    ["Éphémère", "زائل / عابر", "Qui ne dure pas longtemps.", "La beauté des fleurs est éphémère.", "adj", "B1"],
    ["Vraisemblable", "محتمل / مرجّح", "Qui semble vrai.", "C'est une explication tout à fait vraisemblable.", "adj", "B2"],
    ["Susciter", "أثار / أوجد", "Faire naître un sentiment.", "Son discours a suscité beaucoup d'intérêt.", "verb", "B1"],
    ["Dérisoire", "تافه / ضئيل", "Qui est très faible.", "Il a reçu une somme dérisoire.", "adj", "B2"],
    ["Aisé", "سهل / ميسور الحال", "Qui se fait sans effort.", "C'est une tâche aisée pour lui.", "adj", "B1"],
    ["Farfelu", "غريب الأطوار", "Qui est un peu fou.", "Il a toujours des idées farfelues.", "adj", "B2"],
    ["Gaspiller", "بدّد / أهدر", "Dépenser inutilement.", "Il ne faut pas gaspiller l'eau.", "verb", "B1"],
    ["Héberger", "استضاف / آوى", "Donner un logement.", "Elle peut héberger ses amis ce week-end.", "verb", "B1"],
    ["Insolite", "غير مألوف / غريب", "Qui étonne par son caractère inhabituel.", "C'est un endroit insolite et charmant.", "adj", "B1"],
    ["Jadis", "قديماً / في غابر الأزمان", "Dans le passé.", "Jadis, il y avait un château ici.", "adv", "B2"],
    ["Labeur", "كدّ / جهد", "Travail pénible et prolongé.", "C'est le fruit de son long labeur.", "noun", "B2"],
    ["Ménager", "وفّر / عامل بلطف", "Traiter avec attention.", "Il faut ménager sa santé.", "verb", "B2"],
    ["Nocif", "ضار / مؤذٍ", "Qui est dangereux pour la santé.", "Le tabac est nocif pour les poumons.", "adj", "B1"],
    ["Occulter", "حجب / أخفى", "Cacher quelque chose.", "Il essaie d'occulter la vérité.", "verb", "B2"],
    ["Pénurie", "نقص / شحّ", "Manque de ce qui est nécessaire.", "Il y a une pénurie de main-d'œuvre.", "noun", "B2"],
    ["Quête", "سعي / بحث", "Action de chercher.", "Il est en quête de vérité.", "noun", "B1"],
    ["Rédiger", "حرّر / صاغ", "Écrire un texte.", "Il doit rédiger un rapport.", "verb", "B1"],
    ["S'enquérir", "استفسر / استعلم", "Chercher à savoir.", "Il s'est enquis de votre santé.", "verb", "B2"],
    ["Téméraire", "متهور / جريء", "Qui est trop hardi.", "C'est une décision téméraire.", "adj", "B2"],
    ["Utopique", "خيالي / طوباوي", "Qui appartient à une utopie.", "C'est un projet utopique.", "adj", "B2"],
    ["Vigoureux", "قوي / نشيط", "Qui a de la force.", "Il a fait un effort vigoureux.", "adj", "B1"],
    ["Zélé", "متحمس / غيور", "Qui montre du zèle.", "C'est un employé très zélé.", "adj", "B2"]
  ];
  
  for (const vocab of sampleVocab) {
    insertVocab.run(...vocab);
  }

  const insertDictation = db.prepare("INSERT INTO dictations (title, content, level) VALUES (?, ?, ?)");
  insertDictation.run(
    "Le Petit Prince",
    "C'est ainsi que j'ai fait la connaissance du petit prince. Il habitait sur une planète à peine plus grande qu'une maison.",
    "B1"
  );
  insertDictation.run(
    "La Gastronomie Française",
    "La cuisine française est réputée dans le monde entier pour sa finesse et sa diversité. Elle fait partie du patrimoine culturel immatériel de l'humanité.",
    "B2"
  );
  insertDictation.run(
    "Le Voyage en Train",
    "Le train est un moyen de transport très populaire en France. Il permet de traverser le pays rapidement tout en profitant des paysages variés.",
    "B1"
  );
  insertDictation.run(
    "L'Éducation en France",
    "L'école est obligatoire en France dès l'âge de trois ans. Le système éducatif est divisé en trois étapes : l'école primaire, le collège et le lycée.",
    "B1"
  );
  insertDictation.run(
    "La Protection de l'Environnement",
    "La lutte contre le changement climatique est un défi majeur de notre siècle. Il est essentiel de réduire notre empreinte carbone pour préserver la planète.",
    "B2"
  );

  const insertChallenge = db.prepare("INSERT INTO sentence_challenges (target_sentence, scrambled_words, context, level) VALUES (?, ?, ?, ?)");
  const sampleChallenges = [
    [
      "Il est primordial de préserver la biodiversité pour les générations futures.",
      "Il,est,primordial,de,préserver,la,biodiversité,pour,les,générations,futures",
      "عبّر عن ضرورة الحفاظ على التنوع البيولوجي من أجل الأجيال القادمة.",
      "B2"
    ],
    [
      "La technologie numérique a transformé notre façon de communiquer au quotidien.",
      "La,technologie,numérique,a,transformé,notre,façon,de,communiquer,au,quotidien",
      "تحدث عن أثر التكنولوجيا الرقمية في تغيير طريقة تواصلنا اليومية.",
      "B2"
    ],
    [
      "Bien que ce projet soit ambitieux, il nécessite une planification rigoureuse.",
      "Bien,que,ce,projet,soit,ambitieux,il,nécessite,une,planification,rigoureuse",
      "أشر إلى أن المشروع طموح لكنه يتطلب تخطيطاً دقيقاً.",
      "B2"
    ]
  ];

  for (const challenge of sampleChallenges) {
    insertChallenge.run(...challenge);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/vocabulary", (req, res) => {
    const level = req.query.level || 'B1';
    const limit = parseInt(req.query.limit as string) || 15;
    const words = db.prepare("SELECT * FROM vocabulary WHERE level = ? ORDER BY RANDOM() LIMIT ?").all(level, limit);
    res.json(words);
  });

  app.get("/api/dictations", (req, res) => {
    const level = req.query.level || 'B1';
    const dictations = db.prepare("SELECT * FROM dictations WHERE level = ?").all(level);
    res.json(dictations);
  });

  app.get("/api/challenges", (req, res) => {
    const level = req.query.level || 'B2';
    const challenges = db.prepare("SELECT * FROM sentence_challenges WHERE level = ?").all(level);
    res.json(challenges.map((c: any) => ({
      targetSentence: c.target_sentence,
      scrambledWords: c.scrambled_words.split(','),
      context: c.context
    })));
  });

  app.get("/api/stats", (req, res) => {
    const vocabCount = db.prepare("SELECT count(*) as count FROM vocabulary").get() as { count: number };
    const dictationCount = db.prepare("SELECT count(*) as count FROM dictations").get() as { count: number };
    const challengeCount = db.prepare("SELECT count(*) as count FROM sentence_challenges").get() as { count: number };
    res.json({
      vocabulary: vocabCount.count,
      dictations: dictationCount.count,
      challenges: challengeCount.count
    });
  });

  app.post("/api/vocabulary", (req, res) => {
    const { word, translation, example, level, category } = req.body;
    const info = db.prepare("INSERT INTO vocabulary (word, translation, example, level, category) VALUES (?, ?, ?, ?, ?)").run(word, translation, example, level, category);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
