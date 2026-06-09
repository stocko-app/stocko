using Hangfire.Server;
using Stocko.Api.Services;

namespace Stocko.Api.Filters;

/// <summary>
/// Regista duração de cada job Hangfire — útil para ver se um job ficou preso antes do crash.
/// </summary>
public class JobTimingFilter : IServerFilter
{
    private readonly HealthMonitorState _state;
    private readonly ILogger<JobTimingFilter> _logger;

    public JobTimingFilter(HealthMonitorState state, ILogger<JobTimingFilter> logger)
    {
        _state = state;
        _logger = logger;
    }

    public void OnPerforming(PerformingContext context)
    {
        context.Items["startedUtc"] = DateTime.UtcNow;
    }

    public void OnPerformed(PerformedContext context)
    {
        var jobName = context.BackgroundJob.Job?.Method?.Name ?? "unknown";
        var started = context.Items.TryGetValue("startedUtc", out var v) && v is DateTime dt
            ? dt
            : DateTime.UtcNow;
        var durationMs = (long)(DateTime.UtcNow - started).TotalMilliseconds;
        var success = context.Exception == null;

        _state.RecordJobRun(jobName, durationMs, success, context.Exception?.GetType().Name);

        if (success)
            _logger.LogInformation("Hangfire job {Job} concluído em {Ms}ms", jobName, durationMs);
        else
            _logger.LogError(context.Exception, "Hangfire job {Job} falhou após {Ms}ms", jobName, durationMs);
    }
}
