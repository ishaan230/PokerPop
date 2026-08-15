import React, { useState, useEffect, useRef } from 'react';
import Player from './Player';
import Card from './Card';
import HelpModal from './HelpModal';
import './Table.css';

const Table = ({ gameState, socketId, onAction, onStart, onAdminAction }) => {
  const {
    stage,
    pot,
    currentHighestBet,
    communityCards,
    currentPlayerIndex,
    players,
    actionHistory
  } = gameState;

  // Determine if it's our turn
  const myPlayerIndex = players.findIndex(p => p.id === socketId);
  const isMyTurn = currentPlayerIndex === myPlayerIndex && stage !== 'SHOWDOWN' && stage !== 'WAITING';
  const myPlayer = players[myPlayerIndex];

  const minRaise = currentHighestBet > 0 ? currentHighestBet * 2 : 40;
  const activeOpponents = players.filter(p => p.id !== socketId && !p.hasFolded);
  const maxOpponentTotal = activeOpponents.length > 0
    ? Math.max(...activeOpponents.map(p => p.chips + p.currentBet))
    : 0;

  const maxAllowedTotalBet = myPlayer
    ? Math.min(myPlayer.chips + myPlayer.currentBet, maxOpponentTotal)
    : 0;

  const calculatedMaxRaise = myPlayer ? Math.max(0, maxAllowedTotalBet - myPlayer.currentBet) : 0;

  // If max raise is smaller than min raise (e.g. going all in for less), clamp it
  const minRaiseClamped = Math.min(minRaise, calculatedMaxRaise);

  const [customRaise, setCustomRaise] = useState(minRaiseClamped);

  // Admin states
  const [botCount, setBotCount] = useState(1);
  const [botDifficulty, setBotDifficulty] = useState('MEDIUM');
  const [startingChips, setStartingChips] = useState(1000);
  const [showHelp, setShowHelp] = useState(false);

  const historyRef = useRef(null);

  useEffect(() => {
    setCustomRaise(minRaiseClamped);
  }, [minRaiseClamped]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [actionHistory]);

  return (
    <div className="table-wrapper">
      <div className="poker-table">
        <div className="table-felt">

          <div className="pot-area">
            {pot > 0 && (
              <div className="pot-display">
                <div className="pot-label">POT</div>
                <div className="pot-amount">${pot}</div>
              </div>
            )}
          </div>

          <div className="community-cards">
            {communityCards.map((card, idx) => {
              const isWinningCard = players.some(p => p.isWinner && p.handEvaluation?.cards?.some(c => c.suit === card.suit && c.rank === card.rank));
              return <Card key={idx} suit={card.suit} rank={card.rank} className={`community-card ${isWinningCard ? 'winning-card' : ''}`} />
            })}
          </div>

          {/* Render Players around the table */}
          {players.map((player, idx) => {
            const isCurrent = idx === currentPlayerIndex && stage !== 'SHOWDOWN' && stage !== 'WAITING';
            // Offset so that the current user is always seated at the bottom (angle = PI/2)
            const effectiveMyIndex = myPlayerIndex !== -1 ? myPlayerIndex : 0;
            const offsetIdx = (idx - effectiveMyIndex + players.length) % players.length;
            const angle = (offsetIdx / Math.max(players.length, 1)) * Math.PI * 2 + Math.PI / 2;

            const rx = 400; // x radius
            const ry = 200; // y radius
            const x = Math.cos(angle) * rx;
            const y = Math.sin(angle) * ry;

            return (
              <div
                key={player.id}
                className="player-seat"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                }}
              >
                <Player player={player} isCurrentTurn={isCurrent} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-info-panel">
        <div className="room-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Room: {gameState.roomId}</span>
            <button
              onClick={() => {
                if (navigator.clipboard && window.isSecureContext) {
                  navigator.clipboard.writeText(gameState.roomId);
                } else {
                  const textArea = document.createElement("textarea");
                  textArea.value = gameState.roomId;
                  textArea.style.position = "fixed";
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  try { document.execCommand('copy'); } catch (err) { }
                  document.body.removeChild(textArea);
                }
              }}
              style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '12px', marginLeft: '10px' }}
              title="Copy Room Code"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="history-log" ref={historyRef}>
          {actionHistory.map((log, i) => (
            <div key={i} className={`log-entry ${log.startsWith('---') ? 'log-divider' : ''}`}>{log}</div>
          ))}
        </div>
        {stage === 'WAITING' && myPlayer?.isAdmin && (
          <div className="admin-controls">
            <h4 style={{ color: 'var(--gold)', margin: '10px 0 5px 0' }}>Admin Controls</h4>
            <div className="admin-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ width: '95px' }}>Starting Chips:</label>
              <input type="number" value={startingChips} onChange={e => setStartingChips(e.target.value)} style={{ width: '60px' }} />
              <button onClick={() => onAdminAction('updateStartingChips', { amount: parseInt(startingChips) || 1000 })}>Set</button>
            </div>
            <div className="admin-row" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ width: '95px' }}>Bots:</label>
              <input type="number" min="1" max="8" value={botCount} onChange={e => setBotCount(e.target.value)} style={{ width: '40px' }} />
              <select value={botDifficulty} onChange={e => setBotDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Med</option>
                <option value="HARD">Hard</option>
              </select>
              <button onClick={() => onAdminAction('addAIBots', { count: parseInt(botCount) || 1, difficulty: botDifficulty })}>Add</button>
            </div>
            {players.length >= 2 && (
              <button className="start-btn" onClick={onStart} style={{ marginTop: '15px' }}>Start Game</button>
            )}
          </div>
        )}
        {stage === 'SHOWDOWN' && myPlayer?.isAdmin && (
          <div className="admin-controls" style={{ textAlign: 'center' }}>
            <button className="start-btn" onClick={onStart}>Next Round</button>
          </div>
        )}
      </div>

      {isMyTurn && myPlayer && (
        <div className="action-bar">
          <button className="action-btn fold" onClick={() => onAction('FOLD')}>Fold</button>

          <button
            className="action-btn call"
            onClick={() => onAction(currentHighestBet > myPlayer.currentBet ? 'CALL' : 'CHECK')}
          >
            {currentHighestBet > myPlayer.currentBet ? `Call $${currentHighestBet - myPlayer.currentBet}` : 'Check'}
          </button>

          <div className="raise-group">
            <div className="raise-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min={minRaiseClamped}
                max={calculatedMaxRaise}
                value={customRaise}
                onChange={e => setCustomRaise(parseInt(e.target.value) || minRaiseClamped)}
                className="raise-slider"
              />
              <input
                type="number"
                min={minRaiseClamped}
                max={calculatedMaxRaise}
                value={customRaise}
                onChange={e => {
                  setCustomRaise(e.target.value);
                }}
                onBlur={e => {
                  let val = parseInt(e.target.value);
                  if (isNaN(val)) val = minRaiseClamped;
                  setCustomRaise(Math.min(Math.max(val, minRaiseClamped), calculatedMaxRaise));
                }}
                className="raise-number-input"
                style={{ width: '60px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', padding: '2px 4px' }}
              />
            </div>
            <button
              className="action-btn raise"
              onClick={() => {
                const finalRaise = parseInt(customRaise) || minRaiseClamped;
                onAction('RAISE', Math.min(Math.max(finalRaise, minRaiseClamped), calculatedMaxRaise));
              }}
              disabled={calculatedMaxRaise <= Math.max(0, currentHighestBet - (myPlayer?.currentBet || 0))}
            >
              Raise
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {/* Top Right Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'var(--gold)',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          zIndex: 100
        }}
      >
        Help
      </button>
    </div>
  );
};

export default Table;
