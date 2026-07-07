function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function baseStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 11px; margin: 0; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .doc-header img { max-height: 60px; max-width: 120px; object-fit: contain; }
    .doc-header .logo-slot { width: 120px; height: 60px; display: flex; align-items: center; justify-content: center; }
    .doc-title { text-align: center; flex: 1; }
    .doc-title h1 { font-size: 18px; margin: 0; color: #1f3864; }
    .doc-title h2 { font-size: 14px; margin: 2px 0 0; color: #1f3864; font-weight: normal; }
    .meta-line { color: #444; font-size: 11px; margin-bottom: 4px; }
    hr.divider { border: none; border-top: 1px solid #ccc; margin: 10px 0 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
    th, td { border: 1px solid #b0b0b0; padding: 6px 8px; font-size: 10.5px; text-align: left; vertical-align: middle; }
    th { background: #1f3864; color: #fff; font-size: 10px; text-transform: uppercase; }
    td.disabled { background: #6b7280; }
    tr.total-row td { background: #dbe5f1; font-weight: bold; }
    h3.section { font-size: 12px; color: #1f3864; margin: 16px 0 6px; }
    .policy-block { font-size: 10.5px; margin-bottom: 10px; }
    .policy-block .label { font-weight: bold; text-decoration: underline; }
    .totals-row { display: flex; gap: 16px; align-items: center; margin: 12px 0; font-size: 11px; }
    .totals-row .box { border: 1px solid #333; padding: 4px 14px; min-width: 40px; text-align: center; }
    .sign-grid { display: flex; justify-content: space-between; margin-top: 24px; gap: 24px; }
    .sign-box { flex: 1; }
    .sign-box .line { border: 1px solid #999; height: 70px; margin-bottom: 6px; }
    .sign-box .caption { font-size: 10.5px; color: #444; }
    .photo-circle { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; background: #ddd; }
    .doc-footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; }
  `;
}

function docHeader(gameLogoUrl: string | null, federationLogoUrl: string | null, title: string, subtitle?: string) {
  return `
    <div class="doc-header">
      <div class="logo-slot">${federationLogoUrl ? `<img src="${esc(federationLogoUrl)}" />` : ""}</div>
      <div class="doc-title">
        <h1>${esc(title)}</h1>
        ${subtitle ? `<h2>${esc(subtitle)}</h2>` : ""}
      </div>
      <div class="logo-slot">${gameLogoUrl ? `<img src="${esc(gameLogoUrl)}" />` : ""}</div>
    </div>
  `;
}

export type EntryByEventRow = {
  eventName: string;
  gender: "male" | "female" | "mixed";
  maxMale: number;
  maxFemale: number;
  declaredMale: number;
  declaredFemale: number;
};

export function buildEntryByEventHtml(params: {
  gameName: string;
  gameLogoUrl: string | null;
  federationName: string;
  federationLogoUrl: string | null;
  sportName: string;
  rows: EntryByEventRow[];
  entryPolicyNote: string | null;
  ageCutoffDate: string | null;
  referenceCode: string;
}) {
  const { gameName, gameLogoUrl, federationName, federationLogoUrl, sportName, rows, entryPolicyNote, ageCutoffDate, referenceCode } = params;

  const totalMale = rows.reduce((sum, r) => sum + (r.declaredMale || 0), 0);
  const totalFemale = rows.reduce((sum, r) => sum + (r.declaredFemale || 0), 0);

  const bodyRows = rows.map((r) => {
    const maleCell = r.gender === "female"
      ? `<td class="disabled"></td>`
      : `<td>${r.declaredMale}</td>`;
    const femaleCell = r.gender === "male"
      ? `<td class="disabled"></td>`
      : `<td>${r.declaredFemale}</td>`;
    return `<tr><td>${esc(sportName)}</td><td><i>${esc(r.eventName)}</i></td>${maleCell}${femaleCell}</tr>`;
  }).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(gameLogoUrl, federationLogoUrl, "Entry by Event", sportName)}
    <div class="meta-line">Game: ${esc(gameName)}</div>
    <div class="meta-line">Federation: ${esc(federationName)}</div>
    <div class="meta-line">Generated on: ${esc(new Date().toLocaleDateString())}</div>
    <hr class="divider" />

    <table>
      <thead><tr><th>Sport</th><th>Event</th><th>Male</th><th>Female</th></tr></thead>
      <tbody>
        ${bodyRows}
        <tr class="total-row"><td colspan="2">Total Entries</td><td>${totalMale}</td><td>${totalFemale}</td></tr>
      </tbody>
    </table>

    ${entryPolicyNote ? `
      <h3 class="section">Entry Policy</h3>
      <div class="policy-block">${esc(entryPolicyNote).replace(/\n/g, "<br/>")}</div>
    ` : ""}

    ${ageCutoffDate ? `
      <h3 class="section">Age Eligibility</h3>
      <div class="policy-block">Athletes must be born on or before ${esc(new Date(ageCutoffDate).toLocaleDateString())} to be eligible.</div>
    ` : ""}

    <div class="totals-row">
      <span>Total Number of Athletes</span>
      <span>Male <span class="box">${totalMale}</span></span>
      <span>Female <span class="box">${totalFemale}</span></span>
    </div>

    <div class="sign-grid">
      <div class="sign-box">
        <div class="line"></div>
        <div class="caption">Name: ________________________<br/>Position: ________________________<br/>Date: ________________________</div>
      </div>
      <div class="sign-box">
        <div class="line"></div>
        <div class="caption">Federation Stamp / Seal</div>
      </div>
    </div>

    <div class="doc-footer">Document Reference: ${esc(referenceCode)}</div>
  </body></html>`;
}

export type DelegationPerson = {
  photoUrl: string | null;
  nameEn: string;
  sportOrPosition: string;
  eventOrContact: string;
  dob: string | null;
  contact?: string | null;
  email?: string | null;
  tshirtSize: string | null;
  suitSize: string | null;
  hasPassport: boolean;
};

export function buildDelegationListHtml(params: {
  phase: "Long List" | "Short List";
  gameName: string;
  gameLogoUrl: string | null;
  federationName: string;
  federationLogoUrl: string | null;
  athletes: DelegationPerson[];
  officials: DelegationPerson[];
  referenceCode: string;
}) {
  const { phase, gameName, gameLogoUrl, federationName, federationLogoUrl, athletes, officials, referenceCode } = params;

  const photoCell = (url: string | null) => url
    ? `<img class="photo-circle" src="${esc(url)}" />`
    : `<div class="photo-circle"></div>`;

  const athleteRows = athletes.map((a) => `
    <tr>
      <td>${photoCell(a.photoUrl)}</td>
      <td>${esc(a.nameEn)}</td>
      <td>${esc(a.sportOrPosition)}</td>
      <td>${esc(a.eventOrContact)}</td>
      <td>${a.dob ? esc(new Date(a.dob).toLocaleDateString()) : "-"}</td>
      <td>${esc(a.tshirtSize ?? "-")}</td>
      <td>${esc(a.suitSize ?? "-")}</td>
      <td>${a.hasPassport ? "Yes" : "No"}</td>
    </tr>
  `).join("");

  const officialRows = officials.map((o) => `
    <tr>
      <td>${photoCell(o.photoUrl)}</td>
      <td>${esc(o.nameEn)}</td>
      <td>${esc(o.sportOrPosition)}</td>
      <td>${esc(o.dob ? new Date(o.dob).toLocaleDateString() : "-")}</td>
      <td>${esc(o.contact ?? "-")}</td>
      <td>${esc(o.email ?? "-")}</td>
      <td>${esc(o.tshirtSize ?? "-")}</td>
      <td>${esc(o.suitSize ?? "-")}</td>
      <td>${o.hasPassport ? "Yes" : "No"}</td>
    </tr>
  `).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body>
    ${docHeader(gameLogoUrl, federationLogoUrl, `Delegation ${phase}`)}
    <div class="meta-line">Game: ${esc(gameName)}</div>
    <div class="meta-line">Federation: ${esc(federationName)}</div>
    <div class="meta-line">Generated on: ${esc(new Date().toLocaleDateString())}</div>
    <hr class="divider" />

    <h3 class="section">1. Selected Athletes</h3>
    <table>
      <thead><tr><th>Photo</th><th>Name</th><th>Sport</th><th>Event/Category</th><th>DOB</th><th>T-Shirt</th><th>Suit</th><th>Passport</th></tr></thead>
      <tbody>${athleteRows || `<tr><td colspan="8">None selected</td></tr>`}</tbody>
    </table>

    <h3 class="section">2. Selected Team Officials</h3>
    <table>
      <thead><tr><th>Photo</th><th>Name</th><th>Position</th><th>DOB</th><th>Contact</th><th>Email</th><th>T-Shirt</th><th>Suit</th><th>Passport</th></tr></thead>
      <tbody>${officialRows || `<tr><td colspan="9">None selected</td></tr>`}</tbody>
    </table>

    <h3 class="section">3. Signatures &amp; Declarations</h3>
    <div class="policy-block">
      By signing below, the Federation Representative confirms that all information provided in this document is accurate, final, and complies with the regulations of the event.
    </div>
    <div class="sign-grid">
      <div class="sign-box">
        <div class="line"></div>
        <div class="caption">Federation Representative Signature<br/>Date: ________________________</div>
      </div>
      <div class="sign-box">
        <div class="line"></div>
        <div class="caption">Federation Stamp / Seal<br/>Name: ________________________</div>
      </div>
    </div>

    <div class="doc-footer">Document Reference: ${esc(referenceCode)}</div>
  </body></html>`;
}
