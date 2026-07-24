---
id: SEC-10
family: security
locus: centralized
provenance: compliance-mapping pass 2026-07-24 (MFA requirements: E8 maturity level 1 and up; SOC 2 TSC CC6.1)
---

# SEC-10: Authentication strength is asserted at mint and verified at the gate

**Statement.** Tokens carrying privileged scope are refused unless the credential asserts a second factor recorded at mint. When the product owns identity, the mint path will not issue a privileged single-factor session. When identity is delegated to an external provider, the required method assertion in the incoming credential is mandatory configuration (DATA-5): the host verifies it is present rather than assuming the provider enforced it. Whether the requirement extends beyond privileged principals to all users of an internet-facing product is a ruled per-project figure, set by the strictest regime the product answers to.

**Harm.** SEC-4 hardens the token after sign-in and says nothing about sign-in itself: a phished password mints a fully valid, algorithm-pinned, version-current session, and the strongest token discipline then faithfully transports the stolen identity. Privileged accounts are the first target and the cheapest surface to protect.

**Enforcement.**
- Mechanism class: host tests in the SEC-4 family: a privileged-scope token without the method assertion is refused, the mint path refuses privileged single-factor issuance, and the harness exercises the real sign-in path through its gated profile (TEST-2).
- Edition: owed; trigger: first identity slice (shared with SEC-4's version store and TEN-6).

**Weakening notes.** The application verifies what the credential asserts, not what happened at the sign-in ceremony; trust in the issuer is SEC-4's premise, and a lying issuer is out of scope. The phishing resistance of the factor itself is a per-project ruling; this claim mandates the presence and verification of the assertion, not the ceremony's strength.
