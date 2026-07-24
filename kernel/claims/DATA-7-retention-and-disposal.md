---
id: DATA-7
family: data
locus: centralized declaration, per-class mechanism
provenance: compliance-mapping pass 2026-07-24 (retention and disposal: SOC 2 TSC C1.2 and the privacy criteria); promotes crypto-shredding RTBF from the explicitly-out list
---

# DATA-7: Retention is ruled and disposal is a tested mechanism

**Statement.** Every entity holding PII or confidential content declares a retention class from a closed registry, the same marker idiom TEN-3 uses for tenant ownership. Each class names its ruled retention bound and its disposal mechanism (hard delete, anonymization, or crypto-shredding), and each mechanism is a tested seam. A disposal sweep that crosses tenants is ledgered under TEN-5. An externally arriving deletion obligation (a contract clause, a data-subject request) maps to a class, never to ad hoc SQL against production.

**Harm.** Nothing else in the catalog says data ever leaves, and retention by default is retention forever: data held past need converts a breach into a reportable incident, and every deletion request becomes hand-run production SQL, the exact unledgered cross-tenant access TEN-5 exists to kill.

**Enforcement.**
- Mechanism class: an architecture test rejects an entity carrying PII-shaped members (a name-list heuristic, the SEC-3 idiom) without a retention-class declaration; each class's disposal mechanism owes a named test; cross-tenant sweeps carry TEN-5 ledger rows.
- Edition: owed; trigger: the first PII-bearing entity in an edition project, or the first contractual deletion clause, whichever lands first.

**Weakening notes.** The PII-shape list is heuristic and extends per project at D-000, like SEC-3's. The scan proves declaration, not that the ruled bound is right: the bound is a legal and contractual question, a D-000 ruling the claim records rather than answers. Crypto-shredding is the named mechanism where backups can reach the data: a disposal sweep cannot reach a backup, key destruction can; it is built when the first class needs it, not before.
