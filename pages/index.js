import { useState, useEffect } from 'react';

const initialTeams = [
  { id: 1, name: 'Rob & Bean', players: ['Rob', 'Bean'], points: 0 },
  { id: 2, name: 'Dan & TJ', players: ['Dan', 'TJ'], points: 0 },
  { id: 3, name: 'Weedy & Pear', players: ['Weedy', 'Pear'], points: 0 },
  { id: 4, name: 'Nova & Bulby', players: ['Nova', 'Bulby'], points: 0 },
  { id: 5, name: 'Neil & JHD', players: ['Neil', 'JHD'], points: 0 },
];

const schedule = [
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

  const recordResult = (matchId, winnerId) => {
    if (results[matchId] && !admin) return; // prevent overwrite unless admin
    const updated = { ...results, [matchId]: winnerId };
    setResults(updated);
    const newTeams = teams.map((t) =>
      t.id === winnerId ? { ...t, points: t.points + 3 } : t
    );
    setTeams(newTeams);
  };

  const recordRating = (player, score) => {
    if (!selectedTeam) {
      alert("Select your team before rating!");
      return;
    }
    const current = ratings[player] || [];
    // prevent same team rating twice unless admin
    if (current.some(r => r.fromTeam === selectedTeam) && !admin) {
      alert("Your team has already rated this player.");
      return;
    }
    const updated = { ...ratings, [player]: [...current, { fromTeam: selectedTeam, score }] };
    setRatings(updated);
  };

  const getAverageRating = (player) => {
    const scores = (ratings[player] || []).map(r => r.score);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Paddle_tennis_racket.png/200px-Paddle_tennis_racket.png" alt="paddle" style={{ width: '100px' }} />
      <h1>🏓 Paddle League</h1>

      {!admin && <button onClick={enterAdmin} style={{ background: '#ff6666', color: '#fff', padding: '10px', borderRadius: '8px' }}>Enter Admin Mode</button>}
      {admin && <p style={{ color: 'green' }}>✅ Admin mode enabled</p>}

      <h2>League Table</h2>
      <table>
        <thead>
          <tr><th>Team</th><th>Points</th></tr>
        </thead>
        <tbody>
          {teams.sort((a,b)=>b.points-a.points).map(team=>(
            <tr key={team.id}><td>{team.name}</td><td style={{textAlign:'center'}}>{team.points}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Matches</h2>
      <ul>
        {schedule.map(([t1,t2],i)=>(
          <li key={i} style={{ marginBottom: '10px' }}>
            {teams.find(t=>t.id===t1).name} vs {teams.find(t=>t.id===t2).name}
            <button onClick={()=>recordResult(i,t1)} style={{ marginLeft:'10px', background:'#4CAF50', color:'#fff', padding:'5px 10px', borderRadius:'6px' }}>
              {teams.find(t=>t.id===t1).name} Win
            </button>
            <button onClick={()=>recordResult(i,t2)} style={{ marginLeft:'5px', background:'#2196F3', color:'#fff', padding:'5px 10px', borderRadius:'6px' }}>
              {teams.find(t=>t.id===t2).name} Win
            </button>
            {results[i] && <strong style={{ marginLeft:'10px' }}> Winner: {teams.find(t=>t.id===results[i]).name}</strong>}
          </li>
        ))}
      </ul>

      <h2>Player Ratings</h2>
      <label>Select your team before rating:</label>
      <select value={selectedTeam} onChange={(e)=>setSelectedTeam(e.target.value)} style={{ margin:'10px', padding:'5px' }}>
        <option value="">-- Select Team --</option>
        {teams.map(t=>(
          <option key={t.id} value={t.name}>{t.name}</option>
        ))}
      </select>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {teams.flatMap(t=>t.players).map(player=>(
          <div key={player} style={{border:'2px solid #444',padding:'10px',borderRadius:'8px',background:'#f9f9f9'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <strong>{player}</strong>
              <span>⭐ {getAverageRating(player)}</span>
            </div>
            {[1,2,3,4,5].map(s=>(
              <button key={s} onClick={()=>recordRating(player,s)} style={{ margin:'3px', padding:'8px', background:'#FFD700', borderRadius:'6px' }}>{s}</button>
            ))}
            <div style={{ marginTop:'5px', fontSize:'12px' }}>
              {ratings[player] && ratings[player].length > 0 && (
                <>
                  <strong>Ratings:</strong><br/>
                  {ratings[player].map((r,i)=>(
                    <span key={i}>{r.fromTeam} ({r.score}) </span>
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
