import React, { useCallback, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import DeckDeleteModal from 'components/DeckDeleteModal';
import DeckPropType from 'proptypes/DeckPropType';

import { cardsAreEquivalent } from 'utils/Card';

import { Collapse, Nav, Navbar, NavbarToggler, NavItem, NavLink, Input } from 'reactstrap';

import CSRFForm from 'components/CSRFForm';
import CustomImageToggler from 'components/CustomImageToggler';
import { buildDeck } from 'drafting/deckutil';
import BasicsModal from 'components/BasicsModal';
import withModal from 'components/WithModal';

const DeleteDeckModalLink = withModal(NavLink, DeckDeleteModal);
const BasicsModalLink = withModal(NavLink, BasicsModal);

const DeckbuilderNavbar = ({
  deck,
  addBasics,
  name,
  description,
  className,
  setSideboard,
  setDeck,
  seat,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = useCallback(
    (event) => {
      event.preventDefault();
      setIsOpen(!isOpen);
    },
    [isOpen],
  );

  const saveForm = useRef(null);
  const saveDeck = useCallback(
    (event) => {
      event.preventDefault();
      if (saveForm.current) {
        saveForm.current.submit();
      }
    },
    [saveForm],
  );

  const stripped = useMemo(() => {
    const res = JSON.parse(JSON.stringify(deck));

    for (const collection of [res.mainboard, res.sideboard]) {
      for (const row of collection) {
        for (const column of row) {
          column.forEach((card, index) => {
            if (!Number.isFinite(card)) {
              column[index] = deck.cards.findIndex((deckCard) => cardsAreEquivalent(deckCard, card));
            }
          });
        }
      }
    }

    return {
      sideboard: res.sideboard,
      mainboard: res.mainboard,
    };
  }, [deck]);

  const autoBuildDeck = useCallback(async () => {
    const main = [...deck.seats[seat].mainboard.flat(3), ...deck.seats[seat].sideboard.flat(3)];
    const { sideboard: side, deck: newDeck } = await buildDeck(deck.cards, main, deck.basics);
    const newSide = side.map((row) => row.map((col) => col.map((ci) => deck.cards[ci])));
    const newDeckCards = newDeck.map((row) => row.map((col) => col.map((ci) => deck.cards[ci])));
    setSideboard(newSide);
    setDeck(newDeckCards);
  }, [deck.seats, deck.cards, seat, deck.basics, setSideboard, setDeck]);

  return (
    <Navbar expand="md" light className={`usercontrols ${className}`} {...props}>
      <NavbarToggler onClick={toggleNavbar} className="ms-auto" />
      <Collapse isOpen={isOpen} navbar>
        <Nav navbar>
          <NavItem>
            <NavLink href="#" onClick={saveDeck}>
              Save Deck
            </NavLink>
            <CSRFForm className="d-none" innerRef={saveForm} method="POST" action={`/cube/deck/editdeck/${deck.id}`}>
              <Input type="hidden" name="main" value={JSON.stringify(stripped.mainboard)} />
              <Input type="hidden" name="side" value={JSON.stringify(stripped.sideboard)} />
              <Input type="hidden" name="title" value={name} />
              <Input type="hidden" name="description" value={description} />
            </CSRFForm>
          </NavItem>
          <NavItem>
            <DeleteDeckModalLink modalProps={{ deckID: deck.id, cubeID: deck.cube }}>Delete Deck</DeleteDeckModalLink>
          </NavItem>
          <NavItem>
            <BasicsModalLink
              modalProps={{
                basics: deck.basics,
                addBasics,
                deck: deck.mainboard.flat(3).map(({ index }) => index),
                cards: deck.cards,
              }}
            >
              Add Basic Lands
            </BasicsModalLink>
          </NavItem>
          <NavItem>
            <NavLink href="#" onClick={autoBuildDeck}>
              Build for Me
            </NavLink>
          </NavItem>
          <CustomImageToggler />
        </Nav>
      </Collapse>
    </Navbar>
  );
};

DeckbuilderNavbar.propTypes = {
  deck: DeckPropType.isRequired,
  addBasics: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  className: PropTypes.string,
  setDeck: PropTypes.func.isRequired,
  setSideboard: PropTypes.func.isRequired,
  seat: PropTypes.number.isRequired,
};

DeckbuilderNavbar.defaultProps = {
  className: null,
};

export default DeckbuilderNavbar;
