import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

// Teams and initial schedule
const initialTeams = [
  { id: 1, name: "Dan & Bean", players: ["Dan", "Bean"], points: 0 },
  { id: 2, name: "Weedy & TJ", players: ["Weedy", "TJ"], points: 0 },
  { id: 3, name: "Rob & Pear", players: ["Rob", "Pear"], points: 0 },
  { id: 4, name: "Nova & Neil", players: ["Nova", "Neil"], points: 0 },
  { id: 5, name: "Bulby & JHD", players: ["Bulby", "JHD"], points: 0 },
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

const validSetScores = ["6-0", "6-1", "6-2", "6-3", "6-4", "7-5", "7-6"];

export default function Home() {
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState({});
  const [ratings, setRatings] = useState({});
  const [admin, setAdmin] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  // Load teams from Firestore and listen for updates
  useEffect(() => {
    const teamsCol = collection(db, "teams");
    const loadTeams = async () => {
      const snapshot = await getDocs(teamsCol);
      if (snapshot.empty) {
        initialTeams.forEach(async (team) => {
          await setDoc(doc(db, "teams", team.id.toString()), team);
        });
        setTeams(initialTeams);
      } else {
        setTeams(snapshot.docs.map((doc) => doc.data()));
      }
    };
    loadTeams();

    // Real-time updates for results
    const unsubscribeResults = onSnapshot(collection(db, "results"), (snapshot) => {
      const data = {};
      snapshot.docs.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setResults(data);
    });

    // Real-time updates for ratings
    const unsubscribeRatings = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = {};
      snapshot.docs.forEach((doc) => {
        data[doc.id] = doc.data().ratings;
      });
      setRatings(data);
    });

    return () => {
      unsubscribeResults();
      unsubscribeRatings();
    };
  }, []);

  // Admin login
  const enterAdmin = () => {
    const pw = prompt("Enter admin password:");
    if (pw === "danisgreat") {
      setAdmin(true);
      alert("Admin mode enabled!");
    } else alert("Wrong password.");
  };

  // Record match result
  const recordResult = async (matchId, winnerId) => {
    const scoreInput = prompt(
      "Enter match score (comma-separated sets, e.g. 6-3,6-4):"
    );
    if (!scoreInput) return;
    const sets = scoreInput.split(",").map((s) => s.trim());
    if (!sets.every((s) => validSetScores.includes(s))) {
      alert("Invalid score entered.");
      return;
    }
    await setDoc(doc(db, "results", matchId.toString()), {
      winnerId,
      score: sets.join(", "),
    });

    const teamRef = doc(db, "teams", winnerId.toString());
    const team = teams.find((t) => t.id === winnerId);
    await updateDoc(teamRef, { points: team.points + 3 });
  };

  // Record player rating
  const recordRating = async (player, score) => {
    if (!selectedTeam) {
      alert("Select your team first");
      return;
    }
    const currentRatings = ratings[player] || [];
    if (currentRatings.some((r) => r.fromTeam === selectedTeam) && !admin) {
      alert("Your team already rated this player");
      return;
    }
    const newRatings = [...currentRatings, { fromTeam: selectedTeam, score }];
    await setDoc(doc(db, "ratings", player), { ratings: newRatings });
  };

  const getAverageRating = (player) => {
    const scores = (ratings[player] || []).map((r) => r.score);
    if (!scores.length) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  // Styles
  const buttonStyle = {
    padding: "10px 15px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s",
  };
  const orangeBtn = { ...buttonStyle, background: "#FF9800", color: "#fff" };
  const redBtn = { ...buttonStyle, background: "#e53935", color: "#fff" };
  const greenBtn = { ...buttonStyle, background: "#4CAF50", color: "#fff" };
  const blueBtn = { ...buttonStyle, background: "#2196F3", color: "#fff" };
  const ratingBtn = { ...buttonStyle, flex: "1 1 18%", margin: "2px" };

  return (
    <div
      style={{
        fontFamily: "Poppins,sans-serif",
        padding: "10px",
        background: "#f0f4f7",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h1
          style={{
            margin: "0",
            fontSize: "1.8rem",
            color: "#333",
          }}
        >
          🎾 Padle League
        </h1>
      </div>

      {!admin && (
        <button
          onClick={enterAdmin}
          style={{ ...orangeBtn, width: "100%", marginBottom: "10px" }}
        >
          Enter Admin Mode
        </button>
      )}
      {admin && (
        <p style={{ color: "green", textAlign: "center" }}>
          ✅ Admin mode enabled
        </p>
      )}

      {/* League Table */}
      <h2>League Table</h2>
      <div style={{ overflowX: "auto", marginBottom: "15px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ background: "#2196F3", color: "#fff" }}>
              <th style={{ padding: "8px", borderRadius: "6px 0 0 6px" }}>
                Team
              </th>
              <th style={{ padding: "8px" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {teams
              .sort((a, b) => b.points - a.points)
              .map((team) => (
                <tr
                  key={team.id}
                  style={{ background: "#fff", margin: "2px 0" }}
                >
                  <td style={{ padding: "8px" }}>{team.name}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {team.points}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Match Results */}
      <h2>Match Results</h2>
      <div style={{ marginBottom: "15px" }}>
        {initialSchedule.map(([t1, t2], i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: "10px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              marginBottom: "8px",
            }}
          >
            <div style={{ marginBottom: "6px" }}>
              {teams.find((t) => t.id === t1)?.name} vs{" "}
              {teams.find((t) => t.id === t2)?.name}
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
              <button
                style={greenBtn}
                onClick={() => recordResult(i, t1)}
              >
                {teams.find((t) => t.id === t1)?.name} Win
              </button>
              <button
                style={blueBtn}
                onClick={() => recordResult(i, t2)}
              >
                {teams.find((t) => t.id === t2)?.name} Win
              </button>
            </div>
            {results[i] && (
              <div style={{ fontWeight: "bold", textAlign: "center" }}>
                Winner: {teams.find((t) => t.id === results[i].winnerId)?.name} | Score:{" "}
                {results[i].score}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Player Ratings */}
      <h2>Player Ratings</h2>
      <label>Select your team before rating:</label>
      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "8px",
          margin: "10px 0",
        }}
      >
        <option value="">-- Select Team --</option>
        {teams.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: "12px",
        }}
      >
        {teams
          .flatMap((t) => t.players)
          .map((player) => {
            const userRating = ratings[player]?.find(
              (r) => r.fromTeam === selectedTeam
            )?.score;
            return (
              <div
                key={player}
                style={{
                  background: "#fff",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{player}</strong>
                  <span>⭐ {getAverageRating(player)}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: "8px" }}>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const highlight = s === userRating ? { border: "2px solid #FF5722" } : {};
                    return (
                      <button
                        key={s}
                        onClick={() => recordRating(player, s)}
                        style={{ ...ratingBtn, ...highlight }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "25px", color: "#555", fontSize: "13px" }}>
        Designed and Created by DannyRush Apps
      </div>
    </div>
  );
}
