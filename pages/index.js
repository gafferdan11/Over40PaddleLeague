import { useState, useEffect } from 'react';

const initialTeams = [
  { id: 1, name: 'Rob & Bean', players: ['Rob', 'Bean'], points: 0 },
  { id: 2, name: 'Dan & TJ', players: ['Dan', 'TJ'], points: 0 },
  { id: 3, name: 'Weedy & Pear', players: ['Weedy', 'Pear'], points: 0 },
  { id: 4, name: 'Nova & Bulby', players: ['Nova', 'Bulby'], points: 0 },
  { id: 5, name: 'Neil & JHD', players: ['Neil', 'JHD'], points: 0 },
];

const initialSchedule = [
  [1, 2],
  [3, 4],
  [5, 1],
  [2, 3],
  [4, 5],
  [1, 3],
  [2, 4],
  [5, 3],
  [1, 4],
  [2, 5],
];

const validSetScores = [
  "6-0","6-1","6-2","6-3","6-4","7-5","7-6"
];

export default function Home() {
  const [teams, setTeams] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('teams') : null;
    return saved ? JSON.parse(saved) : initialTeams;
  });

  const [results, setResults] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('results') : null;
    return saved ? JSON.parse(saved) : {};
  });

  const [ratings, setRatings] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ratings') : null;
    return saved ? JSON.parse(saved) : {};
  });

  const [admin, setAdmin] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
    localStorage.setItem('results', JSON.stringify(results));
    localStorage.setItem('ratings', JSON.stringify(ratings));
  }, [teams, results, ratings]);

  const enterAdmin = () => {
    const pw = prompt("Enter admin password:");
    if (pw === "danisgreat") {
      setAdmin(true);
      alert("Admin mode enabled!");
    } else {
      alert("Wrong password.");
    }
  };

  // ------------------ MATCH LOGIC ------------------
  const recordResult = (matchId, winnerId) => {
    let score = prompt("Enter match score (comma-separated sets, e.g. 6-3,6-4):");
    if (!score) return;
    const sets = score.split(",").map(s => s.trim());
    if (!sets.every(s => validSetScores.includes(s))) {
      alert("Invalid score entered. Allowed: " + validSetScores.join(", "));
      return;
    }
    const updated = { ...results, [matchId]: { winnerId, score: sets.join(", ") } };
    setResults(updated);

    const newTeams = teams.map(t =>
      t.id === winnerId ? { ...t, points: t.points + 3 } : t
    );
    setTeams(newTeams);
  };

  const editMatch = (matchId) => {
    if (!admin) return;
    const winner = prompt("Enter winner team ID (1-5):", results[matchId]?.winnerId || "");
    if (!winner || isNaN(winner) || winner < 1 || winner > 5) return;
    let score = prompt("Enter new score (comma-separated sets):", results[matchId]?.score || "");
    if (!score) return;
    const sets = score.split(",").map(s => s.trim());
    if (!sets.every(s => validSetScores.includes(s))) {
      alert("Invalid score entered.");
      return;
    }
    const updated = { ...results, [matchId]: { winnerId: parseInt(winner), score: sets.join(", ") } };
    setResults(updated);

    // Recalculate points
    const pointsReset = teams.map(t => ({ ...t, points: 0 }));
    Object.values(updated).forEach(r => {
      const team = pointsReset.find(t => t.id === r.winnerId);
      if (team) team.points += 3;
    });
    setTeams(pointsReset);
  };

  const deleteMatch = (matchId) => {
    if (!admin) return;
    const updated = { ...results };
    delete updated[matchId];
    setResults(updated);

    const pointsReset = teams.map(t => ({ ...t, points: 0 }));
    Object.values(updated).forEach(r => {
      const team = pointsReset.find(t => t.id === r.winnerId);
      if (team) team.points += 3;
    });
    setTeams(pointsReset);
  };

  const clearLastMatch = () => {
    if (!admin) return;
    const matchIds = Object.keys(results).map(id => parseInt(id));
    if (matchIds.length === 0) return alert("No matches to clear.");
    const lastId = Math.max(...matchIds);
    deleteMatch(lastId);
  };

  const clearAllMatches = () => {
    if (!admin) return;
    if (!confirm("Are you sure you want to clear ALL match results?")) return;
    setResults({});
    setTeams(teams.map(t => ({ ...t, points: 0 })));
  };

  // ------------------ RATINGS LOGIC ------------------
  const recordRating = (player, score) => {
    if (!selectedTeam) {
      alert("Select your team before rating!");
      return;
    }
    const current = ratings[player] || [];
    if (current.some(r => r.fromTeam === selectedTeam) && !admin) {
      alert("Your team has already rated this player.");
      return;
    }
    const updated = { ...ratings, [player]: [...current, { fromTeam: selectedTeam, score }] };
    setRatings(updated);
  };

  const deleteRating = (player, index) => {
    if (!admin) return;
    const updated = { ...ratings };
    updated[player].splice(index, 1);
    setRatings(updated);
  };

  const editRating = (player, index) => {
    if (!admin) return;
    const newScore = prompt("Enter new score (1-5):");
    if (!newScore || isNaN(newScore) || newScore < 1 || newScore > 5) return;
    const updated = { ...ratings };
    updated[player][index].score = parseInt(newScore);
    setRatings(updated);
  };

  const getAverageRating = (player) => {
    const scores = (ratings[player] || []).map(r => r.score);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  const clearLastRating = () => {
    let lastPlayer = null;
    let lastIndex = -1;
    for (const [player, rList] of Object.entries(ratings)) {
      if (rList.length > 0) {
        lastPlayer = player;
        lastIndex = rList.length - 1;
      }
    }
    if (lastPlayer !== null) {
      const updated = { ...ratings };
      updated[lastPlayer].splice(lastIndex, 1);
      setRatings(updated);
    } else {
      alert("No ratings to clear.");
    }
  };

  const clearAllRatings = () => {
    if (confirm("Are you sure you want to clear ALL ratings?")) {
      setRatings({});
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '10px' }}>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Paddle_tennis_racket.png/200px-Paddle_tennis_racket.png"
        alt="padle"
        style={{ width: '80px', display: 'block', margin: '0 auto 15px auto' }}
      />
      <h1 style={{ textAlign: 'center' }}>🎾 Padle League</h1>

      {!admin && (
        <button
          onClick={enterAdmin}
          style={{ background: '#ff6666', color: '#fff', padding: '12px', borderRadius: '8px', width: '100%' }}
        >
          Enter Admin Mode
        </button>
      )}
      {admin && <p style={{ color: 'green', textAlign: 'center' }}>✅ Admin mode enabled</p>}

      {admin && (
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-around', margin:'10px 0' }}>
          <button onClick={clearLastRating} style={{ background:'#FF9800', color:'#fff', padding:'10px', borderRadius:'6px', margin:'5px', flex:'1 1 45%' }}>Clear Last Rating</button>
          <button onClick={clearAllRatings} style={{ background:'#e53935', color:'#fff', padding:'10px', borderRadius:'6px', margin:'5px', flex:'1 1 45%' }}>Clear All Ratings</button>
          <button onClick={clearLastMatch} style={{ background:'#FF9800', color:'#fff', padding:'10px', borderRadius:'6px', margin:'5px', flex:'1 1 45%' }}>Clear Last Match</button>
          <button onClick={clearAllMatches} style={{ background:'#e53935', color:'#fff', padding:'10px', borderRadius:'6px', margin:'5px', flex:'1 1 45%' }}>Clear All Matches</button>
        </div>
      )}

      <h2>League Table</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Team</th><th>Points</th></tr>
          </thead>
          <tbody>
            {teams.sort((a,b)=>b.points-a.points).map(team=>(
              <tr key={team.id}>
                <td>{team.name}</td>
                <td style={{textAlign:'center'}}>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Match list */}
      <h2>Matches</h2>
      <div>
        {initialSchedule.map(([t1,t2],i)=>(
          <div key={i} style={{ background:'#fff', margin:'8px 0', padding:'10px', borderRadius:'8px', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom:'8px' }}>{teams.find(t=>t.id===t1).name} vs {teams.find(t=>t.id===t2).name}</div>
            <button onClick={()=>recordResult(i,t1)} style={{ background:'#4CAF50', color:'#fff', padding:'10px', borderRadius:'6px', width:'48%' }}>{teams.find(t=>t.id===t1).name} Win</button>
            <button onClick={()=>recordResult(i,t2)} style={{ background:'#2196F3', color:'#fff', padding:'10px', borderRadius:'6px', width:'48%', marginLeft:'4%' }}>{teams.find(t=>t.id===t2).name} Win</button>
            {results[i] && (
              <div style={{ marginTop:'6px', fontWeight:'bold', textAlign:'center' }}>
                Winner: {teams.find(t=>t.id===results[i].winnerId).name} | Score: {results[i].score} 
                {admin && (
                  <span>
                    <button onClick={()=>editMatch(i)} style={{ margin:'0 4px', padding:'2px 6px', background:'#4CAF50', color:'#fff', borderRadius:'4px' }}>✏️</button>
                    <button onClick={()=>deleteMatch(i)} style={{ padding:'2px 6px', background:'#e53935', color:'#fff', borderRadius:'4px' }}>❌</button>
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Player Ratings */}
      <h2>Player Ratings</h2>
      <label>Select your team before rating:</label>
      <select value={selectedTeam} onChange={(e)=>setSelectedTeam(e.target.value)} style={{ margin:'10px 0', padding:'10px', width:'100%', borderRadius:'6px' }}>
        <option value="">-- Select Team --</option>
        {teams.map(t=>(
          <option key={t.id} value={t.name}>{t.name}</option>
        ))}
      </select>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'12px' }}>
        {teams.flatMap(t=>t.players).map(player=>(
          <div key={player} style={{ border:'2px solid #444', padding:'12px', borderRadius:'8px', background:'#f9f9f9' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>{player}</strong>
              <span>⭐ {getAverageRating(player)}</span>
            </div>
            <div style={{ marginTop:'8px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>recordRating(player,s)} style={{ flex:'1 1 18%', padding:'10px', background:'#FFD700', borderRadius:'6px' }}>{s}</button>
              ))}
            </div>
            <div style={{ marginTop:'10px', fontSize:'13px' }}>
              {ratings[player] && ratings[player].length > 0 && (
                <>
                  <strong>Ratings:</strong><br/>
                  {ratings[player].map((r,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>{r.fromTeam} ({r.score})</span>
                      {admin && (
                        <span>
                          <button onClick={()=>editRating(player,i)} style={{ marginRight:'4px', padding:'2px 6px', background:'#4CAF50', color:'#fff', borderRadius:'4px' }}>✏️</button>
                          <button onClick={()=>deleteRating(player,i)} style={{ padding:'2px 6px', background:'#e53935', color:'#fff', borderRadius:'4px' }}>❌</button>
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
