using System.Text.RegularExpressions;

namespace Kernel.App.Platform.Naming;

/// <summary>
/// The comparison behind three claims' registries (SEC-3's PII names, SEC-2's server-owned fields, TEN-1's
/// tenant-shaped names), and the part every one of those claims used to leave to the edition.
///
/// E-9 is the record of why this exists. Each of the three claims called its list a heuristic and named the same
/// weakness, novelty: SEC-3's weakening note says "a novel parameter name carrying PII escapes it", SEC-2's says a
/// field named `newState` slips past a registry listing `status`. Both are true and neither is the failure that
/// occurs. The comparison here was `hashSet.Contains(name.ToLowerInvariant())`, which is equality, so `email` was
/// on the list and `emailAddress` walked past it. No novelty was required.
///
/// The obvious repair is the sibling edition's: split a name into tokens and match an entry as a contiguous run of
/// them. Measured, that is NOT strictly better. The round 4 audit found the two matchers **incomparable**:
/// tokenizing wins on every spelling that carries a boundary and LOSES on every all-lowercase concatenation,
/// because `firstname` is one token and shares none with `name`. Six further inputs escape BOTH: `e_mail`,
/// `e-mail`, `EMailAddress`, `mail`, `emails` and `email1`, every one of them carrying an email address past a
/// list whose first entry is `email`. So this is not a port. It has to beat both, and the four rules below are
/// each aimed at one class the claims name:
///
/// - **Compounds.** A name is tokenized on camel case, separators and letter/digit boundaries, and every
///   contiguous run of tokens is re-glued into a candidate word. `emailAddress` and `user_email` both yield the
///   word `email`.
/// - **Concatenations.** A candidate word that merely BEGINS or ENDS with an entry matches it, which is the class
///   the token matcher cannot reach: `firstname` and `notestatus` carry no boundary to split on. This is the rule
///   with a cost and the cost is asserted rather than described (see NameComparisonTests).
/// - **Decompositions.** Re-gluing runs is what resolves `e_mail` and `EMailAddress`, whose tokens are `e` and
///   `mail`. The bare `mail` needs one rule more: an entry whose first character is a particle (`e-mail`, `x-ray`)
///   also matches its own tail, so `email` covers `mail`.
/// - **Plurals.** A token is not stemmed, so `emails` is compared against `email` explicitly.
///
/// Enumerating those spellings by hand instead is what all three claims now say does not discharge the
/// obligation, and the registries here are shorter than the ones they replace BECAUSE the comparison derives what
/// they used to list. Every dropped spelling is asserted to still match.
///
/// It lives in the application assembly rather than the test assembly because one of its readers runs at runtime.
/// AI-1's `ToolExecutor` asks the same question of an actor-supplied argument name that the build-time guards ask
/// of a URL segment or a model property, and while it sat in the tests it could not, so it carried its own
/// twenty-one entry list compared by equality. That list claimed parity with the URL and EF-model guards and did
/// not have it: five of eleven identity-shaped keys survived it, `workspaceId` and `accountId` among them (E-53).
/// A guard whose comparison cannot be shared grows a second registry, and the second one is always the weaker.
/// </summary>
public static class NameComparison
{
    /// <summary>
    /// How much entry a glued word has to carry before its remainder is allowed to be anything at all. `tenant` in
    /// `tenantslug` is a tenant; `org` in `origin` is a coincidence, and `origin` is an ordinary request header, so
    /// the sibling edition rejected the prefix rule outright over it. Four characters is where the two separate in
    /// these registries, and a shorter entry has to meet a declared affix instead.
    /// </summary>
    private const int MinimumGluedEntry = 4;

    /// <summary>Below this the tail of a decomposed entry is a fragment rather than a word: `email` yields `mail`,
    /// `dob` does not yield `ob`.</summary>
    private const int MinimumDecomposition = 3;

    /// <summary>
    /// What a short entry may be glued to. This is a closed list on purpose: it is the licence a three-letter
    /// entry needs to match inside a longer word, and widening it is how `org` starts matching `origin`.
    /// </summary>
    private static readonly string[] Affixes = ["id", "ids", "key", "keys", "no", "num", "number", "code", "slug"];

    private static readonly Regex CamelBoundary = new("([a-z0-9])([A-Z])", RegexOptions.Compiled);
    private static readonly Regex AcronymBoundary = new("([A-Z]+)([A-Z][a-z])", RegexOptions.Compiled);
    private static readonly Regex LetterDigitBoundary = new("([A-Za-z])([0-9])", RegexOptions.Compiled);
    private static readonly Regex DigitLetterBoundary = new("([0-9])([A-Za-z])", RegexOptions.Compiled);
    private static readonly Regex Separators = new("[^A-Za-z0-9]+", RegexOptions.Compiled);

    /// <summary>
    /// A name's words, lowercased. Digits are a boundary, which the round 4 audit found by running the inputs
    /// rather than reasoning about them: `email1` was one token and matched nothing, and a numbered field is the
    /// ordinary way a form carries a second address.
    /// </summary>
    public static IReadOnlyList<string> Tokenize(string name)
    {
        var spaced = CamelBoundary.Replace(name, "$1 $2");
        spaced = AcronymBoundary.Replace(spaced, "$1 $2");
        spaced = LetterDigitBoundary.Replace(spaced, "$1 $2");
        spaced = DigitLetterBoundary.Replace(spaced, "$1 $2");

        return Separators.Split(spaced)
            .Where(part => part.Length > 0)
            .Select(part => part.ToLowerInvariant())
            .ToList();
    }

    /// <summary>The name with every boundary removed, which is the spelling a concatenation arrives in.</summary>
    public static string Glue(string name) => string.Concat(Tokenize(name));

    public static bool Matches(IReadOnlyList<NameRule> rules, string name) => MatchingRule(rules, name) is not null;

    public static NameRule? MatchingRule(IReadOnlyList<NameRule> rules, string name)
    {
        var tokens = Tokenize(name);
        if (tokens.Count == 0)
        {
            return null;
        }

        foreach (var rule in rules)
        {
            if (Matches(rule, tokens))
            {
                return rule;
            }
        }

        return null;
    }

    private static bool Matches(NameRule rule, IReadOnlyList<string> tokens)
    {
        var entry = Glue(rule.Entry);

        if (rule.Mode == NameMatchMode.Whole)
        {
            return string.Concat(tokens) == entry;
        }

        return Words(tokens).Any(word => WordMatches(word, entry));
    }

    private static bool WordMatches(string word, string entry)
    {
        if (word == entry)
        {
            return true;
        }

        // Plurals. A token is not stemmed, and `SERVER_CONTROLLED_FIELDS` in the sibling already knew this,
        // carrying `role` beside `roles` while the PII list next to it did not and `emails` walked past `email`.
        if (word == entry + "s" || word == entry + "es")
        {
            return true;
        }

        // Concatenation: the class the token matcher cannot reach, because there is no boundary to split on.
        if (word.Length > entry.Length && (word.StartsWith(entry, StringComparison.Ordinal) || word.EndsWith(entry, StringComparison.Ordinal)))
        {
            var residue = word.StartsWith(entry, StringComparison.Ordinal) ? word[entry.Length..] : word[..^entry.Length];
            if (entry.Length >= MinimumGluedEntry || Affixes.Contains(residue, StringComparer.Ordinal))
            {
                return true;
            }
        }

        // Decomposition: an entry whose first character is a particle also matches its own tail, so `email` covers
        // `mail` without `mail` being a second entry. The cost is that it also derives non-words (`phone` yields
        // `hone`), which is asserted in the tests rather than left to this comment.
        return entry.Length - word.Length == 1
            && word.Length >= MinimumDecomposition
            && entry.EndsWith(word, StringComparison.Ordinal);
    }

    /// <summary>Every contiguous run of tokens, re-glued. This is what turns `e_mail` and `EMailAddress`, whose
    /// tokens are `e` and `mail`, back into the word the registry lists.</summary>
    private static IEnumerable<string> Words(IReadOnlyList<string> tokens)
    {
        for (var start = 0; start < tokens.Count; start++)
        {
            for (var end = start; end < tokens.Count; end++)
            {
                yield return string.Concat(tokens.Skip(start).Take(end - start + 1));
            }
        }
    }
}
