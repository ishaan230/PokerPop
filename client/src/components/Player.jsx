import React from 'react';
import Card from './Card';
import './Player.css';

const Player = ({ player, isCurrentTurn }) => {
  return (
    <div className={`player-box ${isCurrentTurn ? 'current-turn' : ''} ${player.hasFolded ? 'folded' : ''} ${player.isWinner ? 'winner' : ''}`}>
      <div className="player-info">
        <div className="player-name">{player.name} {player.isAI && '🤖'}</div>
        <div className="player-chips">${player.chips}</div>
      </div>
      
      <div className="player-cards">
        {player.holeCards && player.holeCards.map((card, idx) => {
          const isWinningCard = player.isWinner && player.handEvaluation?.cards?.some(c => c.suit === card.suit && c.rank === card.rank);
          return <Card key={idx} suit={card.suit} rank={card.rank} className={`hole-card ${isWinningCard ? 'winning-card' : ''}`} />
        })}
      </div>

      {player.currentBet > 0 && (
        <div className="player-bet">
          <div className="chip-icon"></div>
          ${player.currentBet}
        </div>
      )}

      {player.handEvaluation && (
        <div className={`hand-eval ${player.isWinner ? 'winner-eval' : ''}`}>
          {player.handEvaluation.name}
        </div>
      )}
    </div>
  );
};

export default Player;
