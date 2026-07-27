using Kernel.App.Platform.Tenancy;
using Kernel.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TEN-3. Built from the EF model (no connection needed): every tenant-owned entity leads its primary key with
/// TenantId, and every entity carrying a TenantId property is marked ITenantOwned (no unmarked tenant data).
///
/// Both assertions iterate a filtered set and say nothing when that set is empty, so both are asserted non-empty
/// first. Measured on 2026-07-27 (E-43): with `Note` stripped of its marker so a real violation was present, and
/// the tenant-column registry narrowed to a name no column carries, all 113 tests passed. The marker test found
/// no tenant-shaped column to complain about, the key test found no tenant-owned entity to check, and the two
/// halves went vacuous together.
///
/// The registry's extent is asserted separately, against an independently written floor rather than against the
/// registry, because a list read out of the thing under test shrinks when the thing under test shrinks.
/// </summary>
public sealed class TenantKeyTests
{
    [Fact]
    public void The_sets_these_assertions_iterate_are_not_empty()
    {
        var entities = Model().GetEntityTypes().ToList();
        Assert.True(entities.Count > 0, "The EF model holds no entities, so both TEN-3 assertions would pass without looking at anything (E-43).");
        Assert.True(entities.Any(e => typeof(ITenantOwned).IsAssignableFrom(e.ClrType)),
            "No entity is marked ITenantOwned, so the key assertion would pass without looking at anything (E-43). If this edition genuinely owns no tenant data yet, TEN-3 belongs at `owed` with that as its trigger, not `proven` over an empty set.");
    }

    // An independently written floor of spellings a tenant column plausibly arrives in. NOT derived from the
    // registry: the point is to catch the registry shrinking, and a derived list shrinks with it. Six of these
    // thirteen escaped the hand-written list TEN-3 carried until E-51, `tenant_id` and `TenantKey` among them.
    [Theory]
    [InlineData("TenantId")]
    [InlineData("tenantid")]
    [InlineData("tenant_id")]
    [InlineData("TenantID")]
    [InlineData("TenantIdentifier")]
    [InlineData("TenantKey")]
    [InlineData("OrgId")]
    [InlineData("orgid")]
    [InlineData("OrganizationId")]
    [InlineData("OrganisationId")]
    [InlineData("WorkspaceId")]
    [InlineData("workspaceslug")]
    [InlineData("AccountId")]
    public void A_tenant_shaped_column_is_recognised(string propertyName) =>
        Assert.True(TenantColumn.IsTenantShaped(propertyName),
            $"'{propertyName}' is not recognised as a tenant column, so an entity carrying it could go unmarked (TEN-3, E-51).");

    // The cost side. `Origin` is the one the node-react edition rejected a prefix rule over, and `NoteId` is the
    // ordinary foreign key a widening would start failing on.
    [Theory]
    [InlineData("Id")]
    [InlineData("Title")]
    [InlineData("Body")]
    [InlineData("CreatedAtUtc")]
    [InlineData("Origin")]
    [InlineData("NoteId")]
    public void An_ordinary_column_is_not_mistaken_for_one(string propertyName) =>
        Assert.False(TenantColumn.IsTenantShaped(propertyName),
            $"'{propertyName}' is wrongly treated as a tenant column (TEN-3, E-51).");

    [Fact]
    public void Every_tenant_owned_entity_leads_its_key_with_TenantId()
    {
        var exempt = KeyShapeExemption.Sanctioned.Select(e => e.Entity).ToHashSet(StringComparer.Ordinal);

        foreach (var entity in Model().GetEntityTypes().Where(e => typeof(ITenantOwned).IsAssignableFrom(e.ClrType)))
        {
            if (exempt.Contains(entity.ClrType.Name))
            {
                continue;
            }

            var key = entity.FindPrimaryKey();
            Assert.NotNull(key);
            Assert.Equal("TenantId", key!.Properties[0].Name);
        }
    }

    /// <summary>The exemption register, checked against what the model actually holds (TEN-3, E-44).</summary>
    [Fact]
    public void No_key_shape_exemption_is_stale_unjustified_or_unnecessary()
    {
        var model = Model();
        var entities = model.GetEntityTypes().Select(e => e.ClrType.Name).ToHashSet(StringComparer.Ordinal);
        var leadingWithTenant = model.GetEntityTypes()
            .Where(e => e.FindPrimaryKey()?.Properties[0].Name == "TenantId")
            .Select(e => e.ClrType.Name)
            .ToHashSet(StringComparer.Ordinal);

        Assert.Empty(KeyShapeExemption.Problems(KeyShapeExemption.Sanctioned, entities, leadingWithTenant));
    }

    /// <summary>
    /// The four rules, proven against fixtures rather than against the shipped register, which is empty. An empty
    /// register makes every assertion over it pass, so proving the mechanism from the shipped state would prove
    /// nothing at all: that is E-44's shape, one level up.
    /// </summary>
    [Theory]
    [InlineData("Ghost", "A long and entirely adequate justification for the exemption.", "not an entity in the model")]
    [InlineData("Invoice", "legacy", "no justification of substance")]
    [InlineData("Invoice", "", "no justification of substance")]
    [InlineData("Invoice", "   ", "no justification of substance")]
    [InlineData("Note", "A long and entirely adequate justification for the exemption.", "does not need to be")]
    public void The_exemption_register_refuses_a_bad_entry(string entity, string justification, string expected)
    {
        var problems = KeyShapeExemption.Problems(
            [new KeyShapeExemption.Exemption(entity, justification)],
            ["Note", "Invoice"],
            ["Note"]);

        Assert.Contains(problems, problem => problem.Contains(expected, StringComparison.Ordinal));
    }

    [Fact]
    public void The_exemption_register_refuses_a_duplicate()
    {
        const string Why = "A long and entirely adequate justification for the exemption.";
        var problems = KeyShapeExemption.Problems(
            [new KeyShapeExemption.Exemption("Invoice", Why), new KeyShapeExemption.Exemption("Invoice", Why)],
            ["Note", "Invoice"],
            ["Note"]);

        Assert.Contains(problems, problem => problem.Contains("exempted twice", StringComparison.Ordinal));
    }

    [Fact]
    public void A_well_formed_exemption_is_accepted()
    {
        var problems = KeyShapeExemption.Problems(
            [new KeyShapeExemption.Exemption("Invoice", "Rows are addressed by external invoice number, which the payment provider owns.")],
            ["Note", "Invoice"],
            ["Note"]);

        Assert.Empty(problems);
    }

    [Fact]
    public void Every_entity_with_a_tenant_column_is_marked_tenant_owned()
    {
        foreach (var entity in Model().GetEntityTypes())
        {
            var tenantColumn = entity.GetProperties().FirstOrDefault(p => TenantColumn.IsTenantShaped(p.Name));
            if (tenantColumn is null)
            {
                continue;
            }

            Assert.True(typeof(ITenantOwned).IsAssignableFrom(entity.ClrType),
                $"Entity '{entity.ClrType.Name}' has a tenant-shaped column '{tenantColumn.Name}' but does not implement ITenantOwned (TEN-3).");
        }
    }

    private static IModel Model()
    {
        var options = new DbContextOptionsBuilder<KernelDbContext>().UseSqlite("Data Source=:memory:").Options;
        using var db = new KernelDbContext(options, new StubScope());
        return db.Model;
    }

    private sealed class StubScope : ITenantScope
    {
        // Building the model never reads the scope; fail closed so a future test that does read it surfaces the
        // mistake instead of silently getting an empty tenant.
        public Guid Current => throw new NotSupportedException();

        public bool IsEstablished => false;

        public IDisposable Begin(Guid tenantId) => throw new NotSupportedException();
    }
}
