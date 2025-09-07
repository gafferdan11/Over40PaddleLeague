import { useState, useEffect } from 'react';

const initialTeams = [
  { id: 1, name: 'Rob & Weedy', players: ['Rob', 'Weedy'], points: 0 },
  { id: 2, name: 'Dan & Bean', players: ['Dan', 'Bean'], points: 0 },
  { id: 3, name: 'TJ & Pear', players: ['TJ', 'Pear'], points: 0 },
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

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
    localStorage.setItem('results', JSON.stringify(results));
    localStorage.setItem('ratings', JSON.stringify(ratings));
  }, [teams, results, ratings]);

  const recordResult = (matchId, winnerId) => {
    if (results[matchId]) return;
    const updated = { ...results, [matchId]: winnerId };
    setResults(updated);
    const newTeams = teams.map((t) =>
      t.id === winnerId ? { ...t, points: t.points + 3 } : t
    );
    setTeams(newTeams);
  };

  const recordRating = (player, score) => {
    const current = ratings[player] || [];
    const updated = { ...ratings, [player]: [...current, score] };
    setRatings(updated);
  };

  const getAverageRating = (player) => {
    const scores = ratings[player] || [];
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  return (
    <div>
      <h1>🏓 Paddle League</h1>
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
          <li key={i}>
            {teams.find(t=>t.id===t1).name} vs {teams.find(t=>t.id===t2).name}
            {!results[i] && (
              <>
                <button onClick={()=>recordResult(i,t1)}> {teams.find(t=>t.id===t1).name} Win</button>
                <button onClick={()=>recordResult(i,t2)}> {teams.find(t=>t.id===t2).name} Win</button>
              </>
            )}
            {results[i] && <strong> Winner: {teams.find(t=>t.id===results[i]).name}</strong>}
          </li>
        ))}
      </ul>

      <h2>Player Ratings</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        {teams.flatMap(t=>t.players).map(player=>(
          <div key={player} style={{border:'1px solid #ddd',padding:'5px'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span>{player}</span>
              <span>⭐ {getAverageRating(player)}</span>
            </div>
            {[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>recordRating(player,s)}>{s}</button>))}
          </div>
        ))}
      </div>
    </div>
  );
}
