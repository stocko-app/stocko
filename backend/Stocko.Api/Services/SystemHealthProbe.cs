using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;

namespace Stocko.Api.Services;

public static class SystemHealthProbe
{
    private static readonly DateTime StartedAtUtc = DateTime.UtcNow;

    public static RuntimeSnapshot CaptureRuntime()
    {
        ThreadPool.GetAvailableThreads(out var workerAvailable, out var ioAvailable);
        ThreadPool.GetMaxThreads(out var workerMax, out var ioMax);

        return new RuntimeSnapshot(
            StartedAtUtc,
            (long)(DateTime.UtcNow - StartedAtUtc).TotalSeconds,
            GC.GetTotalMemory(false) / (1024 * 1024),
            workerAvailable,
            workerMax,
            ioAvailable,
            ioMax,
            Process.GetCurrentProcess().Threads.Count);
    }

    public static async Task<DbCheckResult> CheckDatabaseAsync(
        StockoDbContext db,
        TimeSpan timeout,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(timeout);

            var ok = await db.Database.CanConnectAsync(cts.Token);
            sw.Stop();
            return new DbCheckResult(ok, sw.ElapsedMilliseconds, null);
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return new DbCheckResult(false, sw.ElapsedMilliseconds, "timeout");
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new DbCheckResult(false, sw.ElapsedMilliseconds, ex.GetType().Name);
        }
    }
}

public record RuntimeSnapshot(
    DateTime StartedAtUtc,
    long UptimeSeconds,
    long GcHeapMb,
    int ThreadPoolAvailableWorkers,
    int ThreadPoolMaxWorkers,
    int ThreadPoolAvailableIo,
    int ThreadPoolMaxIo,
    int ProcessThreadCount);

public record DbCheckResult(bool Ok, long ElapsedMs, string? Error);
