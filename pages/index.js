import { useState, useEffect } from 'react';

const initialTeams = [
  { id: 1, name: 'Dan & Bean', players: ['Dan', 'Bean'], points: 0 },
  { id: 2, name: 'Bulby & TJ', players: ['Bulby', 'TJ'], points: 0 },
  { id: 3, name: 'Neil & Pear', players: ['Neil', 'Pear'], points: 0 },
  { id: 4, name: 'Nova & Weedy', players: ['Nova', 'Weedy'], points: 0 },
  { id: 5, name: 'Rob & JHD', players: ['Rob', 'JHD'], points: 0 },
];

const initialSchedule = [
  [1, 2],[3, 4],[5, 1],[2, 3],[4, 5],
  [1, 3],[2, 4],[5, 3],[1, 4],[2, 5],
];

const validSetScores = ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"];

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
    } else alert("Wrong password.");
  };

  const recordResult = (matchId, winnerId) => {
    const scoreInput = prompt("Enter match score (comma-separated sets, e.g. 6-3,6-4):");
    if (!scoreInput) return;
    const sets = scoreInput.split(",").map(s=>s.trim());
    if (!sets.every(s=>validSetScores.includes(s))) {
      alert("Invalid score entered. Allowed: " + validSetScores.join(", "));
      return;
    }
    const updated = { ...results, [matchId]: { winnerId, score: sets.join(", ") } };
    setResults(updated);

    // Update points
    const newTeams = teams.map(t=> t.id === winnerId ? { ...t, points: t.points + 3 } : t);
    setTeams(newTeams);
  };

  const editMatch = (matchId) => {
    if (!admin) return;
    const winner = prompt("Enter winner team ID (1-5):", results[matchId]?.winnerId || "");
    if (!winner || isNaN(winner) || winner<1 || winner>5) return;
    const score = prompt("Enter new score (comma-separated sets):", results[matchId]?.score || "");
    if (!score) return;
    const sets = score.split(",").map(s=>s.trim());
    if (!sets.every(s=>validSetScores.includes(s))) { alert("Invalid score"); return; }

    const updated = { ...results, [matchId]: { winnerId: parseInt(winner), score: sets.join(", ") } };
    setResults(updated);

    // Recalculate points
    const pointsReset = teams.map(t=>({ ...t, points: 0 }));
    Object.values(updated).forEach(r=>{
      const team = pointsReset.find(t=>t.id===r.winnerId);
      if(team) team.points+=3;
    });
    setTeams(pointsReset);
  };

  const deleteMatch = (matchId) => {
    if(!admin) return;
    const updated = { ...results }; delete updated[matchId]; setResults(updated);
    const pointsReset = teams.map(t=>({ ...t, points:0 }));
    Object.values(updated).forEach(r=>{
      const team = pointsReset.find(t=>t.id===r.winnerId);
      if(team) team.points+=3;
    });
    setTeams(pointsReset);
  };

  const clearLastMatch = () => { if(!admin) return; const ids=Object.keys(results).map(Number); if(!ids.length) return; deleteMatch(Math.max(...ids)); };
  const clearAllMatches = () => { if(!admin || !confirm("Clear ALL matches?")) return; setResults({}); setTeams(teams.map(t=>({ ...t, points:0 }))); };

  const recordRating = (player, score) => {
    if(!selectedTeam) { alert("Select your team first"); return; }
    const current = ratings[player] || [];
    if(current.some(r=>r.fromTeam===selectedTeam)&&!admin){ alert("Your team already rated"); return; }
    const updated = { ...ratings, [player]: [...current, { fromTeam:selectedTeam, score }] };
    setRatings(updated);
  };

  const editRating = (player,index) => {
    if(!admin) return;
    const newScore = prompt("Enter new score (1-5):");
    if(!newScore || isNaN(newScore) || newScore<1 || newScore>5) return;
    const updated = { ...ratings }; updated[player][index].score = parseInt(newScore); setRatings(updated);
  };

  const deleteRating = (player,index) => { if(!admin) return; const updated = { ...ratings }; updated[player].splice(index,1); setRatings(updated); };

  const getAverageRating = (player) => {
    const scores = (ratings[player]||[]).map(r=>r.score);
    if(!scores.length) return 0; return (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2);
  };

  const clearLastRating = () => {
    let lastPlayer=null,lastIndex=-1;
    for(const [player,rList] of Object.entries(ratings)){
      if(rList.length>0){ lastPlayer=player; lastIndex=rList.length-1; }
    }
    if(lastPlayer!==null){ const updated={...ratings}; updated[lastPlayer].splice(lastIndex,1); setRatings(updated); }
  };

  const clearAllRatings = () => { if(confirm("Clear ALL ratings?")) setRatings({}); };

  // -------------------- STYLES --------------------
  const buttonStyle = { padding:'10px 15px', borderRadius:'12px', border:'none', cursor:'pointer', fontWeight:'bold', transition:'0.2s'};
  const orangeBtn = { ...buttonStyle, background:'#FF9800', color:'#fff'};
  const redBtn = { ...buttonStyle, background:'#e53935', color:'#fff'};
  const greenBtn = { ...buttonStyle, background:'#4CAF50', color:'#fff'};
  const blueBtn = { ...buttonStyle, background:'#2196F3', color:'#fff'};
  const ratingBtn = { ...buttonStyle, background:'#FFD700', flex:'1 1 18%', margin:'2px'};

  return (
    <div style={{ fontFamily:'Poppins,sans-serif', padding:'10px', background:'#f0f4f7', minHeight:'100vh' }}>
      <div style={{ textAlign:'center', marginBottom:'15px' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Paddle_tennis_racket.png/200px-Paddle_tennis_racket.png" alt="padle" style={{ width:'80px', margin:'0 auto 10px auto' }}/>
        <h1 style={{ margin:'0', fontSize:'1.8rem', color:'#333' }}>🎾 Padle League</h1>
      </div>

      {!admin && <button onClick={enterAdmin} style={{ ...orangeBtn, width:'100%', marginBottom:'10px'}}>Enter Admin Mode</button>}
      {admin && <p style={{color:'green',textAlign:'center'}}>✅ Admin mode enabled</p>}

      {admin && (
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-around', gap:'6px', marginBottom:'15px'}}>
          <button onClick={clearLastRating} style={orangeBtn}>Clear Last Rating</button>
          <button onClick={clearAllRatings} style={redBtn}>Clear All Ratings</button>
          <button onClick={clearLastMatch} style={orangeBtn}>Clear Last Match</button>
          <button onClick={clearAllMatches} style={redBtn}>Clear All Matches</button>
        </div>
      )}

      {/* League Table */}
      <h2>League Table</h2>
      <div style={{ overflowX:'auto', marginBottom:'15px'}}>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
          <thead>
            <tr style={{ background:'#2196F3', color:'#fff'}}>
              <th style={{padding:'8px',borderRadius:'6px 0 0 6px'}}>Team</th>
              <th style={{padding:'8px'}}>Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.sort((a,b)=>b.points-a.points).map(team=>(
              <tr key={team.id} style={{background:'#fff', margin:'2px 0'}}>
                <td style={{padding:'8px'}}>{team.name}</td>
                <td style={{padding:'8px',textAlign:'center'}}>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Match Results */}
      <h2>Match Results</h2>
      <div style={{ marginBottom:'15px' }}>
        {initialSchedule.map(([t1,t2],i)=>(
          <div key={i} style={{background:'#fff', padding:'10px', borderRadius:'12px', boxShadow:'0 2px 6px rgba(0,0,0,0.1)', marginBottom:'8px'}}>
            <div style={{marginBottom:'6px'}}>{teams.find(t=>t.id===t1).name} vs {teams.find(t=>t.id===t2).name}</div>
            <div style={{ display:'flex', gap:'4px', marginBottom:'6px' }}>
              <button style={greenBtn} onClick={()=>recordResult(i,t1)}>{teams.find(t=>t.id===t1).name} Win</button>
              <button style={blueBtn} onClick={()=>recordResult(i,t2)}>{teams.find(t=>t.id===t2).name} Win</button>
            </div>
            {results[i] && (
              <div style={{ fontWeight:'bold', textAlign:'center' }}>
                Winner: {teams.find(t=>t.id===results[i].winnerId).name} | Score: {results[i].score}
                {admin && (
                  <span>
                    <button onClick={()=>editMatch(i)} style={{margin:'0 4px', padding:'2px 6px', borderRadius:'6px', background:'#4CAF50', color:'#fff'}}>✏️</button>
                    <button onClick={()=>deleteMatch(i)} style={{padding:'2px 6px', borderRadius:'6px', background:'#e53935', color:'#fff'}}>❌</button>
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
      <select value={selectedTeam} onChange={(e)=>setSelectedTeam(e.target.value)} style={{ padding:'10px', width:'100%', borderRadius:'8px', margin:'10px 0'}}>
        <option value="">-- Select Team --</option>
        {teams.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
      </select>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'12px' }}>
        {teams.flatMap(t=>t.players).map(player=>(
          <div key={player} style={{ background:'#fff', padding:'12px', borderRadius:'12px', boxShadow:'0 2px 6px rgba(0,0,0,0.1)'}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>{player}</strong>
              <span>⭐ {getAverageRating(player)}</span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', marginTop:'8px'}}>
              {[1,2,3,4,5].map(s=><button key={s} onClick={()=>recordRating(player,s)} style={ratingBtn}>{s}</button>)}
            </div>
            <div style={{marginTop:'10px', fontSize:'13px'}}>
              {ratings[player] && ratings[player].length>0 && (
                <>
                  <strong>Ratings:</strong><br/>
                  {ratings[player].map((r,i)=>(
                    <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>{r.fromTeam} ({r.score})</span>
                      {admin && (
                        <span>
                          <button onClick={()=>editRating(player,i)} style={{marginRight:'4px', padding:'2px 6px', borderRadius:'4px', background:'#4CAF50', color:'#fff'}}>✏️</button>
                          <button onClick={()=>deleteRating(player,i)} style={{padding:'2px 6px', borderRadius:'4px', background:'#e53935', color:'#fff'}}>❌</button>
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
  )
}
