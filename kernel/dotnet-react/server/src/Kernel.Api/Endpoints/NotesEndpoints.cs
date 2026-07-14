using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kernel.Api.Endpoints;

public static class NotesEndpoints
{
    public static IEndpointRouteBuilder MapNotesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/notes", ListAsync).RequireAuthorization("perm:notes.read");
        app.MapGet("/notes/{id:guid}", GetAsync).RequireAuthorization("perm:notes.read");
        app.MapPost("/notes", CreateAsync).RequireAuthorization("perm:notes.write");
        app.MapDelete("/notes/{id:guid}", DeleteAsync).RequireAuthorization("perm:notes.write");

        return app;
    }

    private static async Task<Results<Ok<NoteListResponse>, ValidationProblem>> ListAsync(NoteService notes, string? cursor, int? limit, CancellationToken ct)
    {
        try
        {
            return TypedResults.Ok(await notes.ListAsync(cursor, limit, ct));
        }
        catch (FormatException)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]> { ["cursor"] = ["The cursor is not valid."] });
        }
    }

    private static async Task<Results<Ok<NoteResponse>, NotFound>> GetAsync(NoteService notes, Guid id, CancellationToken ct)
    {
        var note = await notes.GetAsync(id, ct);
        return note is null ? TypedResults.NotFound() : TypedResults.Ok(note);
    }

    private static async Task<Results<Created<NoteResponse>, ValidationProblem>> CreateAsync(NoteService notes, CreateNoteRequest request, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors["title"] = ["Title is required."];
        }
        else if (request.Title.Length > Note.TitleMaxLength)
        {
            errors["title"] = [$"Title must be {Note.TitleMaxLength} characters or fewer."];
        }

        // request.Body is declared non-null but the JSON binder can still leave it null on a missing field; a null
        // would hit the NOT NULL column as a 500, so it is a bad request (400), not a server error.
        if (request.Body is null)
        {
            errors["body"] = ["Body is required."];
        }
        else if (request.Body.Length > Note.BodyMaxLength)
        {
            errors["body"] = [$"Body must be {Note.BodyMaxLength} characters or fewer."];
        }

        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors);
        }

        var created = await notes.CreateAsync(request, ct);
        return TypedResults.Created($"/notes/{created.Id}", created);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteAsync(NoteService notes, Guid id, CancellationToken ct) =>
        await notes.DeleteAsync(id, ct) ? TypedResults.NoContent() : TypedResults.NotFound();
}
