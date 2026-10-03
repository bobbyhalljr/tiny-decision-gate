// Tiny decision gate. Companion code for "Cloudflare Launched Clef. Let's Build a Tiny Decision Gate in TypeScript.".
// MOCKED: this is not Clef. The scorer counts keywords and softmaxes the counts.
// The support messages are made up. The 0.80 and 0.60 thresholds are demo numbers.
// No API key. No network. Run with: npx tsx gate.ts

type Noul = { type: "noul"; yesIf: string[] };
type Choice = { type: "choice"; options: Record<string, string[]> };
type Question = Noul | Choice;

type Answer =
  | { type: "noul"; yes: number }
  | { type: "choice"; pick: string; probs: Record<string, number> };

const round = (n: number) => Math.round(n * 100) / 100;

function hits(text: string, needles: string[]) {
  const hay = text.toLowerCase();
  return needles.filter((needle) => hay.includes(needle)).length;
}

function share(weights: number[]) {
  const lifted = weights.map((weight) => Math.exp(weight));
  const total = lifted.reduce((sum, value) => sum + value, 0);
  return lifted.map((value) => value / total);
}

function decide(question: Question, state: string): Answer {
  if (question.type === "noul") {
    const [yes] = share([hits(state, question.yesIf), 1]);
    return { type: "noul", yes: round(yes) };
  }

  const names = Object.keys(question.options);
  const probs = share(names.map((name) => hits(state, question.options[name])));
  const scored = Object.fromEntries(names.map((name, i) => [name, round(probs[i])]));
  const pick = names.reduce((best, name) => (scored[name] > scored[best] ? name : best));
  return { type: "choice", pick, probs: scored };
}

type Action = "act" | "ask" | "skip";

function policy(id: string, answer: Answer): { action: Action; reason: string } {
  if (id === "refund" && answer.type === "noul") {
    return answer.yes >= 0.4
      ? { action: "ask", reason: "money stays with a human" }
      : { action: "skip", reason: "no refund was asked" };
  }

  if (answer.type === "noul" && id === "urgent") {
    return answer.yes >= 0.8
      ? { action: "act", reason: `urgent ${answer.yes} clears 0.80` }
      : { action: "skip", reason: `urgent ${answer.yes} stays under 0.80` };
  }

  if (answer.type === "choice" && id === "team") {
    const confidence = answer.probs[answer.pick];
    return confidence >= 0.6
      ? { action: "act", reason: `${answer.pick} ${confidence} clears 0.60` }
      : { action: "ask", reason: `${answer.pick} ${confidence} is too close to call` };
  }

  return { action: "skip", reason: "no rule" };
}

const questions: Record<string, Question> = {
  urgent: { type: "noul", yesIf: ["failing", "every customer", "last hour"] },
  team: {
    type: "choice",
    options: {
      billing: ["refund", "invoice", "payment"],
      technical: ["failing", "every customer"],
      sales: ["plan", "upgrade", "pricing"],
    },
  },
  refund: { type: "noul", yesIf: ["refund"] },
};

const states = [
  "Checkout has been failing for every customer for the last hour. Please refund order 4412.",
  "Love the new checkout page. Can someone send me the enterprise plan?",
];

for (const state of states) {
  console.log(`\nSTATE  ${state}`);
  for (const [id, question] of Object.entries(questions)) {
    const answer = decide(question, state);
    const gate = policy(id, answer);
    const detail =
      answer.type === "noul"
        ? `yes ${answer.yes.toFixed(2)}`
        : `${answer.pick} ${answer.probs[answer.pick].toFixed(2)}`;
    console.log(`${id.padEnd(8)} ${answer.type.padEnd(7)} ${detail.padEnd(18)} ${gate.action.padEnd(4)} ${gate.reason}`);
  }
}
