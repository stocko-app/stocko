namespace Stocko.Api.Services;

/// <summary>
/// Estado em memória para diagnóstico — alimenta /health/diag e logs de heartbeat.
/// </summary>
public class HealthMonitorState
{
    private readonly object _lock = new();
    private readonly Queue<JobRunRecord> _recentJobs = new();
    private const int MaxRecentJobs = 20;

    public DateTime? LastDbCheckUtc { get; private set; }
    public long? LastDbCheckMs { get; private set; }
    public bool? LastDbCheckOk { get; private set; }
    public string? LastDbCheckError { get; private set; }
    public int ConsecutiveDbFailures { get; private set; }
    public int TotalDbChecks { get; private set; }
    public int TotalDbFailures { get; private set; }

    public void RecordDbCheck(DbCheckResult result)
    {
        lock (_lock)
        {
            LastDbCheckUtc = DateTime.UtcNow;
            LastDbCheckMs = result.ElapsedMs;
            LastDbCheckOk = result.Ok;
            LastDbCheckError = result.Error;
            TotalDbChecks++;

            if (result.Ok)
                ConsecutiveDbFailures = 0;
            else
            {
                ConsecutiveDbFailures++;
                TotalDbFailures++;
            }
        }
    }

    public void RecordJobRun(string jobName, long durationMs, bool success, string? error = null)
    {
        lock (_lock)
        {
            _recentJobs.Enqueue(new JobRunRecord(jobName, DateTime.UtcNow, durationMs, success, error));
            while (_recentJobs.Count > MaxRecentJobs)
                _recentJobs.Dequeue();
        }
    }

    public IReadOnlyList<JobRunRecord> GetRecentJobs()
    {
        lock (_lock)
            return _recentJobs.ToList();
    }
}

public record JobRunRecord(
    string JobName,
    DateTime FinishedUtc,
    long DurationMs,
    bool Success,
    string? Error);
