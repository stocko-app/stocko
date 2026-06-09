using Stocko.Api.Services;
using Xunit;

namespace Stocko.Tests;

public class HealthMonitorTests
{
    [Fact]
    public void CaptureRuntime_ReturnsValidThreadPoolAndUptime()
    {
        var snap = SystemHealthProbe.CaptureRuntime();

        Assert.True(snap.UptimeSeconds >= 0);
        Assert.True(snap.ThreadPoolMaxWorkers > 0);
        Assert.True(snap.GcHeapMb >= 0);
    }

    [Fact]
    public void HealthMonitorState_TracksConsecutiveDbFailures()
    {
        var state = new HealthMonitorState();

        state.RecordDbCheck(new DbCheckResult(false, 4000, "timeout"));
        state.RecordDbCheck(new DbCheckResult(false, 4100, "timeout"));

        Assert.Equal(2, state.ConsecutiveDbFailures);
        Assert.Equal(2, state.TotalDbFailures);

        state.RecordDbCheck(new DbCheckResult(true, 45, null));

        Assert.Equal(0, state.ConsecutiveDbFailures);
        Assert.Equal(3, state.TotalDbChecks);
    }

    [Fact]
    public void HealthMonitorState_KeepsRecentJobRunsBounded()
    {
        var state = new HealthMonitorState();

        for (var i = 0; i < 25; i++)
            state.RecordJobRun($"job-{i}", i * 10, true);

        Assert.Equal(20, state.GetRecentJobs().Count);
        Assert.Equal("job-24", state.GetRecentJobs().Last().JobName);
    }
}
