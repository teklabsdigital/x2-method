using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Kernel.Tests.Architecture;

/// <summary>
/// The sink SEC-6 talks about, made readable. Every entry any category writes is formatted the way a real provider
/// would format it, exception text included, and kept for assertion.
///
/// Exception text is included deliberately: an interpolated request object reaches a log through an exception
/// message at least as often as through a log statement, and the claim's harm paragraph is about the entry's
/// contents, not about which API produced them.
/// </summary>
internal sealed class LogCapture : ILoggerProvider
{
    private readonly ConcurrentQueue<string> _entries = new();

    public IReadOnlyList<string> Entries => [.. _entries];

    public ILogger CreateLogger(string categoryName) => new Recorder(categoryName, _entries);

    public void Dispose()
    {
    }

    private sealed class Recorder(string category, ConcurrentQueue<string> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            var text = formatter(state, exception);
            if (exception is not null)
            {
                text += Environment.NewLine + exception;
            }

            entries.Enqueue($"[{logLevel}] {category}: {text}");
        }
    }
}
