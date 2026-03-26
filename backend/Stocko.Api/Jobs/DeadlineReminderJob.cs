using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class DeadlineReminderJob
{
    private readonly NotificationService _notificationService;

    public DeadlineReminderJob(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 DeadlineReminderJob iniciado: {DateTime.UtcNow:HH:mm:ss}");
        await _notificationService.SendDeadlineReminderAsync();
        Console.WriteLine($"✅ DeadlineReminderJob concluído");
    }
}
