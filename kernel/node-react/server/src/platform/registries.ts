import { rule, type FieldRule } from './nameMatching.ts';

// The three name registries, in one file, because three claims each say their registry is a single named list
// and because two of them are now read from two places. SEC-3's and SEC-2's are read only by the scan; TEN-1's
// is read by the scan AND by the runtime header strip in `app.ts`, and a tenant list that differed between the
// two would mean the thing the scan proves and the thing the server enforces were different sets.
//
// This is platform rather than test-side for that reason. The sibling edition keeps its registry beside its arch
// tests, which is right when the registry is only ever an assertion; it stops being right the moment one of them
// also has to be a runtime behaviour.

// SEC-3. The claim's own list is email, phone, name, ssn, dob. The rest are here because token matching cannot
// derive them, and the round 3 audit corrected this comment's own arithmetic, so the correction is written here
// rather than only in the register.
//
// **The token matcher and the sibling's equality matcher are incomparable, not ordered.** Tokenizing beats
// equality on every spelling that carries a boundary (`emailAddress`, `user_email`, `EMAIL`), and LOSES to it on
// every all-lowercase concatenation, because `firstname` is one token and shares none with `name`. The sibling
// hand-enumerates `firstname`, `lastname`, `dateofbirth` and `organisationid` precisely because those are the
// concatenated forms equality needs, and every one of them walked past this list until the audit measured it.
// So the concatenated spellings are entries here too. This list is not shorter than the sibling's, and the
// earlier claim that it caught strictly more was false.
//
// A previous version of this comment named `dateofbirth` as the reason `dateOfBirth` is an entry. It was not:
// the ENTRY is tokenized as well, so `dateOfBirth` reduces to the run `date of birth` and never matched the
// single token `dateofbirth`. The entry stated the intent and did not do it, which is the aspirational
// enforcement this edition exists to refuse.
//
// This is the D-000 extension point the claim's weakening note names. A project whose domain introduces medical
// record numbers or licence plates adds them here, and here is the only place to add them.
export const PII_PARAMETERS: readonly FieldRule[] = Object.freeze([
  rule('email'),
  rule('phone'),
  rule('name'),
  rule('ssn'),
  rule('dob'),
  rule('dateOfBirth'),
  rule('surname'),
  rule('nationalId'),
  // The concatenated spellings. Each is a single token, so no run over the entries above can reach it.
  rule('firstname'),
  rule('lastname'),
  rule('dateofbirth'),
  rule('emailaddress'),
  rule('phonenumber'),
  rule('nationalid'),
  // The decompositions and the plurals, both found by running the round 4 audit's named inputs rather than
  // reasoning about them, and both missed by the sibling edition too.
  //
  // `mail` is here because `e_mail`, `e-mail` and `EMailAddress` all tokenize to a run containing `mail` and
  // none containing `email`, so the entry the list already had could not reach any of the three. It is safe as a
  // run entry rather than a substring: `mailbox` and `voicemail` are single tokens and do not match, while
  // `mailTo` does, which is correct.
  //
  // Plurals are enumerated because a token is not stemmed. `SERVER_CONTROLLED_FIELDS` already knew this and
  // carries `role` beside `roles`; this list did not, and `emails` walked past `email`.
  rule('mail'),
  rule('emails'),
  rule('phones'),
]);

// SEC-2. `id` is whole-name only; see nameMatching.ts for why a run would flag every foreign key a legitimate
// body carries. Plurals are listed because a token is not stemmed: `roles` and `role` share no token.
export const SERVER_CONTROLLED_FIELDS: readonly FieldRule[] = Object.freeze([
  rule('id', 'whole'),
  rule('tenantId'),
  rule('createdAt'),
  rule('updatedAt'),
  rule('createdBy'),
  rule('updatedBy'),
  rule('status'),
  rule('state'),
  rule('rowVersion'),
  rule('concurrencyToken'),
  rule('etag'),
  rule('version'),
  rule('role'),
  rule('roles'),
  rule('permission'),
  rule('permissions'),
  rule('isAdmin'),
]);

// TEN-1, and the registry where the concatenation gap was not merely theoretical.
//
// This list is read by the runtime header strip as well as by the scan, and a header name is the one surface
// where the tokenizer's strength is unavailable BY CONSTRUCTION: Node lowercases every header name before any
// hook sees it, so `X-TenantId` and `X-TenantID` both arrive as `x-tenantid`, which is two tokens (`x`,
// `tenantid`) and matches no run of `tenant`. Measured over real HTTP before the concatenated entries below
// existed: `x-tenant-id` was stripped and `X-TenantId` reached the handler with its forged value intact. The
// camel-case half of the matcher is dead on this surface and the separator half is all there is, which is why
// the concatenations have to be enumerated here even though enumeration is what E-9 criticizes. On the header
// surface there is nothing else to compare with.
export const TENANT_SHAPED: readonly FieldRule[] = Object.freeze([
  rule('tenant'),
  rule('org'),
  rule('organization'),
  rule('organisation'),
  rule('workspace'),
  // The concatenated spellings, each a single token. `org` deliberately has no concatenated partner beyond
  // `orgid`: a prefix rule would match `origin`, an ordinary request header, and stripping that would break
  // more than it protects.
  rule('tenantid'),
  rule('orgid'),
  rule('organizationid'),
  rule('organisationid'),
  rule('workspaceid'),
  rule('workspaceslug'),
]);

// SEC-5's registry, and the fourth list to use the shared matcher. A key whose name is secret-shaped may not
// carry a value in a committed file, and a literal that is assigned to a secret-shaped name in source is a
// committed secret whatever file it hides in.
//
// The mode choices are the interesting part and each is asserted rather than left to a comment. `key` is a
// `whole` entry: as a run it matches `keyboard`, `apiKeyName`, `keys` and every map-key variable in the server,
// which is the `fileName` problem SEC-3 already met, and a registry that cries wolf is a registry someone turns
// off. `secret`, `password`, `token` and `credential` are runs, because `clientSecret`, `dbPassword` and
// `refreshToken` are the spellings that actually occur. `signingKey` and `apiKey` are enumerated as runs so the
// compound forms are caught even though `key` alone is whole-mode.
export const SECRET_SHAPED: readonly FieldRule[] = Object.freeze([
  rule('secret'),
  rule('password'),
  rule('passwd'),
  rule('token'),
  rule('credential'),
  rule('signingKey'),
  rule('apiKey'),
  rule('privateKey'),
  rule('accessKey'),
  rule('connectionString'),
  rule('key', 'whole'),
  // The concatenated spellings, for the same reason TENANT_SHAPED carries them: a run over tokens cannot reach
  // a word nobody separated.
  rule('apikey'),
  rule('signingkey'),
  rule('privatekey'),
  rule('accesskey'),
  rule('connectionstring'),
]);

// TIME-1's registry, and the one whose entries are about SHAPE rather than about sensitivity. A property whose
// name says it carries an instant, declared as a bare string, is the naive datetime arriving as text: the wire
// form is what the contract surface actually has, so this is where the ban has to land.
//
// `at` and `on` are whole-name entries and the reason is the tokenizer, not caution. As runs they match `format`,
// `patient`, `station` and every word containing those letters as a token boundary is not what a run compares;
// `createdAt` tokenizes to `created at`, so the run `at` DOES match it, and so does `at` inside `atomic` only if
// `atomic` tokenized to `at omic`, which it does not. The whole-name mode is kept for `on` regardless, because
// `on` as a run matches `onRoute`, `onReady` and every hook name in the server.
export const TIME_SHAPED: readonly FieldRule[] = Object.freeze([
  rule('at'),
  rule('time'),
  rule('timestamp'),
  rule('date'),
  rule('datetime'),
  rule('expires'),
  rule('expiry'),
  rule('since'),
  rule('until'),
  rule('deadline'),
  rule('scheduled'),
  rule('on', 'whole'),
]);
