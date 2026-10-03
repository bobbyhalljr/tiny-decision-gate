# tiny-decision-gate

A tiny decision gate in one TypeScript file.
It scores only the answers you listed, then turns those scores into `act`, `ask` or `skip` with thresholds that live in code.
The scorer is a mock. No API key.

## Why it matters

A probability is not a permission.

A decision model can return a score.
Your code decides whether that score is allowed to move anything.
A refund score of 0.50 should not issue a refund. It should ask.

This is not Cloudflare's Clef.
Clef is a trained model.
The scorer here counts keywords and turns the counts into shares with a softmax.
The policy around it is the part worth keeping.

## Run it

You need Node.js 18 or newer.

```bash
npm install
npx tsx gate.ts
```

## Example output

This is real output from `npx tsx gate.ts`:

```text
STATE  Checkout has been failing for every customer for the last hour. Please refund order 4412.
urgent   noul    yes 0.88           act  urgent 0.88 clears 0.80
team     choice  technical 0.67     act  technical 0.67 clears 0.60
refund   noul    yes 0.50           ask  money stays with a human

STATE  Love the new checkout page. Can someone send me the enterprise plan?
urgent   noul    yes 0.27           skip urgent 0.27 stays under 0.80
team     choice  sales 0.58         ask  sales 0.58 is too close to call
refund   noul    yes 0.27           skip no refund was asked
```

The outage gets a technical route.
The refund waits for a person.
The compliment does not page anyone.
The plan question is close enough that a person should see it.

## How it works

```text
State ──→ scored questions ──→ probabilities
                                      │
                                your thresholds
                                      │
                                act / ask / skip
```

| File | What it does |
| --- | --- |
| `gate.ts` | The whole gate, in the same order as the post |
| `output.txt` | Real output of `npx tsx gate.ts` |
| `package.json` | `tsx`, `typescript` and `@types/node` as dev dependencies |
| `tsconfig.json` | Strict settings for `npx tsc --noEmit` |

Inside `gate.ts`:

- `Noul` and `Choice`: a yes or no question, and a pick from options you wrote
- `hits` and `share`: the mock scorer. Keyword counts, then a softmax
- `decide`: scores one question against one message
- `policy`: the thresholds. Urgent acts at 0.80. A team acts at 0.60. A refund always asks
- `questions` and `states`: the example questions and two made-up support messages

## Limits

- The score is not a probability. It is a softmax over keyword hits, and related phrases double count.
- With no matches, a yes or no question lands near 0.27. That is a prior, not confidence.
- 0.80 and 0.60 are demo numbers. They are not a research result.
- Keyword lists stand in for natural-language criteria.
- The support messages are made up.

## Read more

- Dev.to: [Cloudflare Launched Clef. Let's Build a Tiny Decision Gate in TypeScript.](https://dev.to/bobbyhalljr/cloudflare-launched-clef-lets-build-a-tiny-decision-gate-in-typescript-can)
- More of my writing: [bhjr.dev](https://bhjr.dev)

## License

MIT. See [LICENSE](LICENSE).
