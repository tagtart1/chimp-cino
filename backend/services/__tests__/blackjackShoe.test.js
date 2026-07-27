import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRemainingShoe,
  drawRandomCard,
} from "../blackjackShoe.js";

const cardCatalog = [
  { id: 1, rank: "A", suit: "S", value: 11 },
  { id: 2, rank: "K", suit: "S", value: 10 },
];

test("buildRemainingShoe derives a two-deck shoe from dealt cards", () => {
  const hands = [
    {
      cards: [
        { ...cardCatalog[0], sequence: 1 },
        { ...cardCatalog[0], sequence: 2 },
        { ...cardCatalog[1], sequence: 3 },
      ],
    },
  ];

  assert.deepEqual(buildRemainingShoe(cardCatalog, hands, 2), [
    cardCatalog[1],
  ]);
});

test("buildRemainingShoe rejects more dealt copies than the configured decks", () => {
  const hands = [
    {
      cards: [
        { ...cardCatalog[0], sequence: 1 },
        { ...cardCatalog[0], sequence: 2 },
        { ...cardCatalog[0], sequence: 3 },
      ],
    },
  ];

  assert.throws(
    () => buildRemainingShoe(cardCatalog, hands, 2),
    (error) => error.code === "SERVER_ERROR"
  );
});

test("drawRandomCard removes the selected card from the in-memory shoe", () => {
  const shoe = [...cardCatalog];
  const selected = drawRandomCard(shoe);

  assert.equal(shoe.length, 1);
  assert.ok(cardCatalog.includes(selected));
  assert.ok(!shoe.includes(selected));
});
