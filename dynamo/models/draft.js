require('dotenv').config();

const uuid = require('uuid/v4');
const createClient = require('../util');
const carddb = require('../../serverjs/carddb');
const { getObject, putObject } = require('../s3client');

const FIELDS = {
  ID: 'id',
  CUBE_ID: 'cube',
  OWNER: 'owner',
  CUBE_OWNER: 'cubeOwner',
  DATE: 'date',
  TYPE: 'type',
  COMPLETE: 'complete',
  NAME: 'name',
  SEAT_NAMES: 'seatNames',
};

const TYPES = {
  GRID: 'g',
  DRAFT: 'd',
  UPLOAD: 'u',
  SEALED: 's',
};

const REVERSE_TYPES = {
  g: 'Grid Draft',
  d: 'Draft',
  u: 'Upload',
  s: 'Sealed',
};

const client = createClient({
  name: 'DRAFT',
  partitionKey: FIELDS.ID,
  attributes: {
    [FIELDS.ID]: 'S',
    [FIELDS.CUBE_ID]: 'S',
    [FIELDS.CUBE_OWNER]: 'S',
    [FIELDS.OWNER]: 'S',
    [FIELDS.DATE]: 'N',
  },
  indexes: [
    {
      name: 'ByOwner',
      partitionKey: FIELDS.OWNER,
      sortKey: FIELDS.DATE,
    },
    {
      name: 'ByCube',
      partitionKey: FIELDS.CUBE_ID,
      sortKey: FIELDS.DATE,
    },
    {
      name: 'ByCubeOwner',
      partitionKey: FIELDS.CUBE_OWNER,
      sortKey: FIELDS.DATE,
    },
  ],
  FIELDS,
});

const assessColors = (mainboard, cards) => {
  const colors = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  };

  let count = 0;
  for (const card of mainboard.flat(3)) {
    const details = carddb.cardFromId(cards[card].cardID);
    if (!details.type.includes('Land')) {
      count += 1;
      for (const color of details.color_identity) {
        colors[color] += 1;
      }
    }
  }

  const threshold = 0.1;

  const colorKeysFiltered = Object.keys(colors).filter((color) => colors[color] / count > threshold);

  if (colorKeysFiltered.length === 0) {
    return ['C'];
  }

  return colorKeysFiltered;
};

const getCards = async (id) => {
  try {
    return getObject(process.env.DATA_BUCKET, `cardlist/${id}.json`);
  } catch (e) {
    return [];
  }
};

const addDetails = (cards) => {
  cards.forEach((card) => {
    card.details = {
      ...carddb.cardFromId(card.cardID),
    };
  });
  return cards;
};

const stripDetails = (cards) => {
  cards.forEach((card) => {
    delete card.details;
  });
  return cards;
};

const getSeats = async (id) => {
  try {
    return getObject(process.env.DATA_BUCKET, `seats/${id}.json`);
  } catch (e) {
    return {};
  }
};

const addS3Fields = async (document) => {
  const cards = await getCards(document.DraftId || document.id);
  const seats = await getSeats(document.DraftId || document.id);

  return {
    ...document,
    seats: seats.seats,
    basics: seats.basics,
    InitialState: seats.InitialState,
    cards: addDetails(cards),
  };
};

// make sure all card references use the card array
const sanitize = (document) => {
  const { cards } = document;

  const indexify = (card) => {
    // if it's an array
    if (Array.isArray(card)) {
      return card.map((c) => indexify(c));
    }

    // if it's already index return it
    if (typeof card === 'number') {
      return card;
    }

    if (typeof card === 'object' && card !== null) {
      const index = cards.findIndex((c) => c.cardID === card.cardID);

      if (index === -1) {
        return cards.findIndex((c) => c._id && c._id.equals(card.cardID));
      }

      return index;
    }

    return -1;
  };

  for (const seat of document.seats) {
    if (seat.Deck) {
      seat.Deck = seat.Deck.map(indexify);
    }

    if (seat.sideboard) {
      seat.sideboard = seat.sideboard.map(indexify);
    }

    if (seat.pickorder) {
      seat.pickorder = seat.pickorder.map(indexify);
    }

    if (seat.trashorder) {
      seat.trashorder = seat.trashorder.map(indexify);
    }
  }

  return document;
};

const draftIsCompleted = (draft) => {
  return draft.complete;
};

module.exports = {
  getById: async (id) => addS3Fields((await client.get(id)).Item),
  batchGet: async (ids) => {
    const documents = await client.batchGet(ids);
    return Promise.all(documents.map((document) => addS3Fields(document)));
  },
  getByOwner: async (owner, lastKey) => {
    const res = await client.query({
      IndexName: 'ByOwner',
      KeyConditionExpression: '#owner = :owner',
      ExpressionAttributeNames: {
        '#owner': FIELDS.OWNER,
      },
      ExpressionAttributeValues: {
        ':owner': owner,
      },
      ExclusiveStartKey: lastKey,
      ScanIndexForward: false,
    });

    return {
      items: res.Items.filter((item) => draftIsCompleted(item)),
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  },
  getByCube: async (cubeId, lastKey) => {
    const res = await client.query({
      IndexName: 'ByCube',
      KeyConditionExpression: '#cubeId = :cube',
      ExpressionAttributeNames: {
        '#cubeId': FIELDS.CUBE_ID,
      },
      ExpressionAttributeValues: {
        ':cube': cubeId,
      },
      ExclusiveStartKey: lastKey,
      ScanIndexForward: false,
    });

    return {
      items: res.Items.filter((item) => draftIsCompleted(item)),
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  },
  getByCubeOwner: async (cubeOwner, lastKey) => {
    const res = await client.query({
      IndexName: 'ByCubeOwner',
      KeyConditionExpression: '#cubeOwner = :cubeOwner',
      ExpressionAttributeNames: {
        '#cubeOwner': FIELDS.CUBE_OWNER,
      },
      ExpressionAttributeValues: {
        ':cubeOwner': cubeOwner,
      },
      ExclusiveStartKey: lastKey,
      ScanIndexForward: false,
    });

    return {
      items: res.Items.filter((item) => draftIsCompleted(item)),
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  },
  put: async (document) => {
    const id = document.id || uuid();

    const names = document.seats.map((seat) => assessColors(seat.mainboard, document.cards).join(''));

    await client.put({
      [FIELDS.ID]: id,
      [FIELDS.CUBE_ID]: document.cube,
      [FIELDS.OWNER]: document.owner,
      [FIELDS.CUBE_OWNER]: document.cubeOwner,
      [FIELDS.DATE]: document.date,
      [FIELDS.TYPE]: document.type,
      [FIELDS.COMPLETE]: document.complete,
      [FIELDS.NAME]: `${names[0]} ${REVERSE_TYPES[document.type]}`,
      [FIELDS.SEAT_NAMES]: names,
    });

    for (const seat of document.seats) {
      seat.name = assessColors(seat.mainboard, document.cards).join('');
    }

    await putObject(process.env.DATA_BUCKET, `cardlist/${id}.json`, stripDetails(document.cards));
    await putObject(process.env.DATA_BUCKET, `seats/${id}.json`, {
      seats: document.seats,
      basics: document.basics,
      InitialState: document.InitialState,
    });

    return id;
  },
  batchPut: async (documents) => {
    try {
      const filtered = [];
      const keys = new Set();

      for (const document of documents) {
        if (!keys.has(document.id)) {
          filtered.push(document);
          keys.add(document.id);
        }
      }

      const items = filtered.map((document) => ({
        [FIELDS.ID]: document[FIELDS.ID],
        [FIELDS.CUBE_ID]: document[FIELDS.CUBE_ID],
        [FIELDS.OWNER]: document[FIELDS.OWNER],
        [FIELDS.CUBE_OWNER]: document[FIELDS.CUBE_OWNER],
        [FIELDS.DATE]: document[FIELDS.DATE],
        [FIELDS.TYPE]: document[FIELDS.TYPE],
        [FIELDS.COMPLETE]: document[FIELDS.COMPLETE],
        [FIELDS.NAME]: document[FIELDS.NAME] ? document[FIELDS.NAME].slice(0, 300) : 'Untitled',
        [FIELDS.SEAT_NAMES]: document[FIELDS.SEAT_NAMES],
      }));

      await client.batchPut(items);

      await Promise.all(
        filtered.map(async (document) => {
          await putObject(
            process.env.DATA_BUCKET,
            `cardlist/${document.id}.json`,
            JSON.stringify(stripDetails(document.cards)),
          );
          await putObject(process.env.DATA_BUCKET, `seats/${document.id}.json`, {
            seats: document.seats,
            basics: document.basics,
            InitialState: document.InitialState,
          });
        }),
      );
    } catch (e) {
      console.log(e);
    }
  },
  createTable: async () => client.createTable(),
  convertDeck: (deck, draft, type) => {
    try {
      let cardCount = 0;
      for (const row of deck.seats[0].deck) {
        for (const col of row) {
          cardCount += col.length;
        }
      }

      if (cardCount === 0) {
        return [];
      }

      let cards = [];
      let initialState = {};
      let seatsForPickOrder = {};

      if (type === TYPES.DRAFT) {
        seatsForPickOrder = draft.seats;
        cards = deck.cards;
        initialState = draft.initial_state.map((seat) =>
          seat.map((pack) => {
            if (pack.cards) {
              return {
                steps: pack.steps,
                cards: pack.cards.map((idx) => cards.findIndex((card) => draft.cards[idx].cardID === card.cardID)),
              };
            }
            if (typeof pack === 'object') {
              return {
                cards: Object.values(pack).map((packCard) =>
                  cards.findIndex((card) => packCard.cardID === card.cardID),
                ),
              };
            }
            return {
              cards: pack.map((packCard) => cards.findIndex((card) => packCard.cardID === card.cardID)),
            };
          }),
        );
      } else if (type === TYPES.GRID) {
        seatsForPickOrder = draft.seats;
        cards = draft.cards;
        initialState = draft.initial_state.map((pack) =>
          pack.map((idx) => cards.findIndex((card) => draft.cards[idx].cardID === card.cardID)),
        );
      } else {
        seatsForPickOrder = deck.seats;
        cards = deck.cards;
      }

      if (!seatsForPickOrder[0].pickorder || seatsForPickOrder[0].pickorder.length === 0) {
        seatsForPickOrder = null;
      }

      const doc = sanitize({
        [FIELDS.ID]: `${deck.draft || deck._id}`,
        [FIELDS.CUBE_ID]: `${deck.cube}`,
        [FIELDS.CUBE_OWNER]: `${deck.cubeOwner}`,
        [FIELDS.OWNER]: `${deck.owner}`,
        [FIELDS.DATE]: deck.date.valueOf(),
        basics: deck.basics.map((card) => parseInt(card, 10)),
        cards,
        seats: deck.seats.map((seat, index) => ({
          owner: `${seat.userid}`,
          mainboard: seat.deck,
          sideboard: seat.sideboard,
          pickorder: seatsForPickOrder ? seatsForPickOrder[index].pickorder : null,
          trashorder: seatsForPickOrder ? seatsForPickOrder[index].trashorder : null,
          title: seat.name,
          body: seat.description,
          Bot: seat.bot,
        })),
        InitialState: initialState,
        [FIELDS.TYPE]: type,
        [FIELDS.COMPLETE]: true,
        [FIELDS.NAME]: deck.seats[0].name,
        [FIELDS.SEAT_NAMES]: deck.seats.map((seat) => seat.name),
      });

      return [doc];
    } catch (e) {
      console.log(`Erroring converting deck ${deck._id} of type ${type}`);
      console.log(e);
      return [];
    }
  },
  delete: async (id) => client.delete({ id }),
  scan: async (limit, lastKey) => {
    const result = await client.scan({
      ExclusiveStartKey: lastKey,
      Limit: limit || 36,
    });

    return {
      items: result.Items,
      lastKey: result.LastEvaluatedKey,
    };
  },
  FIELDS,
  TYPES,
};
