namespace Stocko.Api.Services;

/// <summary>
/// Ping periódico à BD — deixa rasto nos logs Fly antes da app ficar totalmente presa.
/// </summary>
public class DbHeartbeatBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HealthMonitorState _state;
    private readonly ILogger<DbHeartbeatBackgroundService> _logger;

    public DbHeartbeatBackgroundService(
        IServiceScopeFactory scopeFactory,
        HealthMonitorState state,
        ILogger<DbHeartbeatBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _state = state;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Esperar arranque completo (migrações, Hangfire, etc.)
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await RunHeartbeatAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromMinutes(3), stoppingToken);
        }
    }

    private async Task RunHeartbeatAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Data.StockoDbContext>();

        var result = await SystemHealthProbe.CheckDatabaseAsync(
            db, TimeSpan.FromSeconds(3), cancellationToken);
        _state.RecordDbCheck(result);

        var snap = SystemHealthProbe.CaptureRuntime();
        var degraded = !result.Ok || result.ElapsedMs >= 1000;

        if (degraded)
        {
            _logger.LogWarning(
                "DB heartbeat DEGRADED ok={Ok} ms={Ms} error={Error} consecutiveFails={Fails} " +
                "threads={Avail}/{Max} heapMb={Heap} processThreads={ProcThreads}",
                result.Ok,
                result.ElapsedMs,
                result.Error ?? "-",
                _state.ConsecutiveDbFailures,
                snap.ThreadPoolAvailableWorkers,
                snap.ThreadPoolMaxWorkers,
                snap.GcHeapMb,
                snap.ProcessThreadCount);
        }
        else
        {
            _logger.LogInformation(
                "DB heartbeat ok ms={Ms} consecutiveFails={Fails}",
                result.ElapsedMs,
                _state.ConsecutiveDbFailures);
        }
    }
}
