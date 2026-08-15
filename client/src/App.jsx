import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Table from './components/Table';
import './App.css';

const socketUrl = import.meta.env.PROD ? '/' : 'http://localhost:3001';
const socket = io(socketUrl);

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function App() {
  const [gameState, setGameState] = useState(null);
  const [inGame, setInGame] = useState(false);
  const [lobbyMode, setLobbyMode] = useState('MENU'); // MENU, CREATE, JOIN, LOCAL
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
      setGameState(state);
      setInGame(true);
    });

    socket.on('joinError', (errorMsg) => {
      alert(errorMsg);
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('joinError');
    };
  }, []);

  const handleJoin = (e, generatedRoomId = null) => {
    e?.preventDefault();
    const targetRoom = generatedRoomId || roomId;
    if (targetRoom && playerName) {
      socket.emit('joinRoom', { roomId: targetRoom, playerName, isCreating: !!generatedRoomId });
    }
  };

  const handleAction = (action, amount) => {
    socket.emit('playerAction', { roomId: gameState.roomId, action, amount });
  };

  const handleStart = () => {
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const handleAdminAction = (action, payload) => {
    socket.emit(action, { roomId: gameState.roomId, ...payload });
  };

  if (inGame) {
    return (
      <div className="game-container">
        {gameState ? (
          <Table 
            gameState={gameState} 
            socketId={socket.id} 
            onAction={handleAction} 
            onStart={handleStart}
            onAdminAction={handleAdminAction}
          />
        ) : (
          <div className="loading">Loading Game...</div>
        )}
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <h1>Texas Hold'em</h1>
        
        {lobbyMode === 'MENU' && (
          <div className="menu-buttons">
            <button className="join-btn" onClick={() => setLobbyMode('CREATE')}>Create Room</button>
            <button className="join-btn" onClick={() => setLobbyMode('JOIN')} style={{marginTop: '10px'}}>Join Room</button>
            <button className="join-btn" onClick={() => setLobbyMode('LOCAL')} style={{marginTop: '10px'}}>Play Locally (AI)</button>
          </div>
        )}

        {(lobbyMode === 'CREATE' || lobbyMode === 'LOCAL') && (
          <form onSubmit={(e) => handleJoin(e, generateRoomId())}>
            <h3>{lobbyMode === 'CREATE' ? 'Create a New Room' : 'Local Play (You vs AI)'}</h3>
            <div className="form-group">
              <label>Player Name</label>
              <input 
                type="text" 
                required 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)} 
                placeholder="Enter your name"
              />
            </div>
            <button type="submit" className="join-btn">Start</button>
            <button type="button" className="join-btn back-btn" onClick={() => setLobbyMode('MENU')} style={{marginTop: '10px', background: '#444'}}>Back</button>
          </form>
        )}

        {lobbyMode === 'JOIN' && (
          <form onSubmit={(e) => handleJoin(e)}>
            <h3>Join a Room</h3>
            <div className="form-group">
              <label>Player Name</label>
              <input 
                type="text" 
                required 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)} 
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Room Code (6 Characters)</label>
              <input 
                type="text" 
                required 
                maxLength={6}
                value={roomId} 
                onChange={e => setRoomId(e.target.value.toUpperCase())} 
                placeholder="e.g. ABC123"
              />
            </div>
            <button type="submit" className="join-btn">Join</button>
            <button type="button" className="join-btn back-btn" onClick={() => setLobbyMode('MENU')} style={{marginTop: '10px', background: '#444'}}>Back</button>
          </form>
        )}
        
        {typeof __BUILD_INFO__ !== 'undefined' && (
          <div style={{ marginTop: '20px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
            Branch: {__BUILD_INFO__.branch} | Built: {__BUILD_INFO__.buildTime}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
