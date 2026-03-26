using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class CaptainReminderJob
{
    private readonly NotificationService _notificationService;

    public CaptainReminderJob(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 CaptainReminderJob iniciado: {DateTime.UtcNow:HH:mm:ss}");
        await _notificationService.SendCaptainReminderAsync();
        Console.WriteLine($"✅ CaptainReminderJob concluído");
    }
}
