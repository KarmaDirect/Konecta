import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

// ✅ Bouton intégré dans le même fichier
function Button({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ✅ Cartes intégrées dans le même fichier
function Card({ children, className = "" }) {
  return <div className={`bg-white p-4 rounded-xl shadow ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

// Ton composant principal Dashboard
export default function Dashboard() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard RDV</h1>
      <Button onClick={() => alert("Clicked!")}>Exemple de bouton</Button>

      <div className="mt-6">
        <Card>
          <CardContent>
            <p>Ceci est une carte avec du contenu à l'intérieur.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


const agentsInit = [];

export default function Dashboard() {
  const [agents, setAgents] = useState(agentsInit);
  const [notified, setNotified] = useState([]);
  const [newAgent, setNewAgent] = useState("");
  const [isCRM, setIsCRM] = useState(true);
  const [isDigital, setIsDigital] = useState(true);
  const [newObjective, setNewObjective] = useState(20);
  const [rdvCRMTotal, setRdvCRMTotal] = useState(100);
  const [rdvDigitalTotal, setRdvDigitalTotal] = useState(50);

  const addAgent = () => {
    if (newAgent.trim()) {
      const newEntry = {
        name: newAgent.trim(),
        objectif: Number(newObjective),
        currentCRM: isCRM ? Number(newObjective) : null,
        currentDigital: isDigital ? Number(newObjective) : null
      };
      setAgents([...agents, newEntry]);
      setNewAgent("");
      setNewObjective(20);
      setIsCRM(true);
      setIsDigital(true);
    }
  };

  const removeAgent = (index) => {
    const updated = [...agents];
    updated.splice(index, 1);
    setAgents(updated);
  };

  const resetAgents = () => {
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        currentCRM: a.objectif,
        currentDigital: a.objectif
      }))
    );
  };

  const dispatchRdv = (type) => {
    const rdvTotal = type === "currentCRM" ? rdvCRMTotal : rdvDigitalTotal;
    const filteredAgents = agents.filter((a) => a[type] !== null);
    const agentCount = filteredAgents.length;

    if (agentCount === 0) return;

    const rdvPerAgent = Math.floor(rdvTotal / agentCount);
    const remainder = rdvTotal % agentCount;

    const updated = agents.map((a, i) => {
      if (a[type] === null) return a;
      const bonus = i < remainder ? 1 : 0;
      const objectif = rdvPerAgent + bonus;
      return {
        ...a,
        objectif,
        [type]: objectif
      };
    });

    setAgents(updated);
  };

  const updateCount = (index, delta, type) => {
    const updated = [...agents];
    const previous = updated[index][type];
    updated[index][type] = previous + delta;
    setAgents(updated);

    if (
      previous >= 0 &&
      updated[index][type] < 0 &&
      !notified.includes(`${updated[index].name}-${type}`)
    ) {
      alert(
        `🎉 Bravo ${updated[index].name} ! Tu as dépassé ton objectif ${
          type === "currentCRM" ? "CRM" : "Digital"
        } ! ⭐`
      );
      setNotified([...notified, `${updated[index].name}-${type}`]);
    }
  };

  const getEmoji = (current, objectif) => {
    const ratio = 1 - current / objectif;
    if (ratio >= 1) return "👑";
    if (ratio >= 0.75) return "🔥";
    if (ratio >= 0.5) return "💪";
    if (ratio >= 0.25) return "⚡";
    return "🕓";
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      agents.map((a) => ({
        Agent: a.name,
        Objectif: a.objectif,
        "RDV CRM Restants": a.currentCRM,
        "RDV Digitaux Restants": a.currentDigital
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RDV Agents");
    XLSX.writeFile(wb, "Suivi_RDV_Agents_CRM_Digital.xlsx");
  };

  const renderSection = (title, type, total, setTotal) => {
    const totalObjectif = agents.reduce(
      (sum, a) => sum + (a[type] !== null ? a.objectif : 0),
      0
    );
    const totalRestants = agents.reduce(
      (sum, a) => sum + (a[type] !== null ? a[type] : 0),
      0
    );
    const ratioGlobal = totalObjectif > 0 ? 1 - totalRestants / totalObjectif : 0;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-4">
          <label htmlFor={`rdv-${type}`} className="font-medium">
            RDV totaux à dispatcher :
          </label>
          <input
            id={`rdv-${type}`}
            type="number"
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            className="border px-2 py-1 rounded w-24"
          />
          <Button onClick={() => dispatchRdv(type)}>
            🧮 Répartir entre les agents
          </Button>
          <p className="text-sm text-gray-600 italic">
            Répartition équitable : chaque agent recevra environ le même nombre de
            RDV.
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className="bg-green-500 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center transition-all duration-500"
            style={{ width: `${ratioGlobal * 100}%` }}
          >
            {Math.round(ratioGlobal * 100)}% de l'objectif collectif atteint
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents
            .filter((agent) => agent[type] !== null)
            .map((agent, i) => (
              <Card
                key={`${agent.name}-${type}`}
                className="rounded-2xl shadow-lg"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">{agent.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getEmoji(agent[type], agent.objectif)}
                      </span>
                      <button
                        onClick={() => removeAgent(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p>
                    Heures de travail :
                    <input
                      type="number"
                      value={agent.hours || 1}
                      min="1"
                      max="12"
                      className="ml-2 w-16 border px-1 py-0.5 rounded"
                      onChange={(e) => {
                        const updated = [...agents];
                        updated[i].hours = Number(e.target.value);
                        setAgents(updated);
                      }}
                    />
                  </p>
                  <p>
                    RDV restants : {agent[type]}{' '}
                    {agent[type] < 0 ? "⭐ RDV Bonus!" : ""}
                  </p>
                  <p>
                    Soit{' '}
                    {Math.round(
                      (type === 'currentCRM' ? rdvCRMTotal : rdvDigitalTotal) /
                        agents.reduce(
                          (sum, a) =>
                            sum + (a[type] !== null ? a.hours || 1 : 0),
                          0
                        )
                    )}{' '}
                    RDV/h
                  </p>
                  <p className="text-green-700 font-medium">
                    {agent[type] > 0
                      ? `Il te reste ${agent[type]} rendez-vous`
                      : agent[type] < 0
                      ? `Tu as fait ${-agent[type]} rendez-vous bonus !`
                      : `Objectif atteint !`}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => updateCount(i, -1, type)}>-</Button>
                    <Button onClick={() => updateCount(i, 1, type)}>+</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  };

  const getTopAgents = (type) => {
    return [...agents]
      .filter((a) => a[type] !== null)
      .sort((a, b) => b.objectif - b[type] - (a.objectif - a[type]))
      .slice(0, 3);
  };

  const crmAgents = agents.filter((a) => a.currentCRM !== null);
  const digitalAgents = agents.filter((a) => a.currentDigital !== null);

  const totalCRM = crmAgents.reduce((sum, a) => sum + a.objectif, 0);
  const totalCRMRestants = crmAgents.reduce((sum, a) => sum + a.currentCRM, 0);
  const totalDigital = digitalAgents.reduce((sum, a) => sum + a.objectif, 0);
  const totalDigitalRestants = digitalAgents.reduce((sum, a) => sum + a.currentDigital, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-6 space-y-12">
      <div className="flex justify-between items-center">
        <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/e/e7/Konecta_Logo_2021.svg/512px-Konecta_Logo_2021.svg.png" alt="Konecta" className="h-12" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Amplifon_logo.svg/512px-Amplifon_logo.svg.png" alt="Amplifon" className="h-10" />
      </div>
      <h1 className="text-4xl font-bold text-center text-blue-900">📊 Mission RDV Master : Suivi Agents CRM & Digitaux</h1>
      <div className="text-center">
        <a href="/grand-ecran" className="inline-block mt-4 px-4 py-2 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 transition-colors duration-200">
          🖥️ Accéder au Grand Écran Avancé
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center bg-gray-100 p-4 rounded-xl border-2 border-blue-300">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">📋 CRM - Objectifs Spécifiques</h3>
          <p>Total agents : {crmAgents.length}</p>
          <p>Objectif total : {totalCRM}</p>
          <p>RDV restants : {totalCRMRestants}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-purple-800">💻 Digital - Objectifs Spécifiques</h3>
          <p>Total agents : {digitalAgents.length}</p>
          <p>Objectif total : {totalDigital}</p>
          <p>RDV restants : {totalDigitalRestants}</p>
        </div>
      </div>

      <div className="flex flex-col items-center bg-blue-100 p-6 rounded-xl space-y-4">
        <input type="text" value={newAgent} onChange={(e) => setNewAgent(e.target.value)} placeholder="Nom de l'agent" className="border px-2 py-1 rounded" />
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2">
            <label><input type="checkbox" checked={isCRM} onChange={() => setIsCRM(!isCRM)} /> CRM</label>
            <label><input type="checkbox" checked={isDigital} onChange={() => setIsDigital(!isDigital)} /> Digital</label>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={addAgent}>➕ Ajouter un agent</Button>
          <Button variant="destructive" onClick={resetAgents}>🔄 Réinitialiser tous les compteurs</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">🏅 Top 3 CRM</h2>
        <div className="flex flex-row gap-4 justify-center">
          {getTopAgents("currentCRM").map((agent, i) => (
            <div key={`top-crm-${i}`} className="bg-white shadow rounded-xl px-4 py-2 text-center w-[150px]">
              <p className="font-bold">{agent.name}</p>
              <p className="text-sm">{agent.objectif - agent.currentCRM} RDV réalisés</p>
              <p className="text-xl animate-bounce">
                {getEmoji(agent.currentCRM, agent.objectif)}
                {agent.currentCRM < 0 && <span className="text-yellow-500 animate-ping ml-1">⭐</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {renderSection("📋 RDV CRM", "currentCRM", rdvCRMTotal, setRdvCRMTotal)}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">🏅 Top 3 Digitaux</h2>
        <div className="flex flex-row gap-4 justify-center">
          {getTopAgents("currentDigital").map((agent, i) => (
            <div key={`top-digital-${i}`} className="bg-white shadow rounded-xl px-4 py-2 text-center w-[150px]">
              <p className="font-bold">{agent.name}</p>
              <p className="text-sm">{agent.objectif - agent.currentDigital} RDV réalisés</p>
              <p className="text-xl animate-bounce">
                {getEmoji(agent.currentDigital, agent.objectif)}
                {agent.currentDigital < 0 && <span className="text-yellow-500 animate-ping ml-1">⭐</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {renderSection("💻 RDV Digitaux", "currentDigital", rdvDigitalTotal, setRdvDigitalTotal)}

      <div className="pt-4">
        <div className="flex gap-4">
          <Button onClick={() => exportToExcel()} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Exporter en Excel
          </Button>
        </div>
      </div>
    </div>
  );
} // removed duplicate extra closing brace

