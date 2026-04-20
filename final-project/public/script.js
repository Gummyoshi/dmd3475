const CLAN_TAG = "#2QVRV2VR";
const ENCODED_TAG = encodeURIComponent(CLAN_TAG);

// Change this if your backend lives on another domain.
// Example: const API_BASE = "https://your-vercel-backend.vercel.app";
const API_BASE = "";

let clanData = null;
let membersCache = [];

const el = (id) => document.getElementById(id);

const clanBadge = el("clanBadge");
const clanName = el("clanName");
const clanLocation = el("clanLocation");
const clanTagText = el("clanTagText");
const typePill = el("typePill");
const warFrequencyPill = el("warFrequencyPill");
const statusText = el("statusText");

const statClanLevel = el("statClanLevel");
const statMembers = el("statMembers");
const statPoints = el("statPoints");
const statWarWins = el("statWarWins");
const statRequiredTrophies = el("statRequiredTrophies");
const statRequiredBuilderTrophies = el("statRequiredBuilderTrophies");

const warStateTag = el("warStateTag");
const ourWarStars = el("ourWarStars");
const ourWarDestruction = el("ourWarDestruction");
const ourAttacksUsed = el("ourAttacksUsed");
const enemyName = el("enemyName");
const enemyWarStars = el("enemyWarStars");
const enemyWarDestruction = el("enemyWarDestruction");
const enemyAttacksUsed = el("enemyAttacksUsed");
const warTeamSize = el("warTeamSize");
const warEndTime = el("warEndTime");

const raidLoot = el("raidLoot");
const raidCompleted = el("raidCompleted");
const raidDestroyed = el("raidDestroyed");
const raidAttacks = el("raidAttacks");
const raidDateRange = el("raidDateRange");

const membersTableBody = el("membersTableBody");
const memberSearch = el("memberSearch");
const refreshBtn = el("refreshBtn");

clanTagText.textContent = CLAN_TAG;

function formatNumber(value) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function formatDateTime(isoLike) {
  if (!isoLike) return "--";

  // Clash timestamps often look like 20260419T123456.000Z
  const normalized = isoLike.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.?(\d+)?Z$/,
    "$1-$2-$3T$4:$5:$6Z"
  );

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return isoLike;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function roleLabel(role) {
  const map = {
    leader: "Leader",
    coLeader: "Co-Leader",
    admin: "Elder",
    member: "Member"
  };
  return map[role] || role || "--";
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  document.querySelector(".status-dot").style.background = isError ? "var(--danger)" : "var(--green)";
  document.querySelector(".status-dot").style.boxShadow = isError
    ? "0 0 14px rgba(255, 139, 154, 0.85)"
    : "0 0 14px rgba(124, 246, 177, 0.85)";
}

async function fetchJSON(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function renderClan(data) {
  clanData = data;

  clanBadge.src = data.badgeUrls?.large || data.badgeUrls?.medium || data.badgeUrls?.small || "";
  clanBadge.alt = `${data.name} badge`;

  clanName.textContent = data.name || "Unknown Clan";
  clanLocation.textContent = data.location?.name
    ? `${data.location.name}`
    : "Location unavailable";

  typePill.textContent = data.type ? `Type: ${data.type}` : "Clan";
  warFrequencyPill.textContent = data.warFrequency ? `War: ${data.warFrequency}` : "War: --";

  statClanLevel.textContent = formatNumber(data.clanLevel);
  statMembers.textContent = formatNumber(data.members);
  statPoints.textContent = formatNumber(data.clanPoints);
  statWarWins.textContent = formatNumber(data.warWins);
  statRequiredTrophies.textContent = formatNumber(data.requiredTrophies);
  statRequiredBuilderTrophies.textContent = formatNumber(data.requiredBuilderBaseTrophies);

  membersCache = [...(data.memberList || [])].sort((a, b) => (b.trophies || 0) - (a.trophies || 0));
  renderMembers(membersCache);
}

function renderWar(data) {
  if (!data || data.reason) {
    warStateTag.textContent = "Unavailable";
    enemyName.textContent = "No active war";
    ourWarStars.textContent = "-- ⭐";
    ourWarDestruction.textContent = "--% destruction";
    ourAttacksUsed.textContent = "Attacks used: --";
    enemyWarStars.textContent = "-- ⭐";
    enemyWarDestruction.textContent = "--% destruction";
    enemyAttacksUsed.textContent = "Attacks used: --";
    warTeamSize.textContent = "--";
    warEndTime.textContent = "No war data returned";
    return;
  }

  warStateTag.textContent = data.state || "Unknown";

  ourWarStars.textContent = `${data.clan?.stars ?? "--"} ⭐`;
  ourWarDestruction.textContent = `${data.clan?.destructionPercentage ?? "--"}% destruction`;
  ourAttacksUsed.textContent = `Attacks used: ${formatNumber(data.clan?.attacks)}`;

  enemyName.textContent = data.opponent?.name || "Opponent";
  enemyWarStars.textContent = `${data.opponent?.stars ?? "--"} ⭐`;
  enemyWarDestruction.textContent = `${data.opponent?.destructionPercentage ?? "--"}% destruction`;
  enemyAttacksUsed.textContent = `Attacks used: ${formatNumber(data.opponent?.attacks)}`;

  warTeamSize.textContent = data.teamSize ?? "--";
  warEndTime.textContent = formatDateTime(data.endTime);
}

function renderRaid(data) {
  const season = data?.items?.[0];

  if (!season) {
    raidLoot.textContent = "--";
    raidCompleted.textContent = "--";
    raidDestroyed.textContent = "--";
    raidAttacks.textContent = "--";
    raidDateRange.textContent = "No recent raid weekend data found.";
    return;
  }

  raidLoot.textContent = formatNumber(season.capitalTotalLoot);
  raidCompleted.textContent = formatNumber(season.raidsCompleted);
  raidDestroyed.textContent = formatNumber(season.enemyDistrictsDestroyed);
  raidAttacks.textContent = formatNumber(season.totalAttacks);

  const start = formatDateTime(season.startTime);
  const end = formatDateTime(season.endTime);
  raidDateRange.textContent = `Season: ${start} → ${end}`;
}

function renderMembers(list) {
  if (!list.length) {
    membersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">No members found.</td>
      </tr>
    `;
    return;
  }

  membersTableBody.innerHTML = list.map((member, index) => {
    const leagueIcon = member.league?.iconUrls?.tiny || member.league?.iconUrls?.small || "";
    const leagueName = member.league?.name || "Unranked";

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <div class="player-cell">
            <span class="rank-badge">${index + 1}</span>
            <div>
              <strong>${member.name || "Unknown"}</strong><br>
              <span class="muted">${member.tag || ""}</span>
            </div>
          </div>
        </td>
        <td><span class="role-chip">${roleLabel(member.role)}</span></td>
        <td>${formatNumber(member.trophies)}</td>
        <td>${formatNumber(member.builderBaseTrophies)}</td>
        <td>${formatNumber(member.donations)}</td>
        <td>
          ${leagueIcon ? `<img src="${leagueIcon}" alt="${leagueName}" style="width:22px;height:22px;vertical-align:middle;margin-right:8px;">` : ""}
          ${leagueName}
        </td>
      </tr>
    `;
  }).join("");
}

function filterMembers() {
  const term = memberSearch.value.trim().toLowerCase();

  const filtered = membersCache.filter(member =>
    (member.name || "").toLowerCase().includes(term) ||
    (member.tag || "").toLowerCase().includes(term) ||
    roleLabel(member.role).toLowerCase().includes(term)
  );

  renderMembers(filtered);
}

async function loadAllData() {
  try {
    setStatus("Loading clan data...");
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading...";

    const [clan, war, raid] = await Promise.all([
      fetchJSON(`/api/clan?tag=${ENCODED_TAG}`),
      fetchJSON(`/api/currentwar?tag=${ENCODED_TAG}`),
      fetchJSON(`/api/capitalraid?tag=${ENCODED_TAG}`)
    ]);

    renderClan(clan);
    renderWar(war);
    renderRaid(raid);

    setStatus(`Loaded data for ${clan.name || CLAN_TAG}`);
  } catch (error) {
    console.error(error);
    setStatus("Could not load live data. Check your backend/proxy.", true);

    membersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Error loading data. Make sure your backend routes are working:
          /api/clan, /api/currentwar, /api/capitalraid
        </td>
      </tr>
    `;

    warStateTag.textContent = "Error";
    raidDateRange.textContent = "Raid data unavailable.";
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh Data";
  }
}

refreshBtn.addEventListener("click", loadAllData);
memberSearch.addEventListener("input", filterMembers);

loadAllData();