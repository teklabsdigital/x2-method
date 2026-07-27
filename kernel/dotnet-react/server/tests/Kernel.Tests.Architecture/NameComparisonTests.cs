using Kernel.App.Platform.Naming;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-2, SEC-3 and TEN-1 all now carry a comparison obligation, and this is where it is discharged. The three
/// claims say the same thing in three places: the comparison is part of the mechanism and not only the list, it
/// resolves compounds, concatenations, decompositions and plurals of a listed word, and enumerating the spellings
/// by hand is a list standing in for a comparison and does not discharge it.
///
/// So the test comes in three parts, and the third is the one that keeps this honest:
///
/// 1. **What the claims name.** Every spelling the three claim files write out, asserted against the base entry
///    the registries actually carry.
/// 2. **What both editions missed.** The six inputs the round 4 audit found by running them rather than reasoning
///    about them, each of which walks past equality AND past token matching.
/// 3. **What this costs.** The false positives and the residual holes, asserted as PASSING tests, so that a later
///    narrowing of the comparison turns them red instead of quietly shrinking the surface. That discipline has
///    fired twice in this repo and been right both times.
/// </summary>
public sealed class NameComparisonTests
{
    private static readonly NameRule[] Pii = [NameRule.Rule("email"), NameRule.Rule("name"), NameRule.Rule("phone")];

    private static readonly NameRule[] Tenant =
        [NameRule.Rule("tenant"), NameRule.Rule("org"), NameRule.Rule("organisation")];

    /// <summary>
    /// SEC-3's own sentence: an entry `email` covers `emailAddress`, `user_email`, `e_mail`, `EMailAddress`,
    /// `mail`, `emails` and `email1`. Seven spellings, one entry, and the claim says listing them is not an
    /// answer. Five of the seven walk past the equality this edition shipped; two of them walk past the sibling's
    /// token matcher as well.
    /// </summary>
    [Theory]
    [InlineData("emailAddress")]   // compound, camel case
    [InlineData("user_email")]     // compound, separator
    [InlineData("USER_EMAIL")]     // and the same in the spelling a query string often carries
    [InlineData("emailaddress")]   // concatenation: no boundary at all
    [InlineData("e_mail")]         // decomposition
    [InlineData("e-mail")]         // decomposition, the spelling a header uses
    [InlineData("EMailAddress")]   // decomposition inside a compound
    [InlineData("mail")]           // the head of the decomposed entry, alone
    [InlineData("emails")]         // plural
    [InlineData("email1")]         // numbered, which is how a form carries a second address
    public void An_entry_covers_every_spelling_of_itself_the_claim_names(string name) =>
        Assert.True(NameComparison.Matches(Pii, name), $"'{name}' walked past the PII comparison (SEC-3, E-9).");

    /// <summary>
    /// TEN-1's sentence: an entry `tenant` covers `tenantId` and `tenantid`, and an entry `org` covers `orgId`
    /// and `orgid`. The concatenated spellings are the class the sibling's token matcher cannot reach at all, and
    /// TEN-1 says why it matters here rather than in the abstract: on the header surface there may be no case
    /// boundary to tokenize on, so a comparison that depends on one is dead on the surface the claim's fourth
    /// mechanism guards.
    /// </summary>
    [Theory]
    [InlineData("tenantId")]
    [InlineData("tenantid")]
    [InlineData("tenant_id")]
    [InlineData("TENANTID")]
    [InlineData("tenantSlug")]
    [InlineData("tenantslug")]
    [InlineData("orgId")]
    [InlineData("orgid")]
    [InlineData("organisationid")]
    [InlineData("organisationId")]
    public void A_tenant_entry_covers_the_concatenations_a_caller_would_actually_send(string name) =>
        Assert.True(NameComparison.Matches(Tenant, name), $"'{name}' walked past the tenant comparison (TEN-1, E-9).");

    /// <summary>
    /// SEC-2's sentence: a registry entry `status` covers `noteStatus` and `notestatus`. The first walks past
    /// equality, the second walks past token matching, and no single one of the two matchers this repo has built
    /// before catches both.
    /// </summary>
    [Theory]
    [InlineData("noteStatus")]
    [InlineData("notestatus")]
    [InlineData("createdAtUtc")]
    [InlineData("createdatutc")]
    [InlineData("ownerRole")]
    [InlineData("roles")]
    [InlineData("permissions")]
    [InlineData("isAdministrator")]
    public void A_server_controlled_entry_covers_the_compounds_and_concatenations(string name) =>
        Assert.True(ServerControlledFields.Matches(name), $"'{name}' walked past the SEC-2 comparison (E-9).");

    /// <summary>
    /// The registries got SHORTER when the comparison arrived, and this is the assertion that makes that safe. If
    /// a base entry is ever weakened, the spellings that used to be enumerated stop matching and this goes red,
    /// which is the only thing standing between "a comparison replaced the list" and "the list was deleted".
    /// </summary>
    [Fact]
    public void Every_spelling_the_registries_used_to_enumerate_still_matches()
    {
        string[] wereTenantEntries =
            ["tenantid", "orgid", "organizationid", "organisationid", "workspaceid", "workspaceslug", "accountid"];
        foreach (var name in wereTenantEntries)
        {
            Assert.True(NameComparison.Matches(EndpointSpineTests.ForbiddenUrlNames, name),
                $"'{name}' was a registry entry before the comparison and is now derived from none of them.");
        }

        string[] werePiiEntries = ["firstname", "lastname", "dateofbirth", "dateOfBirth"];
        foreach (var name in werePiiEntries)
        {
            Assert.True(NameComparison.Matches(EndpointSpineTests.ForbiddenUrlNames, name),
                $"'{name}' was a registry entry before the comparison and is now derived from none of them.");
        }

        // The flat guard still matches by equality, so its list is longer by exactly the spellings the comparison
        // derives. It may be the weaker net; it may not be a DIFFERENT net, which is what one shared registry is
        // for. Repairing that guard belongs to MOD-2's delta pass.
        foreach (var name in ServerControlledFields.Names)
        {
            Assert.True(ServerControlledFields.Matches(name),
                $"The flat registry carries '{name}' and the comparison does not match it, so the two SEC-2 guards now disagree.");
        }
    }

    /// <summary>
    /// The costs, asserted rather than described. Each of these is a false positive by construction: the
    /// concatenation rule cannot tell a compound word from a coincidence, and a comparison that is quietly
    /// narrowed to remove them removes the coverage above with them.
    /// </summary>
    [Fact]
    public void The_false_positives_the_comparison_buys_are_visible_in_the_suite()
    {
        // `fileName` tokenizes to `file name`, which contains the run `name`. The sibling edition met this exact
        // cost and wrote it down; a route wanting a filename in a query string says so at review, in writing.
        Assert.True(NameComparison.Matches(Pii, "fileName"));
        Assert.True(NameComparison.Matches(Pii, "filename"));

        // `voicemail` ends with the letters of `email` and carries no boundary, so the concatenation rule fires.
        // The sibling's token matcher does not flag it. This one is arguably correct and it is still a coincidence.
        Assert.True(NameComparison.Matches(Pii, "voicemail"));

        // The decomposition rule derives non-words from every entry, not just the one it was built for.
        Assert.True(NameComparison.Matches(Pii, "hone"));

        // And the boundary the costs stop at, which is the reason `org` is not a prefix rule: `origin` is an
        // ordinary request header, and the sibling rejected the prefix alternative over exactly this input.
        Assert.False(NameComparison.Matches(Tenant, "origin"));

        // A short entry still needs a declared affix, so `orgy` and `orgo` are not tenant names.
        Assert.False(NameComparison.Matches(Tenant, "organic"));

        // `id` is whole-name, or every foreign key a legitimate body carries would be a SEC-2 violation.
        Assert.False(ServerControlledFields.Matches("parentId"));
        Assert.False(ServerControlledFields.Matches("noteId"));
        Assert.True(ServerControlledFields.Matches("id"));
        Assert.True(ServerControlledFields.Matches("Id"));
    }

    /// <summary>
    /// The residual: what still walks past this comparison. It is asserted as a PASSING test in the direction of
    /// the hole, so closing it later breaks this test rather than passing unnoticed, and so nobody reads the
    /// section above as "the comparison is complete". A name list is a heuristic and this is where it ends.
    /// </summary>
    [Fact]
    public void What_still_walks_past_the_comparison_is_recorded_here_and_not_in_a_comment()
    {
        // A synonym is not a morphology, and this is where SEC-2's weakening note picked the wrong example.
        // Measured: `newState` is CAUGHT, and not by the entry the note names. The note reads "a field named
        // `newState` slips past a registry listing `status`", which is true of `status` alone and false of this
        // registry, because `state` is an entry beside it and `newState` is a compound of that. The residual the
        // note was reaching for is real and needs a word the registry does not carry at all.
        Assert.True(ServerControlledFields.Matches("newState"));
        Assert.False(ServerControlledFields.Matches("approvalStage"));
        Assert.False(ServerControlledFields.Matches("lifecyclePhase"));

        // An abbreviation the registry does not carry: no rule derives `tid` or `orgunit` from `tenant`.
        Assert.False(NameComparison.Matches(Tenant, "tid"));

        // Measured, not predicted: `electronicMail` IS caught, because the decomposition rule makes `mail` a word
        // the entry `email` matches wherever it appears, not only in `e_mail`. Recorded here because the reach of
        // a rule is not the reach of the example it was written for.
        Assert.True(NameComparison.Matches(Pii, "electronicMail"));

        // A reordering is a residual class of its own. `dateOfBirth` glues to one word and a comparison over
        // contiguous runs cannot reach a name that says the same thing backwards.
        Assert.False(NameComparison.Matches([NameRule.Rule("dateOfBirth")], "birthDate"));

        // A plural formed by anything but s/es. A token is not stemmed and this comparison does not stem either.
        Assert.False(NameComparison.Matches([NameRule.Rule("identity")], "identities"));

        // And the class no name comparison reaches at all: a parameter whose name says nothing. This is the
        // residual all three claims already name, and the one a registry cannot close.
        Assert.False(NameComparison.Matches(Pii, "q"));
    }
}
