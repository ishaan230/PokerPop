import React from 'react';
import './Card.css';

const Card = ({ suit, rank, className = '' }) => {
  const isHidden = suit === 'Hidden';
  
  if (isHidden) {
    return (
      <div className={`playing-card card-back ${className}`}>
        <div className="card-pattern"></div>
      </div>
    );
  }

  const isRed = suit === 'Hearts' || suit === 'Diamonds';
  const suitSymbol = {
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣',
    'Spades': '♠'
  }[suit];

  // Convert 'T' to '10' for display
  const displayRank = rank === 'T' ? '10' : rank;

  return (
    <div className={`playing-card ${isRed ? 'red' : 'black'} ${className}`}>
      <div className="card-top-left">
        <div className="rank">{displayRank}</div>
        <div className="suit">{suitSymbol}</div>
      </div>
      <div className="card-center">
        {suitSymbol}
      </div>
      <div className="card-bottom-right">
        <div className="rank">{displayRank}</div>
        <div className="suit">{suitSymbol}</div>
      </div>
    </div>
  );
};

export default Card;
